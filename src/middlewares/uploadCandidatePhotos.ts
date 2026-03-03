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

      const raw = req.body.candidate;
      const candidate = typeof raw === "string" ? JSON.parse(raw) : raw;

      // During an update, you might be sending 'id' or 'member_no' 
      // Make sure you check both or whatever unique field you use
      const memberNo = normalizeMemberNo(candidate?.member_no || req.body.member_no);

      if (!memberNo) {
        // Fallback: If member_no isn't in the JSON, maybe it's a separate field
        // Or use a timestamp temporarily to prevent the error
        return cb(new Error("member_no missing in request"), "");
      }

      
      const ext = getExtFromMimetype(file);

      cb(null, `${memberNo}${ext}`);
    } catch (err) {
      cb(new Error("Upload failed: Ensure 'candidate' JSON is sent before the file"), "");
    }
  },
});

export const uploadCandidatePhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});