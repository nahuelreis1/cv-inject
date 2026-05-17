import multer from 'multer';
import { env } from '../config/env';
import { ValidationError } from '../utils/errors';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new ValidationError('Only PDF files are allowed'));
    }
  },
});
