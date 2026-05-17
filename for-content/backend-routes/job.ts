import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { JobService } from '../services/job.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const analyzeJobSchema = z.object({
  url: z.string().url('Must be a valid URL'),
});

router.post(
  '/analyze-job',
  asyncHandler(async (req, res) => {
    const parseResult = analyzeJobSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid input', parseResult.error.errors);
    }

    const { url } = parseResult.data;

    // Basic validation for LinkedIn URL (can be expanded)
    if (!url.includes('linkedin.com/jobs')) {
      // We allow it but might warn, or we can strictly enforce it.
      // For now, we just proceed.
    }

    const job = await JobService.createJob(url);

    res.status(201).json({
      job_id: job.id,
      title: job.title,
      company: job.company,
      requirements: job.requirements,
      keywords: job.keywords,
      seniority: job.seniority,
    });
  })
);

export default router;
