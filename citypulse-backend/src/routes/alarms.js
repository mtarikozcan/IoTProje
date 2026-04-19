const express = require('express');

const { getAlarms, resolveAlarm } = require('../services/anomalyService');

const router = express.Router();

router.get('/alarms', async (req, res, next) => {
  try {
    const alarms = await getAlarms(req.query.resolved);
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

