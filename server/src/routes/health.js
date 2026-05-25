import { Router } from 'express';
import { healthCheck, liveness, readiness } from '../controllers/healthController.js';

const router = Router();

router.get('/', healthCheck);
router.get('/live', liveness);
router.get('/ready', readiness);

export default router;
