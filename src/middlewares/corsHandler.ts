import type { Request, Response, NextFunction } from "express";
import { BASEURL, SERVERURL } from "../config/config";

// normalize: no trailing slash
const normalize = (u: string) => u.replace(/\/$/, "");

const allowedOrigins = new Set(
  [BASEURL, SERVERURL, "https://mock.cemimpco.com", "http://localhost:8080", "http://localhost:5173"]
    .filter(Boolean)
    .map((o) => normalize(String(o)))
);

export function corsHandler(req: Request, res: Response, next: NextFunction) {
  const originRaw = req.headers.origin;
  const origin = originRaw ? normalize(originRaw) : undefined;

  // ✅ important for caches and for correct behavior with multiple origins
  res.setHeader("Vary", "Origin");

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // ✅ Always set these (preflight + normal)
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  // ✅ respond to preflight early
  if (req.method === "OPTIONS") {
     res.sendStatus(204);
     return;
  }

  next();
}