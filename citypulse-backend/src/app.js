const express = require('express');
const cors = require('cors');

const sensorsRouter = require('./routes/sensors');
const alarmsRouter = require('./routes/alarms');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', sensorsRouter);
app.use('/api', alarmsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
  });
});

module.exports = app;

