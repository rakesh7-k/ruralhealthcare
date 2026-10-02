import { Router } from 'express';
import {
  evaluateCareRoute,
  getCareRouteEvaluation,
  confirmCareRoute,
} from '../controllers/careRouteController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/evaluate', requireAuth, evaluateCareRoute);
router.get('/evaluation/:id', requireAuth, getCareRouteEvaluation);
router.post('/confirm', requireAuth, confirmCareRoute);

export default router;
