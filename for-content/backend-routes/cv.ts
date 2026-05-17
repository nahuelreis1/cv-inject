import { Router } from 'express';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../middleware/error-handler';
import { PdfService } from '../services/pdf.service';
import { CvService } from '../services/cv.service';
import { ValidationError } from '../utils/errors';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post(
  '/upload-cv',
  optionalAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

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

    res.status(201).json({
      cv_id: cv.id,
      filename: cv.filename,
      text_preview: text.substring(0, 500),
      pages: cv.pages,
      file_size: cv.file_size,
    });
  })
);

export default router;
