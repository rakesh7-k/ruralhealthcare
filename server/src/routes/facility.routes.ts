import { Router } from 'express';
import {
  getFacilityDashboard,
  updateReferralStatus,
  uploadDiagnosticResult,
  dispenseMedicine,
  updateResourceStatus,
} from '../controllers/facilityController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', requireAuth, getFacilityDashboard);
router.post('/referrals/:id/status', requireAuth, updateReferralStatus);
router.post('/diagnostics/:id/result', requireAuth, uploadDiagnosticResult);
router.post('/medicines/dispense', requireAuth, dispenseMedicine);
router.post('/resources/update', requireAuth, updateResourceStatus);

export default router;
