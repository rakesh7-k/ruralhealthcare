import { Router } from 'express';
import {
  getCareRequirementById,
  createCareRequirement,
} from '../controllers/careRequirementController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:id', requireAuth, getCareRequirementById);
router.post('/', requireAuth, createCareRequirement);

export default router;
