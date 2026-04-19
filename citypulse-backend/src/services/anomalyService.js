const { PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const { dynamoDocumentClient } = require('../config/dynamodb');
const localStore = require('./localStore');
const { warnOnce } = require('../utils/warnOnce');

const ALARMS_TABLE = process.env.DYNAMODB_TABLE_ALARMS;

const THRESHOLDS = {
  energy: {
    high: 2.0,
    low: 0.3,
  },
  traffic: {
    high: 2.5,
    low: 0.1,
  },
};

function checkAnomaly(sensorData, avg5m) {
  const thresholds = THRESHOLDS[sensorData.sensorType];
  if (!thresholds || !avg5m || avg5m <= 0) {
    return null;
  }

  const value = Number(sensorData.value);
  const highThreshold = avg5m * thresholds.high;
  const lowThreshold = avg5m * thresholds.low;

  if (value > highThreshold) {
    const deviation = Number((value / avg5m).toFixed(2));
    return {
      severity: deviation >= thresholds.high + 0.5 ? 'critical' : 'warning',
      message:
        sensorData.sensorType === 'energy'
          ? `${sensorData.location} - Anormal enerji tuketimi tespit edildi`
          : `${sensorData.location} - Anormal trafik yogunlugu tespit edildi`,
      deviation,
    };
  }

  if (value < lowThreshold) {
    const deviation = Number((value / avg5m).toFixed(2));
    return {
      severity: deviation <= thresholds.low / 2 ? 'critical' : 'warning',
      message:
        sensorData.sensorType === 'energy'
          ? `${sensorData.location} - Anormal dusuk enerji tuketimi tespit edildi`
          : `${sensorData.location} - Trafik akisi anormal derecede dustu`,
      deviation,
    };
  }

  return null;
}

async function writeAlarmToDynamo(alarm) {
  if (!ALARMS_TABLE) {
    warnOnce('missing-alarms-table', 'DynamoDB warning: DYNAMODB_TABLE_ALARMS is not configured, using local in-memory storage for alarms.');
    return;
  }

  try {
    await dynamoDocumentClient.send(
      new PutCommand({
        TableName: ALARMS_TABLE,
        Item: alarm,
      })
    );
  } catch (error) {
    warnOnce('dynamo-write-alarm', 'DynamoDB warning: failed to persist alarm, continuing with in-memory storage.', error);
  }
}

async function saveAlarm(sensorData, anomaly) {
  const alarm = {
    alarmId: uuidv4(),
    timestamp: sensorData.timestamp || new Date().toISOString(),
    sensorId: sensorData.sensorId,
    sensorType: sensorData.sensorType,
    value: Number(sensorData.value),
    average5m: Number(sensorData.average5m || 0),
    deviation: Number(anomaly.deviation),
    severity: anomaly.severity,
    message: anomaly.message,
    resolved: false,
    location: sensorData.location,
  };

  localStore.addAlarm(alarm);
  await writeAlarmToDynamo(alarm);
  return alarm;
}

async function getAlarms(resolved) {
  const localAlarms = localStore.getAlarms();
  const hasLocalData = localAlarms.length > 0 || !ALARMS_TABLE;
  const normalizedResolved =
    typeof resolved === 'boolean' ? resolved : resolved === 'true' ? true : resolved === 'false' ? false : undefined;

  const filterResolved = (items) =>
    normalizedResolved === undefined ? items : items.filter((alarm) => alarm.resolved === normalizedResolved);

  if (hasLocalData) {
    return filterResolved(localAlarms);
  }

  try {
    const response = await dynamoDocumentClient.send(
      new ScanCommand({
        TableName: ALARMS_TABLE,
      })
    );

    return filterResolved(
      (response.Items || []).sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    );
  } catch (error) {
    warnOnce('dynamo-read-alarms', 'DynamoDB warning: failed to read alarms, falling back to local cache.', error);
    return filterResolved(localAlarms);
  }
}

async function resolveAlarm(alarmId) {
  const localAlarm = localStore.updateAlarm(alarmId, (alarm) => ({
    ...alarm,
    resolved: true,
  }));

  if (!ALARMS_TABLE) {
    return localAlarm;
  }

  try {
    await dynamoDocumentClient.send(
      new UpdateCommand({
        TableName: ALARMS_TABLE,
        Key: {
          alarmId,
          timestamp: localAlarm ? localAlarm.timestamp : undefined,
        },
        UpdateExpression: 'SET resolved = :resolved',
        ExpressionAttributeValues: {
          ':resolved': true,
        },
      })
    );
  } catch (error) {
    warnOnce('dynamo-resolve-alarm', 'DynamoDB warning: failed to update alarm resolution in DynamoDB.', error);
  }

  return localAlarm;
}

module.exports = {
  checkAnomaly,
  saveAlarm,
  getAlarms,
  resolveAlarm,
};

