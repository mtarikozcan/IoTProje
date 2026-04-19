const { getLast5MinAverage, saveSensorReading } = require('../services/sensorService');
const { putSensorRecord } = require('../services/kinesisService');
const { checkAnomaly, saveAlarm } = require('../services/anomalyService');

const VALID_SENSOR_TYPES = new Set(['energy', 'traffic']);

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function validateSensorPayload(payload) {
  if (!payload || payload.type !== 'sensor_data') {
    return 'Unsupported message type';
  }

  const requiredStringFields = ['sensorId', 'sensorType', 'unit', 'location'];
  for (const field of requiredStringFields) {
    if (typeof payload[field] !== 'string' || payload[field].trim() === '') {
      return `Missing or invalid field: ${field}`;
    }
  }

  if (!VALID_SENSOR_TYPES.has(payload.sensorType)) {
    return 'Invalid sensorType';
  }

  if (!isFiniteNumber(payload.value) || !isFiniteNumber(payload.lat) || !isFiniteNumber(payload.lng)) {
    return 'Invalid numeric payload';
  }

  if (payload.timestamp && Number.isNaN(Date.parse(payload.timestamp))) {
    return 'Invalid timestamp';
  }

  return null;
}

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

  const validationError = validateSensorPayload(payload);
  if (validationError) {
    if (payload?.type === 'sensor_data') {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: validationError,
        })
      );
    }
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
    status,
    average5m: Number(avg5m),
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  await saveSensorReading({
    ...sensorUpdate,
    lat: Number(payload.lat),
    lng: Number(payload.lng),
  });
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
