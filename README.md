# CityPulse

CityPulse, enerji tüketimi ve trafik yoğunluğu sensörlerini gerçek zamanlı izleyen, son 5 dakikalık ortalamaya göre anomali tespiti yapan ve operatöre canlı alarm gösteren bir akıllı şehir izleme simülasyonudur.

Projede kullanılan ana teknolojiler:

- Backend: Node.js, Express, `ws`
- Stream: AWS Kinesis Data Streams
- Serverless: AWS Lambda
- Database: AWS DynamoDB
- Frontend: Next.js 14, TypeScript, Tailwind CSS v3, Recharts

## Mimari Akış

```text
Simulator -> WebSocket Backend -> Kinesis -> Lambda -> DynamoDB -> Frontend
```

Canlı akış sırası:

1. `citypulse-backend/simulator/citySimulator.js` sensör verisini WebSocket ile backend'e yollar.
2. Backend gelen mesajı doğrular, 5 dakikalık ortalamayı hesaplar, anomaliyi kontrol eder.
3. Backend veriyi Kinesis'e göndermeyi dener, alarm varsa kaydeder ve frontend client'larına broadcast eder.
4. Lambda, Kinesis event'lerini işleyip okuma/alarm yazım akışını tekrarlar.
5. Frontend REST + WebSocket ile dashboard, sensör detayları ve alarm ekranlarını günceller.

AWS fallback davranışı:

- `.env` eksikse veya AWS kaynakları erişilemezse backend çökmez.
- Okuma ve alarm verileri local in-memory fallback ile tutulur.
- Bu fallback yalnızca local geliştirme/demonstrasyon içindir. Restart sonrası veri korunmaz.

## Klasör Yapısı

```text
.
├── CityPulse_Dokuman.docx
├── README.md
├── citypulse-backend
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   ├── lambda
│   │   └── processor.js
│   ├── simulator
│   │   └── citySimulator.js
│   └── src
│       ├── app.js
│       ├── config
│       │   ├── dynamodb.js
│       │   └── kinesis.js
│       ├── routes
│       │   ├── alarms.js
│       │   └── sensors.js
│       ├── services
│       │   ├── anomalyService.js
│       │   ├── kinesisService.js
│       │   ├── localStore.js
│       │   └── sensorService.js
│       ├── utils
│       │   └── warnOnce.js
│       └── websocket
│           ├── messageHandler.js
│           └── server.js
└── citypulse-frontend
    ├── .env.local.example
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── app
    ├── components
    ├── hooks
    ├── lib
    └── types
```

## Kurulum

### Backend

```bash
cd citypulse-backend
npm install
node server.js
```

`.env` zorunlu değildir. Local demo için backend varsayılan portlarla çalışır. AWS kullanacaksanız `.env.example` dosyasını `.env` olarak kopyalayıp credential ve resource isimlerini doldurun.

Simülatörü ayrı terminalde çalıştırın:

```bash
cd citypulse-backend
node simulator/citySimulator.js
```

Script alias'ları:

```bash
npm run start
npm run simulate
```

### Frontend

```bash
cd citypulse-frontend
pnpm install
pnpm dev
```

`.env.local` zorunlu değildir. Local varsayılanlar `ws://localhost:8080` ve `http://localhost:3008/api` adreslerini kullanır. Farklı bir host veya port kullanacaksanız `.env.local.example` dosyasını `.env.local` olarak kopyalayın.

Production build kontrolü:

```bash
cd citypulse-frontend
pnpm build
```

## Environment Değişkenleri

### Backend

| Variable | Required | Default | Açıklama |
| --- | --- | --- | --- |
| `PORT` | Hayır | `3008` | Express API portu |
| `WS_PORT` | Hayır | `8080` | WebSocket sunucu portu |
| `SIMULATOR_WS_URL` | Hayır | `ws://localhost:8080` | Simülatörün bağlanacağı WS adresi |
| `AWS_REGION` | Hayır | `eu-north-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | Hayır | - | AWS credential |
| `AWS_SECRET_ACCESS_KEY` | Hayır | - | AWS credential |
| `KINESIS_STREAM_NAME` | Hayır | - | Kinesis stream adı |
| `DYNAMODB_TABLE_READINGS` | Hayır | - | SensorReadings tablo adı |
| `DYNAMODB_TABLE_ALARMS` | Hayır | - | Alarms tablo adı |
| `SIMULATOR_INTERVAL` | Hayır | `3000` | Sensör üretim aralığı |
| `ANOMALY_WINDOW_MINUTES` | Hayır | `5` | Hareketli ortalama penceresi |

Not: Pure local demo modunda `.env` oluşturmadan çalışabilirsiniz. AWS entegrasyonunu kullanmak istiyorsanız ilgili credential ve resource alanlarını doldurun.

### Frontend

| Variable | Required | Default | Açıklama |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_WS_URL` | Hayır | `ws://localhost:8080` | Frontend WebSocket adresi |
| `NEXT_PUBLIC_API_URL` | Hayır | `http://localhost:3008/api` | Frontend REST API adresi |

## API Endpoint'leri

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| `GET` | `/api/sensors` | Tüm sensörlerin son verisi |
| `GET` | `/api/sensors/:id/history?limit=100` | Sensör geçmişi |
| `GET` | `/api/sensors/:id/stats?period=1h` | Sensör istatistikleri |
| `GET` | `/api/alarms?resolved=false&type=energy` | Alarm listesi |
| `PUT` | `/api/alarms/:id/resolve` | Alarmı çözüldü olarak işaretler |
| `GET` | `/api/dashboard/summary` | Dashboard özet verileri |

## WebSocket Mesaj Örnekleri

### Simulator -> Backend

```json
{
  "type": "sensor_data",
  "sensorId": "energy-01",
  "sensorType": "energy",
  "value": 387.5,
  "unit": "kWh",
  "location": "Levent AVM",
  "lat": 41.0824,
  "lng": 29.01,
  "timestamp": "2026-04-06T10:00:00.000Z"
}
```

### Backend -> Frontend

```json
{
  "type": "sensor_update",
  "sensorId": "energy-01",
  "sensorType": "energy",
  "value": 387.5,
  "unit": "kWh",
  "location": "Levent AVM",
  "status": "normal",
  "average5m": 310.2,
  "timestamp": "2026-04-06T10:00:00.000Z"
}
```

### Alarm Mesajı

```json
{
  "type": "alarm",
  "alarmId": "uuid",
  "sensorId": "energy-02",
  "sensorType": "energy",
  "value": 1450,
  "average5m": 420,
  "deviation": 3.45,
  "severity": "critical",
  "message": "Maslak Ofis Kulesi — Anormal enerji tüketimi tespit edildi",
  "resolved": false,
  "timestamp": "2026-04-06T10:00:00.000Z"
}
```

## Test / Demo Akışı

1. Backend'i başlatın:

```bash
cd citypulse-backend
node server.js
```

2. Ayrı terminalde simülatörü başlatın:

```bash
cd citypulse-backend
node simulator/citySimulator.js
```

3. Frontend'i başlatın:

```bash
cd citypulse-frontend
pnpm dev
```

4. REST doğrulaması:

```bash
curl http://localhost:3008/api/sensors
curl http://localhost:3008/api/dashboard/summary
curl http://localhost:3008/api/alarms
curl 'http://localhost:3008/api/sensors/energy-01/history?limit=3'
curl 'http://localhost:3008/api/sensors/energy-01/stats?period=1h'
```

5. Manual anomaly örneği:

```bash
cd citypulse-backend
node -e "const WebSocket=require('ws'); const ws=new WebSocket('ws://localhost:8080'); ws.on('open',()=>{ws.send(JSON.stringify({type:'sensor_data',sensorId:'energy-01',sensorType:'energy',value:900,unit:'kWh',location:'Levent AVM',lat:41.0824,lng:29.01,timestamp:new Date().toISOString()})); setTimeout(()=>ws.close(),200);});"
```

6. Alarm çözümleme:

```bash
curl http://localhost:3008/api/alarms
curl -X PUT http://localhost:3008/api/alarms/<alarm-id>/resolve
```

## Package Script'leri

### Backend

```bash
npm run start
npm run dev
npm run simulate
npm run simulator
npm run lambda
npm run test:manual
```

### Frontend

```bash
pnpm dev
pnpm build
pnpm start
pnpm typecheck
```

## Bilinen Sınırlamalar

- Gerçek AWS Kinesis ve DynamoDB kaynakları bu repoda provision edilmez; canlı AWS doğrulaması için kendi kaynaklarınızı sağlamanız gerekir.
- Local fallback geliştirme ve demo içindir; process restart sonrası veriler silinir.
- Lambda akışı localde örnek Kinesis event ile doğrulanabilir, ancak gerçek AWS trigger kurulumu bu repo dışında yapılır.
