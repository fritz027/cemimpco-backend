// src/middlewares/uploadCandidatePhoto.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "candidates");

// ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// only allow jpg/png
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const ok = ["image/jpeg", "image/png"].includes(file.mimetype);
  if (!ok) return cb(new Error("Only JPG/PNG files are allowed"));
  cb(null, true);
}

// safe normalize for filenames
function normalizeMemberNo(value: unknown): string {
  const s = String(value ?? "").trim();
  // allow only letters/numbers/_/-
  const cleaned = s.replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned;
}

function getExtFromMimetype(file: Express.Multer.File): ".jpg" | ".png" {
  return file.mimetype === "image/png" ? ".png" : ".jpg";
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),

  filename: (req, file, cb) => {
    try {
      // candidate is sent as JSON string in multipart/form-data
      const raw = req.body.candidate;
      const candidate = typeof raw === "string" ? JSON.parse(raw) : raw;

      const memberNo = normalizeMemberNo(candidate?.member_no);

      if (!memberNo) {
        return cb(new Error("member_no is required to name the photo"), "");
      }

      const ext = getExtFromMimetype(file);
      const filename = `${memberNo}${ext}`;

      // overwrite existing file if present (optional, but matches your requirement)
      const fullPath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch {
          // ignore unlink errors; multer will overwrite in most cases anyway
        }
      }

      cb(null, filename);
    } catch {
      cb(new Error("Invalid candidate payload (candidate JSON)"), "");
    }
  },
});

export const uploadCandidatePhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});