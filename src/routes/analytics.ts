import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import HealthLog from '../models/HealthLog';

const router = Router();
router.use(protect);

// GET /api/v1/analytics/monthly
router.get('/monthly', async (req: Request, res: Response) => {
  try {
    const userId       = (req as any).user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const logs = await HealthLog.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: 1 });

    const count = logs.length || 1;

    const avgWellnessScore = Math.round(
      logs.reduce((s, l) => s + (l.wellnessScore || 0), 0) / count
    );
    const avgSleepDuration = +(
      logs.reduce((s, l) => s + (l.sleep?.duration || 0), 0) / count
    ).toFixed(1);
    const avgMoodRating = +(
      logs.reduce((s, l) => s + (l.mentalWellness?.moodRating || 0), 0) / count
    ).toFixed(1);
    const avgHydration = +(
      logs.reduce((s, l) => s + (l.diet?.hydration || 0), 0) / count
    ).toFixed(1);
    const totalWorkouts = logs.reduce((s, l) => s + (l.fitness?.length || 0), 0);
    const totalLogs     = logs.length;

    const monthlyTrend = logs.map(l => ({
      date:  l.date,
      score: l.wellnessScore || 0,
    }));

    res.json({
      success: true,
      data: {
        avgWellnessScore,
        avgSleepDuration,
        avgMoodRating,
        avgHydration,
        totalWorkouts,
        totalLogs,
        monthlyTrend,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
