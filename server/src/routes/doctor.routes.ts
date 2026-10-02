import { Router } from 'express';
import {
  getDoctorQueue,
  getClinicalSummary,
  createConsultation,
} from '../controllers/doctorController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/queue', requireAuth, getDoctorQueue);
router.get('/patients/:id/clinical-summary', requireAuth, getClinicalSummary);
router.post('/consultations', requireAuth, createConsultation);

export default router;
