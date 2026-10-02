import { Router } from 'express';
import {
  listPatients,
  getPatientById,
  createPatient,
  getPatientJourney,
  getMyJourney,
} from '../controllers/patientController.js';
import { getEncountersByPatient } from '../controllers/encounterController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public/authenticated patient journey
router.get('/my-journey', requireAuth, getMyJourney);

// Patient CRUD & timelines
router.get('/', requireAuth, listPatients);
router.post('/', requireAuth, createPatient);
router.get('/:id', requireAuth, getPatientById);
router.get('/:id/journey', requireAuth, getPatientJourney);
router.get('/:id/encounters', requireAuth, getEncountersByPatient);

export default router;
