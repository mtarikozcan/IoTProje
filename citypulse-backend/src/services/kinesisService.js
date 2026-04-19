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
        Data: JSON.stringify(sensorData),
      })
    );
  } catch (error) {
    warnOnce(
      'kinesis-put-record-failed',
      `Kinesis warning: failed to publish sensor record for ${sensorData.sensorId}, continuing without stream persistence.`,
      error
    );
    return null;
  }
}

module.exports = {
  putSensorRecord,
};
