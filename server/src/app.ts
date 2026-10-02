import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { getDatabase } from './config/database.js';

import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import workerRoutes from './routes/worker.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import triageRoutes from './routes/triage.routes.js';
import teleconsultRoutes from './routes/teleconsult.routes.js';
import careRequirementRoutes from './routes/careRequirement.routes.js';
import careRouteRoutes from './routes/careRoute.routes.js';
import facilityRoutes from './routes/facility.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/teleconsultations', teleconsultRoutes);
app.use('/api/care-requirements', careRequirementRoutes);
app.use('/api/care-route', careRouteRoutes);
app.use('/api/facility', facilityRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT 1 as alive').get() as { alive: number };
    res.json({
      success: true,
      status: 'healthy',
      database: result.alive === 1 ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: (err as Error).message,
    });
  }
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'SETHU API',
    version: '0.1.0',
    description: 'Care Access + Care Continuity Platform for rural and underserved communities',
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
