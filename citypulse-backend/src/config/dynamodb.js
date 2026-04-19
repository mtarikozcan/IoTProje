const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

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

const dynamoClient = new DynamoDBClient(getAwsConfig());
const dynamoDocumentClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

module.exports = {
  dynamoClient,
  dynamoDocumentClient,
};

