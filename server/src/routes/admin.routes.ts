import { Router } from 'express';
import { getDistrictDashboard } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', requireAuth, getDistrictDashboard);

export default router;
