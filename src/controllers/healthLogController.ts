import { Request, Response } from 'express';
import HealthLog from '../models/HealthLog';

// Wellness score algorithm
// Sleep 30% | Hydration 25% | Fitness 20% | Mood 15% | Skincare 10%
const calcWellnessScore = (body: any): number => {
  const sleepScore  = ((body.sleep?.quality || 3) / 5) * 30;
  const hydScore    = Math.min((body.diet?.hydration || 0) / 2.5, 1) * 25;
  const fitScore    = (body.fitness?.length || 0) > 0 ? 20 : 0;
  const moodScore   = ((body.mentalWellness?.moodRating || 3) / 5) * 15;
  const skinScore   = (body.skincare?.productsUsed?.length || 0) > 0 ? 10 : 0;
  return Math.round(sleepScore + hydScore + fitScore + moodScore + skinScore);
};

// POST /api/v1/health-log
export const createLog = async (req: Request, res: Response) => {
  try {
    const userId       = (req as any).user._id;
    const wellnessScore = calcWellnessScore(req.body);
    const log = await HealthLog.create({ ...req.body, userId, wellnessScore });
    res.status(201).json({ success: true, data: log });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/v1/health-log
export const getLogs = async (req: Request, res: Response) => {
  try {
    const userId  = (req as any).user._id;
    const limit   = Number(req.query.limit) || 30;
    const page    = Number(req.query.page)  || 1;
    const logs    = await HealthLog.find({ userId }).sort({ date: -1 }).limit(limit).skip((page - 1) * limit);
    const total   = await HealthLog.countDocuments({ userId });
    res.json({ success: true, count: logs.length, total, page, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/health-log/:id
export const getLogById = async (req: Request, res: Response) => {
  try {
    const log = await HealthLog.findOne({ _id: req.params.id, userId: (req as any).user._id });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found.' });
    res.json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/health-log/:id
export const updateLog = async (req: Request, res: Response) => {
  try {
    const userId        = (req as any).user._id;
    const wellnessScore = calcWellnessScore(req.body);
    const log = await HealthLog.findOneAndUpdate(
      { _id: req.params.id, userId },
      { ...req.body, wellnessScore },
      { new: true, runValidators: true }
    );
    if (!log) return res.status(404).json({ success: false, message: 'Log not found.' });
    res.json({ success: true, data: log });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/health-log/:id
export const deleteLog = async (req: Request, res: Response) => {
  try {
    const log = await HealthLog.findOneAndDelete({ _id: req.params.id, userId: (req as any).user._id });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found.' });
    res.json({ success: true, message: 'Log deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/health-log/analytics/weekly
export const getWeeklyAnalytics = async (req: Request, res: Response) => {
  try {
    const userId       = (req as any).user._id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logs         = await HealthLog.find({ userId, date: { $gte: sevenDaysAgo } }).sort({ date: 1 });
    const count        = logs.length || 1;

    res.json({
      success: true,
      data: {
        avgWellnessScore: Math.round(logs.reduce((s, l) => s + (l.wellnessScore || 0), 0) / count),
        avgSleepDuration: +(logs.reduce((s, l) => s + (l.sleep?.duration || 0), 0) / count).toFixed(1),
        avgMoodRating:    +(logs.reduce((s, l) => s + (l.mentalWellness?.moodRating || 0), 0) / count).toFixed(1),
        avgHydration:     +(logs.reduce((s, l) => s + (l.diet?.hydration || 0), 0) / count).toFixed(1),
        totalWorkouts:    logs.reduce((s, l) => s + (l.fitness?.length || 0), 0),
        logsThisWeek:     logs.length,
        weeklyTrend:      logs.map(l => ({ date: l.date, score: l.wellnessScore || 0 })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
