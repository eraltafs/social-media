const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();
// AWS SDK v3 configuration
const s3Client = new S3Client({
  region: process.env.REGION,
  endpoint: 'https://blr1.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  forcePathStyle: true
});

const bucketName = process.env.BUCKET_NAME;
const s3Url = process.env.S3URL;

module.exports = { s3Client, bucketName, s3Url };
