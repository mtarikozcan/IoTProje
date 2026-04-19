const express = require('express');

const { getAlarms, resolveAlarm } = require('../services/anomalyService');

const router = express.Router();
const VALID_SENSOR_TYPES = new Set(['energy', 'traffic']);

router.get('/alarms', async (req, res, next) => {
  try {
    if (req.query.type && !VALID_SENSOR_TYPES.has(req.query.type)) {
      res.status(400).json({ message: 'Query parameter "type" must be "energy" or "traffic"' });
      return;
    }

    const alarms = await getAlarms(req.query.resolved, req.query.type);
    res.json(alarms);
  } catch (error) {
    next(error);
  }
});

router.put('/alarms/:id/resolve', async (req, res, next) => {
  try {
    const alarm = await resolveAlarm(req.params.id);

    if (!alarm) {
      res.status(404).json({ message: 'Alarm not found' });
      return;
    }

    res.json(alarm);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
