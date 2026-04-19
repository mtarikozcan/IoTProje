# CityPulse

CityPulse is a real-time IoT sensor monitoring system built for a university assignment. It simulates city sensors, stores readings and alarms, and shows the current state in a web dashboard.

## What it does

The dashboard displays real-time data from simulated city sensors across Istanbul locations. The current setup includes energy consumption and traffic flow sensors.

Sensors send data every 3 seconds. The backend calculates a recent average, checks for anomalies, and creates alarms when a reading crosses the configured thresholds.

## Tech Stack

- Frontend: Next.js 14 (App Router), deployed on EC2 port 3000
- Backend: Node.js + Express + WebSocket, deployed on EC2 port 3008
- Simulator: Node.js script that generates sensor data and pushes events into the backend flow
- AWS DynamoDB: stores sensor readings and alarms (TTL enabled for readings)
- AWS Kinesis Data Stream: `SensorDataStream` (on-demand)
- AWS Lambda: `citypulse-processor`, triggered by Kinesis
- AWS EC2: `t3.micro`, `eu-north-1` (Stockholm)
- PM2: process manager

## Architecture

AWS path:

```text
Simulator -> Kinesis -> Lambda -> DynamoDB -> Backend API -> WebSocket -> Frontend
```

Local development path in this repo:

```text
Simulator -> WebSocket Backend -> Kinesis -> Lambda -> DynamoDB -> Backend API -> Frontend
```

The local simulator sends messages to the backend WebSocket server. When AWS resources are configured, the backend also publishes records to Kinesis. Lambda processes Kinesis events and writes to DynamoDB.

## Setup (local)

Clone the repo:

```bash
git clone <repo-url>
cd IoTProje
```

Backend:

```bash
cd citypulse-backend
npm install
cp .env.example .env
node server.js
```

Simulator:

```bash
cd citypulse-backend
node simulator/citySimulator.js
```

Frontend:

```bash
cd citypulse-frontend
pnpm install
pnpm dev
```

If you prefer `npm` for the frontend, `npm install` and `npm run dev` also work, but the repo is currently maintained with `pnpm-lock.yaml`.

## AWS Deployment

- EC2 IP: `13.60.81.144`
- Frontend: [http://13.60.81.144:3000](http://13.60.81.144:3000)
- API: [http://13.60.81.144:3008/api/sensors](http://13.60.81.144:3008/api/sensors)
- WebSocket: `ws://13.60.81.144:8080`

## API Endpoints

- `GET /api/sensors` — latest reading from all sensors
- `GET /api/sensors/:id/history` — sensor history
- `GET /api/sensors/:id/stats` — sensor statistics
- `GET /api/alarms` — recent alarms
- `PUT /api/alarms/:id/resolve` — mark an alarm as resolved
- `GET /api/dashboard/summary` — dashboard summary
- WebSocket `ws://13.60.81.144:8080` — live sensor stream

## Sensors

There are 10 sensors in total:

- 5 energy sensors (`kWh`)
- 5 traffic sensors (`vehicles/min`)

Locations include Levent, Maslak, Kadıköy, Beşiktaş, Şişli, E5, TEM, Boğaz Köprüsü, and Taksim.

## Environment

Backend variables are defined in [`citypulse-backend/.env.example`](/Users/tarikozcan/Desktop/IoTProje/citypulse-backend/.env.example).

Main values:

- `PORT=3008`
- `WS_PORT=8080`
- `AWS_REGION=eu-north-1`
- `KINESIS_STREAM_NAME=SensorDataStream`
- `DYNAMODB_TABLE_READINGS=SensorReadings`
- `DYNAMODB_TABLE_ALARMS=Alarms`
- `SIMULATOR_INTERVAL=3000`
- `ANOMALY_WINDOW_MINUTES=5`

Frontend variables are defined in [`citypulse-frontend/.env.local.example`](/Users/tarikozcan/Desktop/IoTProje/citypulse-frontend/.env.local.example):

- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_API_URL`

## Notes

- The backend can run without AWS credentials. In that case it falls back to in-memory storage for local development.
- The Lambda processor lives in `citypulse-backend/lambda/processor.js`.
- The local frontend default API target is `http://localhost:3008/api`.
