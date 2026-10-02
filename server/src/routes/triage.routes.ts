import { Router, Request, Response } from 'express';
import { evaluateTriage } from '../services/triageEngine.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/evaluate', requireAuth, (req: Request, res: Response) => {
  const { vitals, symptoms, warningSigns, medicalHistoryFlags } = req.body;
  const analysis = evaluateTriage({ vitals, symptoms, warningSigns, medicalHistoryFlags });
  res.json({
    success: true,
    data: analysis,
  });
});

export default router;
