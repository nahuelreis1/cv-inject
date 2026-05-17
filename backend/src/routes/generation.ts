import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { CvService } from '../services/cv.service';
import { JobService } from '../services/job.service';
import { getAiProvider } from '../services/ai-provider';
import { PdfService } from '../services/pdf.service';
import { GenerationService } from '../services/generation.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { optionalAuth } from '../middleware/auth';
import { supabase } from '../db/supabase';
import { env } from '../config/env';

const router = Router();

const generateCvSchema = z.object({
  cv_id: z.string().uuid(),
  job_ids: z.array(z.string().uuid()).min(1),
  preserve_design: z.boolean().optional().default(false),
});

router.post(
  '/generate-cv',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const parseResult = generateCvSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid input', parseResult.error.errors);
    }

    const { cv_id, job_ids, preserve_design } = parseResult.data;

    const cv = await CvService.getCvById(cv_id);
    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    const results = [];

    for (const job_id of job_ids) {
      const job = await JobService.getJobById(job_id);
      if (!job) {
        results.push({ job_id, error: 'Job not found' });
        continue;
      }

      // Create generation record
      let generation = await GenerationService.createGenerationRecord(
        cv.id,
        job.id,
        req.user?.id
      );

      try {
        // Update status to processing
        await GenerationService.updateGeneration(generation.id, { status: 'processing' });

        // Call AI Provider
        const ai = await getAiProvider();
        const aiResult = await ai.analyzeJobMatchAndRewrite(
          cv.original_text,
          job.requirements,
          job.keywords,
          job.title
        );

        // Generate PDF
        let pdfBuffer: Buffer;
        if (preserve_design) {
          const originalBuffer = await CvService.getCvPdfBuffer(cv.id);
          pdfBuffer = await PdfService.injectIntoExistingPdf(
            originalBuffer,
            aiResult.invisible_injections,
            aiResult.invisible_keywords,
            job.title
          );
        } else {
          pdfBuffer = await PdfService.generateInjectedPdf(
            aiResult.visible_text,
            aiResult.invisible_injections,
            aiResult.invisible_keywords
          );
        }

        // Upload PDF
        const pdfUrl = await GenerationService.uploadGeneratedPdf(generation.id, pdfBuffer);

        // Update generation record
        generation = await GenerationService.updateGeneration(generation.id, {
          status: 'completed',
          visible_text: aiResult.visible_text,
          invisible_injections: aiResult.invisible_injections,
          invisible_keywords: aiResult.invisible_keywords,
          match_score: aiResult.match_score,
          pdf_url: pdfUrl,
          completed_at: new Date().toISOString(),
        });

        results.push({
          generation_id: generation.id,
          job_id: job.id,
          job_title: job.title,
          company: job.company,
          download_url: `/api/download/${generation.id}`,
          match_score: generation.match_score,
          preview_text: generation.visible_text.substring(0, 500),
          visible_text: generation.visible_text,
          invisible_injections: generation.invisible_injections,
          invisible_keywords: generation.invisible_keywords,
        });
      } catch (error: any) {
        await GenerationService.updateGeneration(generation.id, {
          status: 'failed',
          error_message: error.message,
        });
        results.push({ job_id, error: error.message });
      }
    }

    res.json({ generations: results });
  })
);

router.get(
  '/download/:generation_id',
  asyncHandler(async (req, res) => {
    const { generation_id } = req.params;

    const generation = await GenerationService.getGenerationById(generation_id);
    if (!generation || !generation.pdf_url) {
      throw new NotFoundError('Generation or PDF not found');
    }

    const { data, error } = await supabase.storage
      .from(env.STORAGE_BUCKET_CV_OUTPUTS)
      .download(generation.pdf_url);

    if (error || !data) {
      throw new Error('Failed to download PDF from storage');
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="optimized-cv-${generation_id}.pdf"`);
    res.send(buffer);
  })
);

export default router;
