const express = require('express');
const cors = require('cors');

const sensorsRouter = require('./routes/sensors');
const alarmsRouter = require('./routes/alarms');

const app = express();

app.use(cors());
app.use(express.json());

app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      message: 'Malformed JSON request body',
    });
    return;
  }

  next(error);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', sensorsRouter);
app.use('/api', alarmsRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
  });
});

module.exports = app;
