import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, getBucket } from "../s3.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_FILE_MB || 10) * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Allowed formats: PDF, JPG, PNG, WEBP, DOC, DOCX, PPT, PPTX."
        ),
        false
      );
    }
  },
});

function adminAuth(req, res, next) {
  const adminPin = (process.env.ADMIN_PIN || "").trim();
  const providedPin = (req.get("x-admin-pin") || "").trim();

  if (!adminPin) {
    return res.status(500).json({ message: "ADMIN_PIN is not configured on the server." });
  }

  if (!providedPin || providedPin !== adminPin) {
    return res.status(401).json({ message: "Unauthorized: Invalid Admin PIN" });
  }

  next();
}

// GET /api/files - List files stored in S3
router.get("/", async (_req, res) => {
  try {
    const bucket = getBucket();
    if (!bucket) {
      return res.status(500).json({
        message: "S3_BUCKET is not set in backend .env file. Please check backend/.env.",
      });
    }

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "uploads/",
      MaxKeys: 200,
    });

    const response = await s3.send(command);
    const contents = response.Contents || [];

    // Filter out root directory marker if any, and files with size 0
    const validObjects = contents.filter(
      (item) => item.Key !== "uploads/" && (item.Size || 0) > 0
    );

    const files = await Promise.all(
      validObjects.map(async (item) => {
        const rawFileName = item.Key.split("/").pop() || "unnamed";
        const cleanName = decodeURIComponent(
          rawFileName.replace(/^[0-9a-fA-F-]{36}_/, "")
        );

        // Determine simple file category
        const ext = cleanName.split(".").pop()?.toLowerCase() || "";
        let category = "document";
        if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
          category = "image";
        } else if (["ppt", "pptx"].includes(ext)) {
          category = "slide";
        } else if (ext === "pdf") {
          category = "pdf";
        }

        // Generate Presigned URL valid for 1 hour (3600 seconds)
        const downloadUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: bucket, Key: item.Key }),
          { expiresIn: 3600 }
        );

        return {
          key: item.Key,
          name: cleanName,
          extension: ext,
          category,
          size: item.Size,
          uploadedAt: item.LastModified,
          downloadUrl,
        };
      })
    );

    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    res.json({ files, count: files.length });
  } catch (err) {
    console.error("S3 List Error:", err);
    res.status(500).json({
      message: `Failed to fetch files from S3: ${err.message || "Check IAM role and bucket name."}`,
    });
  }
});

// POST /api/files/upload - Upload file to S3
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file selected for upload." });
    }

    const bucket = getBucket();
    if (!bucket) {
      return res.status(500).json({ message: "S3_BUCKET is not configured on the server." });
    }

    const sanitizedOriginalName = req.file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 100);

    const fileKey = `uploads/${randomUUID()}_${sanitizedOriginalName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    res.status(201).json({
      message: "File successfully uploaded to AWS S3!",
      key: fileKey,
      name: sanitizedOriginalName,
    });
  } catch (err) {
    console.error("S3 Upload Error:", err);
    res.status(500).json({
      message: `Upload failed: ${err.message || "Check S3 write permissions."}`,
    });
  }
});

// DELETE /api/files/:key - Delete file from S3 (Admin protected)
router.delete("/:key(*)", adminAuth, async (req, res) => {
  try {
    const bucket = getBucket();
    if (!bucket) {
      return res.status(500).json({ message: "S3_BUCKET is not configured on the server." });
    }

    const rawKey = decodeURIComponent(req.params.key);

    if (!rawKey.startsWith("uploads/") || rawKey.includes("..")) {
      return res.status(400).json({ message: "Invalid or malicious file key provided." });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: rawKey,
      })
    );

    res.json({ message: "File successfully deleted from AWS S3." });
  } catch (err) {
    console.error("S3 Delete Error:", err);
    res.status(500).json({
      message: `Delete failed: ${err.message || "Check S3 delete permissions."}`,
    });
  }
});

export default router;
