import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { apiLimiter } from './middleware/rate-limit';

// Routes
import healthRoutes from './routes/health';
import cvRoutes from './routes/cv';
import jobRoutes from './routes/job';
import generationRoutes from './routes/generation';
import batchRoutes from './routes/batch';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api', cvRoutes);
app.use('/api', jobRoutes);
app.use('/api', generationRoutes);
app.use('/api', batchRoutes);

// Error handling
app.use(errorHandler);

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});
