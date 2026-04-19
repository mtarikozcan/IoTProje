const express = require('express');

const {
  getLatestReadings,
  getSensorHistory,
  getSensorStats,
  countReadingsInLastHour,
} = require('../services/sensorService');
const { getAlarms } = require('../services/anomalyService');

const router = express.Router();

router.get('/sensors', async (_req, res, next) => {
  try {
    const readings = await getLatestReadings();
    res.json(readings);
  } catch (error) {
    next(error);
  }
});

router.get('/sensors/:id/history', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 100);
    const readings = await getSensorHistory(req.params.id, limit);
    res.json(readings);
  } catch (error) {
    next(error);
  }
});

router.get('/sensors/:id/stats', async (req, res, next) => {
  try {
    const stats = await getSensorStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/summary', async (_req, res, next) => {
  try {
    const [latestReadings, activeAlarmList, recentReadingCount] = await Promise.all([
      getLatestReadings(),
      getAlarms(false),
      countReadingsInLastHour(),
    ]);

    res.json({
      activeSensors: latestReadings.length,
      readingsLastHour: recentReadingCount,
      activeAlarms: activeAlarmList.length,
      systemStatus: activeAlarmList.length > 0 ? 'warning' : 'healthy',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

