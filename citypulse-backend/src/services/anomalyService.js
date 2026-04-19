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

const CRITICAL_SEVERITY_LIMITS = {
  energy: {
    high: 3.0,
    low: 0.15,
  },
  traffic: {
    high: 3.5,
    low: 0.05,
  },
};

function resolveSeverity(sensorType, direction, ratio) {
  const limits = CRITICAL_SEVERITY_LIMITS[sensorType];
  if (!limits) {
    return 'warning';
  }

  if (direction === 'high') {
    return ratio >= limits.high ? 'critical' : 'warning';
  }

  return ratio <= limits.low ? 'critical' : 'warning';
}

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
      severity: resolveSeverity(sensorData.sensorType, 'high', deviation),
      message:
        sensorData.sensorType === 'energy'
          ? `${sensorData.location} — Anormal enerji tüketimi tespit edildi`
          : `${sensorData.location} — Anormal trafik yoğunluğu tespit edildi`,
      deviation,
    };
  }

  if (value < lowThreshold) {
    const deviation = Number((value / avg5m).toFixed(2));
    return {
      severity: resolveSeverity(sensorData.sensorType, 'low', deviation),
      message:
        sensorData.sensorType === 'energy'
          ? `${sensorData.location} — Anormal düşük enerji tüketimi tespit edildi`
          : `${sensorData.location} — Trafik akışı anormal derecede düştü`,
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
    sensorId: sensorData.sensorId,
    sensorType: sensorData.sensorType,
    value: Number(sensorData.value),
    average5m: Number(sensorData.average5m || 0),
    deviation: Number(anomaly.deviation),
    severity: anomaly.severity,
    message: anomaly.message,
    resolved: false,
    timestamp: sensorData.timestamp || new Date().toISOString(),
  };

  localStore.addAlarm(alarm);
  await writeAlarmToDynamo(alarm);
  return alarm;
}

function normalizeResolvedFilter(resolved) {
  if (typeof resolved === 'boolean') {
    return resolved;
  }

  if (resolved === 'true') {
    return true;
  }

  if (resolved === 'false') {
    return false;
  }

  return undefined;
}

function filterAlarmList(items, resolved, type) {
  const normalizedResolved = normalizeResolvedFilter(resolved);

  return items.filter((alarm) => {
    const matchesResolved =
      normalizedResolved === undefined ? true : alarm.resolved === normalizedResolved;
    const matchesType = type ? alarm.sensorType === type : true;

    return matchesResolved && matchesType;
  });
}

async function getAlarms(resolved, type) {
  const localAlarms = localStore.getAlarms();
  const hasLocalData = localAlarms.length > 0 || !ALARMS_TABLE;

  if (hasLocalData) {
    return filterAlarmList(localAlarms, resolved, type);
  }

  try {
    const response = await dynamoDocumentClient.send(
      new ScanCommand({
        TableName: ALARMS_TABLE,
      })
    );

    return filterAlarmList(
      (response.Items || []).sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
      ,
      resolved,
      type
    );
  } catch (error) {
    warnOnce('dynamo-read-alarms', 'DynamoDB warning: failed to read alarms, falling back to local cache.', error);
    return filterAlarmList(localAlarms, resolved, type);
  }
}

async function findAlarmInDynamo(alarmId) {
  if (!ALARMS_TABLE) {
    return null;
  }

  try {
    const response = await dynamoDocumentClient.send(
      new ScanCommand({
        TableName: ALARMS_TABLE,
        FilterExpression: 'alarmId = :alarmId',
        ExpressionAttributeValues: {
          ':alarmId': alarmId,
        },
      })
    );

    return (response.Items || [])[0] || null;
  } catch (error) {
    warnOnce('dynamo-find-alarm', 'DynamoDB warning: failed to locate alarm for update.', error);
    return null;
  }
}

async function resolveAlarm(alarmId) {
  const localAlarm = localStore.updateAlarm(alarmId, (alarm) => ({
    ...alarm,
    resolved: true,
  }));

  if (!ALARMS_TABLE) {
    return localAlarm || null;
  }

  const alarmToUpdate = localAlarm || (await findAlarmInDynamo(alarmId));
  if (!alarmToUpdate) {
    return null;
  }

  try {
    await dynamoDocumentClient.send(
      new UpdateCommand({
        TableName: ALARMS_TABLE,
        Key: {
          alarmId,
          timestamp: alarmToUpdate.timestamp,
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

  return {
    ...alarmToUpdate,
    resolved: true,
  };
}

module.exports = {
  checkAnomaly,
  saveAlarm,
  getAlarms,
  resolveAlarm,
};
