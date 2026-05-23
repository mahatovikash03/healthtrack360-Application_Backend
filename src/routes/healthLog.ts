import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  createLog, getLogs, getLogById,
  updateLog, deleteLog, getWeeklyAnalytics,
} from '../controllers/healthLogController';

const router = Router();
router.use(protect);

router.post('/',                 createLog);
router.get('/',                  getLogs);
router.get('/analytics/weekly',  getWeeklyAnalytics);
router.get('/:id',               getLogById);
router.put('/:id',               updateLog);
router.delete('/:id',            deleteLog);

export default router;
