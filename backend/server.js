import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

// Import routes after environment variables are loaded
import filesRouter from "./src/routes/files.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Health Check
app.get("/api/health", (_req, res) => {
  const currentBucket = (process.env.S3_BUCKET || "").trim();
  res.json({
    status: "ok",
    service: "CampusVault API",
    time: new Date().toISOString(),
    s3BucketConfigured: Boolean(currentBucket),
    s3BucketName: currentBucket || "NOT_SET",
    region: (process.env.AWS_REGION || "ap-south-1").trim(),
  });
});

// File routes
app.use("/api/files", filesRouter);

// Frontend static files configuration
// Priority 1: backend/public
// Priority 2: ../frontend/dist
let staticDir = path.resolve(__dirname, "public");
if (!fs.existsSync(staticDir)) {
  const frontendDist = path.resolve(__dirname, "../frontend/dist");
  if (fs.existsSync(frontendDist)) {
    staticDir = frontendDist;
  }
}

app.use(express.static(staticDir));

// Serve Frontend Single Page Application (SPA) on all other GET routes
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  const indexPath = path.join(staticDir, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.status(404).send(`
    <div style="font-family:sans-serif;text-align:center;padding:50px;">
      <h2>CampusVault Backend Running 🚀</h2>
      <p>Frontend static files not found in <code>backend/public</code> or <code>frontend/dist</code>.</p>
      <p>Run <code>npm run build</code> in the frontend folder to build the UI!</p>
      <p><a href="/api/health">Check API Health Status</a></p>
    </div>
  `);
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 400).json({
    message: err.message || "An unexpected error occurred.",
  });
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0"; // Listen on all network interfaces for EC2

app.listen(PORT, HOST, () => {
  const currentBucket = (process.env.S3_BUCKET || "").trim();
  console.log(`===============================================`);
  console.log(`🚀 CampusVault Server is live!`);
  console.log(`🏠 Local (Browser):   http://localhost:${PORT}`);
  console.log(`🌐 Network (Local):   http://127.0.0.1:${PORT}`);
  console.log(`☁️  On EC2 (Browser):  http://YOUR_EC2_PUBLIC_IP:${PORT}`);
  console.log(`📂 Serving Frontend:  ${staticDir}`);
  console.log(`☁️  AWS S3 Bucket:     ${currentBucket || "NOT CONFIGURED"}`);
  console.log(`===============================================`);
});
