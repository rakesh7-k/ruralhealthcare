import { Router } from 'express';
import {
  listTeleconsultations,
  getTeleconsultationById,
  completeTeleconsultation,
  createTeleconsultation,
  startTeleconsultation,
  saveTeleconsultationSnapshot,
} from '../controllers/teleconsultationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listTeleconsultations);
router.post('/', requireAuth, createTeleconsultation);
router.get('/:id', requireAuth, getTeleconsultationById);
router.post('/:id/start', requireAuth, startTeleconsultation);
router.post('/:id/snapshot', requireAuth, saveTeleconsultationSnapshot);
router.post('/:id/complete', requireAuth, completeTeleconsultation);

export default router;
