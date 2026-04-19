const { QueryCommand, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const { dynamoDocumentClient } = require('../config/dynamodb');
const localStore = require('./localStore');
const { warnOnce } = require('../utils/warnOnce');

const READINGS_TABLE = process.env.DYNAMODB_TABLE_READINGS;
const ANOMALY_WINDOW_MINUTES = Number(process.env.ANOMALY_WINDOW_MINUTES || 5);
const TTL_SECONDS = 48 * 60 * 60;

function toTimestampMs(value) {
  return new Date(value).getTime();
}

function sortReadingsDesc(readings) {
  return [...readings].sort((left, right) => toTimestampMs(right.timestamp) - toTimestampMs(left.timestamp));
}

function filterReadingsByPeriod(readings, period) {
  if (!period) {
    return readings;
  }

  const windowMap = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
  };
  const windowMs = windowMap[period];

  if (!windowMs) {
    return readings;
  }

  const threshold = Date.now() - windowMs;
  return readings.filter((reading) => toTimestampMs(reading.timestamp) >= threshold);
}

async function writeReadingToDynamo(reading) {
  if (!READINGS_TABLE) {
    warnOnce('missing-readings-table', 'DynamoDB warning: DYNAMODB_TABLE_READINGS is not configured, using local in-memory storage.');
    return;
  }

  try {
    await dynamoDocumentClient.send(
      new PutCommand({
        TableName: READINGS_TABLE,
        Item: reading,
      })
    );
  } catch (error) {
    warnOnce('dynamo-write-reading', 'DynamoDB warning: failed to persist sensor reading, continuing with in-memory storage.', error);
  }
}

async function loadReadingsFromDynamo(sensorId, limit) {
  if (!READINGS_TABLE) {
    return [];
  }

  try {
    const response = await dynamoDocumentClient.send(
      new QueryCommand({
        TableName: READINGS_TABLE,
        KeyConditionExpression: 'sensorId = :sensorId',
        ExpressionAttributeValues: {
          ':sensorId': sensorId,
        },
        ScanIndexForward: false,
        Limit: limit,
      })
    );

    return response.Items || [];
  } catch (error) {
    warnOnce('dynamo-read-history', 'DynamoDB warning: failed to read sensor history, falling back to local cache.', error);
    return [];
  }
}

async function loadLatestReadingsFromDynamo() {
  if (!READINGS_TABLE) {
    return [];
  }

  try {
    const response = await dynamoDocumentClient.send(
      new ScanCommand({
        TableName: READINGS_TABLE,
      })
    );

    const items = response.Items || [];
    const latestBySensor = new Map();

    items.forEach((item) => {
      const current = latestBySensor.get(item.sensorId);
      if (!current || toTimestampMs(item.timestamp) > toTimestampMs(current.timestamp)) {
        latestBySensor.set(item.sensorId, item);
      }
    });

    return sortReadingsDesc(Array.from(latestBySensor.values()));
  } catch (error) {
    warnOnce('dynamo-latest-readings', 'DynamoDB warning: failed to load latest readings, falling back to local cache.', error);
    return [];
  }
}

function buildReading(data) {
  const lat = Number(data.lat);
  const lng = Number(data.lng);

  return {
    sensorId: data.sensorId,
    timestamp: data.timestamp || new Date().toISOString(),
    sensorType: data.sensorType,
    value: Number(data.value),
    unit: data.unit,
    location: data.location,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    status: data.status || 'normal',
    average5m: Number(data.average5m || data.value || 0),
    ttl: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
}

async function saveSensorReading(data) {
  const reading = buildReading(data);
  localStore.addReading(reading);
  await writeReadingToDynamo(reading);
  return reading;
}

async function getLatestReadings() {
  const localReadings = localStore.getLatestReadings();
  if (localReadings.length > 0) {
    return localReadings;
  }

  return loadLatestReadingsFromDynamo();
}

async function getSensorHistory(sensorId, limit = 100) {
  const localReadings = localStore.getReadings(sensorId);
  if (localReadings.length > 0) {
    return sortReadingsDesc(localReadings).slice(0, limit);
  }

  return loadReadingsFromDynamo(sensorId, limit);
}

async function getSensorStats(sensorId, period) {
  const history = filterReadingsByPeriod(await getSensorHistory(sensorId, 500), period);

  if (history.length === 0) {
    return {
      sensorId,
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
    };
  }

  const values = history.map((reading) => Number(reading.value));
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    sensorId,
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Number((total / values.length).toFixed(2)),
  };
}

async function getLast5MinAverage(sensorId) {
  const history = await getSensorHistory(sensorId, 500);
  if (history.length === 0) {
    return null;
  }

  const threshold = Date.now() - ANOMALY_WINDOW_MINUTES * 60 * 1000;
  const recentReadings = history.filter(
    (reading) => toTimestampMs(reading.timestamp) >= threshold
  );
  if (recentReadings.length === 0) {
    return null;
  }

  const source = recentReadings;
  const total = source.reduce((sum, reading) => sum + Number(reading.value), 0);

  return Number((total / source.length).toFixed(2));
}

async function countReadingsInLastHour() {
  const threshold = Date.now() - 60 * 60 * 1000;
  const localCount = localStore
    .getAllReadings()
    .filter((reading) => toTimestampMs(reading.timestamp) >= threshold).length;

  if (localCount > 0 || !READINGS_TABLE) {
    return localCount;
  }

  try {
    const response = await dynamoDocumentClient.send(
      new ScanCommand({
        TableName: READINGS_TABLE,
      })
    );

    return (response.Items || []).filter(
      (reading) => toTimestampMs(reading.timestamp) >= threshold
    ).length;
  } catch (error) {
    warnOnce('dynamo-summary-readings', 'DynamoDB warning: failed to calculate recent reading count.', error);
    return localCount;
  }
}

module.exports = {
  saveSensorReading,
  getLatestReadings,
  getSensorHistory,
  getSensorStats,
  getLast5MinAverage,
  countReadingsInLastHour,
};
