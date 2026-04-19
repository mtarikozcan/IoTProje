require('dotenv').config();

const WebSocket = require('ws');

const WS_URL = process.env.SIMULATOR_WS_URL || `ws://localhost:${process.env.WS_PORT || 8080}`;
const SIMULATOR_INTERVAL = Number(process.env.SIMULATOR_INTERVAL || 3000);

const sensors = [
  {
    sensorId: 'energy-01',
    sensorType: 'energy',
    location: 'Levent AVM',
    unit: 'kWh',
    min: 150,
    max: 400,
    lat: 41.0824,
    lng: 29.01,
    phase: 0.2,
    count: 0,
  },
  {
    sensorId: 'energy-02',
    sensorType: 'energy',
    location: 'Maslak Ofis Kulesi',
    unit: 'kWh',
    min: 200,
    max: 600,
    lat: 41.1128,
    lng: 29.0208,
    phase: 0.7,
    count: 0,
  },
  {
    sensorId: 'energy-03',
    sensorType: 'energy',
    location: 'Kadıköy Hastanesi',
    unit: 'kWh',
    min: 300,
    max: 700,
    lat: 40.9908,
    lng: 29.03,
    phase: 1.3,
    count: 0,
  },
  {
    sensorId: 'energy-04',
    sensorType: 'energy',
    location: 'Beşiktaş Metro İstasyonu',
    unit: 'kWh',
    min: 100,
    max: 300,
    lat: 41.043,
    lng: 29.007,
    phase: 2.1,
    count: 0,
  },
  {
    sensorId: 'energy-05',
    sensorType: 'energy',
    location: 'Şişli Okul Binası',
    unit: 'kWh',
    min: 80,
    max: 250,
    lat: 41.0602,
    lng: 28.987,
    phase: 2.7,
    count: 0,
  },
  {
    sensorId: 'traffic-01',
    sensorType: 'traffic',
    location: 'E5 Bağcılar Kavşağı',
    unit: 'araç/dk',
    min: 80,
    max: 200,
    lat: 41.036,
    lng: 28.856,
    phase: 0.4,
    count: 0,
  },
  {
    sensorId: 'traffic-02',
    sensorType: 'traffic',
    location: 'TEM Mahmutbey',
    unit: 'araç/dk',
    min: 100,
    max: 280,
    lat: 41.049,
    lng: 28.82,
    phase: 1.1,
    count: 0,
  },
  {
    sensorId: 'traffic-03',
    sensorType: 'traffic',
    location: 'Boğaz Köprüsü Gişe',
    unit: 'araç/dk',
    min: 60,
    max: 180,
    lat: 41.0455,
    lng: 29.0338,
    phase: 1.8,
    count: 0,
  },
  {
    sensorId: 'traffic-04',
    sensorType: 'traffic',
    location: 'Kadıköy Meydan',
    unit: 'araç/dk',
    min: 40,
    max: 120,
    lat: 40.9908,
    lng: 29.0242,
    phase: 2.4,
    count: 0,
  },
  {
    sensorId: 'traffic-05',
    sensorType: 'traffic',
    location: 'Taksim Kavşağı',
    unit: 'araç/dk',
    min: 50,
    max: 150,
    lat: 41.0369,
    lng: 28.985,
    phase: 3.0,
    count: 0,
  },
];

let ws;
let reconnectTimer = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function gaussian(center, width, point) {
  return Math.exp(-Math.pow((point - center) / width, 2));
}

function getEnergyPattern(hourOfDay) {
  const morningRamp = gaussian(9, 2.8, hourOfDay) * 0.24;
  const middayPeak = gaussian(13, 3.2, hourOfDay) * 0.42;
  const eveningTail = gaussian(18.5, 2.8, hourOfDay) * 0.12;
  return 0.72 + morningRamp + middayPeak + eveningTail;
}

function getTrafficPattern(hourOfDay) {
  const morningRush = gaussian(8, 1.8, hourOfDay) * 0.72;
  const eveningRush = gaussian(18, 2.1, hourOfDay) * 0.88;
  const middayFlow = gaussian(13, 3.8, hourOfDay) * 0.18;
  return 0.55 + morningRush + eveningRush + middayFlow;
}

function generateValue(sensor) {
  sensor.count += 1;
  const now = new Date();
  const hourOfDay = now.getHours() + now.getMinutes() / 60;
  const span = sensor.max - sensor.min;
  const patternFactor =
    sensor.sensorType === 'energy' ? getEnergyPattern(hourOfDay) : getTrafficPattern(hourOfDay);
  const baseline = sensor.min + span * 0.5 * patternFactor;
  const wave = Math.sin(sensor.count / 5 + sensor.phase) * span * 0.08;
  const noise = (Math.random() - 0.5) * span * (sensor.sensorType === 'traffic' ? 0.08 : 0.06);

  let value = baseline + wave + noise;
  value = clamp(value, sensor.min, sensor.max);

  if (sensor.count % 60 === 0 && Math.random() < 0.1) {
    value = Math.random() < 0.5 ? value * 3 : value * 0.1;
  }

  return Number(value.toFixed(2));
}

function sendSensorBatch() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const timestamp = new Date().toISOString();

  sensors.forEach((sensor) => {
    ws.send(
      JSON.stringify({
        type: 'sensor_data',
        sensorId: sensor.sensorId,
        sensorType: sensor.sensorType,
        value: generateValue(sensor),
        unit: sensor.unit,
        location: sensor.location,
        lat: sensor.lat,
        lng: sensor.lng,
        timestamp,
      })
    );
  });
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 3000);
}

function connect() {
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log(`Simulator connected to ${WS_URL}`);
  });

  ws.on('close', () => {
    console.warn('Simulator warning: backend unavailable or connection lost. Retrying in 3 seconds.');
    scheduleReconnect();
  });

  ws.on('error', () => {
    // Close handler prints the retry warning once per failed attempt.
  });
}

connect();
setInterval(sendSensorBatch, SIMULATOR_INTERVAL);
