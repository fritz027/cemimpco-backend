// src/middlewares/uploadLoanDocuments.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "loans");

// ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// only allow jpg/png/pdf
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and PDF files are allowed"));
  }
  cb(null, true);
}

// safe normalize for filenames
function normalizeMemberNo(value: unknown): string {
  const s = String(value ?? "").trim();
  // allow only letters/numbers/_/-
  return s.replace(/[^a-zA-Z0-9_-]/g, "");
}

function getExtFromMimetype(file: Express.Multer.File): ".jpg" | ".png" | ".pdf" {
  if (file.mimetype === "image/png") return ".png";
  if (file.mimetype === "application/pdf") return ".pdf";
  return ".jpg";
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),

  filename: (req, file, cb) => {
    try {
      // your frontend sends the JSON blob under the "data" field
      const raw = req.body.data;
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;

      const memberNo = normalizeMemberNo(data?.memberno || req.body.memberno);

      if (!memberNo) {
        return cb(new Error("memberno missing in request"), "");
      }

      const ext = getExtFromMimetype(file);

      // two docs share the field name "documents", so suffix with a unique part
      // to avoid the second file overwriting the first
     
      cb(null, `${memberNo}-ID${ext}`);
    } catch {
      cb(new Error("Upload failed: ensure 'data' JSON is sent before the files"), "");
    }
  },
});

export const uploadLoanDocuments = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});