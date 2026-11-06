import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded regardless of import order or process working directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export function getS3Client() {
  const region = (process.env.AWS_REGION || "ap-south-1").trim();
  const clientConfig = { region };

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
    };
  }

  return new S3Client(clientConfig);
}

export const s3 = getS3Client();

// Dynamic getter so S3_BUCKET is evaluated at request time
export const getBucket = () => (process.env.S3_BUCKET || "").trim();
