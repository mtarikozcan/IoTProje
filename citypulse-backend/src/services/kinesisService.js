const { PutRecordCommand } = require('@aws-sdk/client-kinesis');

const { kinesisClient } = require('../config/kinesis');
const { warnOnce } = require('../utils/warnOnce');

async function putSensorRecord(sensorData) {
  const streamName = process.env.KINESIS_STREAM_NAME;

  if (!streamName) {
    warnOnce('missing-kinesis-stream', 'Kinesis warning: KINESIS_STREAM_NAME is not configured, skipping stream publish.');
    return null;
  }

  try {
    return await kinesisClient.send(
      new PutRecordCommand({
        StreamName: streamName,
        PartitionKey: sensorData.sensorId,
        Data: Buffer.from(JSON.stringify(sensorData)),
      })
    );
  } catch (error) {
    console.warn('Kinesis warning: failed to publish sensor record, continuing without stream persistence.', error.message || error);
    return null;
  }
}

module.exports = {
  putSensorRecord,
};

