import { rateLimit } from "express-rate-limit";

function getClientIp(req: any) {
  const forwarded = req.headers["x-forwarded-for"];
  let ip =
    (forwarded ? forwarded.toString().split(",")[0].trim() : "") ||
    req.ip ||
    req.socket?.remoteAddress ||
    "";

  // If it's IPv6-mapped IPv4 like ::ffff:143.44.164.176
  ip = ip.replace(/^::ffff:/, "");

  // If it includes port like 143.44.164.176:43110
  ip = ip.replace(/:\d+$/, "");

  // If it's still IPv6 with brackets like [::1]:1234 (rare)
  ip = ip.replace(/^\[(.*)\]$/, "$1").replace(/:\d+$/, "");

  return ip;
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: (req) => req.method === "OPTIONS",
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skip: (req) => req.method === "OPTIONS",
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = (req.body?.email || "").toLowerCase().trim();
    // IMPORTANT: use a separator that cannot appear in IP
    return `${ip}|${email || "no-email"}`;
  },
  message: {
    success: false,
    message: "Too many reset requests. Try again later.",
  },
});