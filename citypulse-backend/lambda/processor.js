require('dotenv').config();

const { saveSensorReading, getLast5MinAverage } = require('../src/services/sensorService');
const { checkAnomaly, saveAlarm } = require('../src/services/anomalyService');

async function processRecord(record) {
  try {
    const decoded = Buffer.from(record.kinesis.data, 'base64').toString('utf8');
    const sensorData = JSON.parse(decoded);

    await saveSensorReading(sensorData);
    const average5m = (await getLast5MinAverage(sensorData.sensorId)) || Number(sensorData.value);
    const anomaly = checkAnomaly(sensorData, average5m);

    if (anomaly) {
      await saveAlarm(
        {
          ...sensorData,
          average5m,
        },
        anomaly
      );
    }

    return {
      ok: true,
      sensorId: sensorData.sensorId,
    };
  } catch (error) {
    console.warn('Lambda warning: failed to process Kinesis record.', error.message || error);
    return {
      ok: false,
      error: error.message || String(error),
    };
  }
}

async function handler(event = { Records: [] }) {
  const records = event.Records || [];
  const results = [];

  for (const record of records) {
    results.push(await processRecord(record));
  }

  return {
    processed: results.length,
    results,
  };
}

module.exports = {
  handler,
};
