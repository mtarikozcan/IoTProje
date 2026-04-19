const { getLast5MinAverage, saveSensorReading } = require('../services/sensorService');
const { putSensorRecord } = require('../services/kinesisService');
const { checkAnomaly, saveAlarm } = require('../services/anomalyService');

async function handleMessage(ws, rawMessage, broadcastFn) {
  let payload;

  try {
    payload = JSON.parse(rawMessage.toString());
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Invalid JSON payload',
      })
    );
    return;
  }

  if (payload.type !== 'sensor_data') {
    return;
  }

  const avg5m = (await getLast5MinAverage(payload.sensorId)) || Number(payload.value);
  const anomaly = checkAnomaly(payload, avg5m);
  const status = anomaly ? anomaly.severity : 'normal';

  const sensorUpdate = {
    type: 'sensor_update',
    sensorId: payload.sensorId,
    sensorType: payload.sensorType,
    value: Number(payload.value),
    unit: payload.unit,
    location: payload.location,
    lat: Number(payload.lat),
    lng: Number(payload.lng),
    status,
    average5m: Number(avg5m),
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  await saveSensorReading(sensorUpdate);
  await putSensorRecord(sensorUpdate);
  broadcastFn(sensorUpdate);

  if (!anomaly) {
    return;
  }

  const alarm = await saveAlarm(sensorUpdate, anomaly);
  broadcastFn({
    type: 'alarm',
    ...alarm,
  });
}

module.exports = {
  handleMessage,
};

