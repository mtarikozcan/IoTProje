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
    count: 0,
  },
  {
    sensorId: 'energy-03',
    sensorType: 'energy',
    location: 'Kadikoy Hastanesi',
    unit: 'kWh',
    min: 300,
    max: 700,
    lat: 40.9908,
    lng: 29.03,
    count: 0,
  },
  {
    sensorId: 'energy-04',
    sensorType: 'energy',
    location: 'Besiktas Metro',
    unit: 'kWh',
    min: 100,
    max: 300,
    lat: 41.043,
    lng: 29.007,
    count: 0,
  },
  {
    sensorId: 'energy-05',
    sensorType: 'energy',
    location: 'Sisli Okul',
    unit: 'kWh',
    min: 80,
    max: 250,
    lat: 41.0602,
    lng: 28.987,
    count: 0,
  },
  {
    sensorId: 'traffic-01',
    sensorType: 'traffic',
    location: 'E5 Bagcilar',
    unit: 'arac/dk',
    min: 80,
    max: 200,
    lat: 41.036,
    lng: 28.856,
    count: 0,
  },
  {
    sensorId: 'traffic-02',
    sensorType: 'traffic',
    location: 'TEM Mahmutbey',
    unit: 'arac/dk',
    min: 100,
    max: 280,
    lat: 41.049,
    lng: 28.82,
    count: 0,
  },
  {
    sensorId: 'traffic-03',
    sensorType: 'traffic',
    location: 'Bogaz Koprusu',
    unit: 'arac/dk',
    min: 60,
    max: 180,
    lat: 41.0455,
    lng: 29.0338,
    count: 0,
  },
  {
    sensorId: 'traffic-04',
    sensorType: 'traffic',
    location: 'Kadikoy Meydan',
    unit: 'arac/dk',
    min: 40,
    max: 120,
    lat: 40.9908,
    lng: 29.0242,
    count: 0,
  },
  {
    sensorId: 'traffic-05',
    sensorType: 'traffic',
    location: 'Taksim Kavsagi',
    unit: 'arac/dk',
    min: 50,
    max: 150,
    lat: 41.0369,
    lng: 28.985,
    count: 0,
  },
];

let ws;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rushHourFactor(sensorType, currentHour) {
  const morning = Math.exp(-Math.pow((currentHour - 8) / 2.2, 2));
  const evening = Math.exp(-Math.pow((currentHour - 18) / 2.4, 2));
  const midday = Math.exp(-Math.pow((currentHour - 13) / 3.5, 2));

  if (sensorType === 'traffic') {
    return 0.9 + morning * 0.7 + evening * 0.85 + midday * 0.2;
  }

  return 0.85 + morning * 0.3 + midday * 0.5 + evening * 0.2;
}

function generateValue(sensor) {
  sensor.count += 1;
  const now = new Date();
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const span = sensor.max - sensor.min;
  const base = sensor.min + span / 2;
  const amplitude = span * 0.35;
  const wave = Math.sin((minuteOfDay / 1440) * Math.PI * 2 + sensor.count / 7);
  const noise = (Math.random() - 0.5) * span * 0.14;
  const factor = rushHourFactor(sensor.sensorType, now.getHours());

  let value = base * factor + amplitude * wave + noise;
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
        timestamp: new Date().toISOString(),
      })
    );
  });
}

function connect() {
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log(`Simulator connected to ${WS_URL}`);
  });

  ws.on('close', () => {
    console.warn('Simulator disconnected. Retrying in 3 seconds.');
    setTimeout(connect, 3000);
  });

  ws.on('error', (error) => {
    console.warn('Simulator WebSocket error:', error.message);
  });
}

connect();
setInterval(sendSensorBatch, SIMULATOR_INTERVAL);

