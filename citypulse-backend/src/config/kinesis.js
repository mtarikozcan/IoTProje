const { KinesisClient } = require('@aws-sdk/client-kinesis');

function getAwsConfig() {
  const region = process.env.AWS_REGION || 'eu-north-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };
  }

  return { region };
}

const kinesisClient = new KinesisClient(getAwsConfig());

module.exports = {
  kinesisClient,
};

