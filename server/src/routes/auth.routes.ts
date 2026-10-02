import { Router } from 'express';
import { login, demoLogin, getMe, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

export default router;
