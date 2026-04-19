const sensorReadings = new Map();
const alarms = [];

function cloneReading(reading) {
  return { ...reading };
}

function addReading(reading) {
  const entries = sensorReadings.get(reading.sensorId) || [];
  entries.push(cloneReading(reading));
  entries.sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));

  if (entries.length > 1500) {
    entries.splice(0, entries.length - 1500);
  }

  sensorReadings.set(reading.sensorId, entries);
}

function getReadings(sensorId) {
  return (sensorReadings.get(sensorId) || []).map(cloneReading);
}

function getAllReadings() {
  return Array.from(sensorReadings.values()).flat().map(cloneReading);
}

function getLatestReadings() {
  return Array.from(sensorReadings.values())
    .map((entries) => entries[entries.length - 1])
    .filter(Boolean)
    .map(cloneReading)
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
}

function addAlarm(alarm) {
  alarms.unshift({ ...alarm });

  if (alarms.length > 1000) {
    alarms.length = 1000;
  }
}

function getAlarms() {
  return alarms.map((alarm) => ({ ...alarm }));
}

function getAlarmById(alarmId) {
  const alarm = alarms.find((entry) => entry.alarmId === alarmId);
  return alarm ? { ...alarm } : null;
}

function updateAlarm(alarmId, updater) {
  const index = alarms.findIndex((alarm) => alarm.alarmId === alarmId);
  if (index === -1) {
    return null;
  }

  const nextAlarm = updater({ ...alarms[index] });
  alarms[index] = nextAlarm;
  return { ...nextAlarm };
}

module.exports = {
  addReading,
  getReadings,
  getAllReadings,
  getLatestReadings,
  addAlarm,
  getAlarms,
  getAlarmById,
  updateAlarm,
};
