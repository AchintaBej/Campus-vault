import { S3Client } from "@aws-sdk/client-s3";

const clientConfig = {
  region: process.env.AWS_REGION || "ap-south-1",
};

// When AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY are present (e.g. local development or IAM user),
// use them. Otherwise, default credential chain will automatically pick up EC2 IAM Role!
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

export const s3 = new S3Client(clientConfig);
export const bucket = process.env.S3_BUCKET;
