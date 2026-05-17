import { Router } from 'express';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../middleware/error-handler';
import { PdfService } from '../services/pdf.service';
import { CvService } from '../services/cv.service';
import { JobService } from '../services/job.service';
import { GeminiService } from '../services/gemini.service';
import { GenerationService } from '../services/generation.service';
import { ValidationError } from '../utils/errors';
import { optionalAuth } from '../middleware/auth';
import { supabase } from '../db/supabase';

const router = Router();

router.post(
  '/batch-process',
  optionalAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    let urls: string[] = [];
    try {
      urls = JSON.parse(req.body.urls);
      if (!Array.isArray(urls) || urls.length === 0) {
        throw new Error();
      }
    } catch {
      throw new ValidationError('Invalid urls format. Must be a JSON string array.');
    }

    // 1. Process CV
    const { text, pages } = await PdfService.extractText(req.file.buffer);
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Could not extract text from PDF');
    }

    const cv = await CvService.uploadCv(
      req.file.buffer,
      req.file.originalname,
      text,
      pages,
      req.file.size,
      req.user?.id
    );

    // 2. Create Batch Record
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .insert({
        user_id: req.user?.id,
        status: 'processing',
        total_jobs: urls.length,
        completed_jobs: 0,
      })
      .select()
      .single();

    if (batchError) {
      throw new Error(`Failed to create batch: ${batchError.message}`);
    }

    const results = [];
    let completedCount = 0;

    // 3. Process each URL
    for (const url of urls) {
      try {
        const job = await JobService.createJob(url);
        
        let generation = await GenerationService.createGenerationRecord(
          cv.id,
          job.id,
          req.user?.id,
          batch.id
        );

        await GenerationService.updateGeneration(generation.id, { status: 'processing' });

        const aiResult = await GeminiService.analyzeJobMatchAndRewrite(
          cv.original_text,
          job.requirements,
          job.keywords
        );

        const pdfBuffer = await PdfService.generateInjectedPdf(
          aiResult.visible_text,
          aiResult.invisible_injections,
          aiResult.invisible_keywords
        );

        const pdfUrl = await GenerationService.uploadGeneratedPdf(generation.id, pdfBuffer);

        generation = await GenerationService.updateGeneration(generation.id, {
          status: 'completed',
          visible_text: aiResult.visible_text,
          invisible_injections: aiResult.invisible_injections,
          invisible_keywords: aiResult.invisible_keywords,
          match_score: aiResult.match_score,
          pdf_url: pdfUrl,
          completed_at: new Date().toISOString(),
        });

        results.push(generation);
        completedCount++;
      } catch (error: any) {
        results.push({ url, error: error.message });
      }
    }

    // 4. Update Batch Record
    await supabase
      .from('batches')
      .update({
        status: completedCount === urls.length ? 'completed' : 'failed',
        completed_jobs: completedCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    res.status(201).json({
      batch_id: batch.id,
      total_jobs: urls.length,
      results,
    });
  })
);

export default router;
