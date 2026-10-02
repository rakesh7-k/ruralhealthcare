import { Router } from 'express';
import { getWorkerDashboard } from '../controllers/workerController.js';
import { createEncounter } from '../controllers/encounterController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', requireAuth, getWorkerDashboard);
router.post('/encounters', requireAuth, createEncounter);

export default router;
