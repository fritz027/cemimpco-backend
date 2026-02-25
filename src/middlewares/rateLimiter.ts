import { rateLimit } from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

// Forgot password limiter
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skip: (req) => req.method === "OPTIONS",
  keyGenerator: (req) => {
    const email = (req.body?.email || "").toLowerCase().trim();
    return `${req.ip}:${email}`;
  },
  message: {
    success: false,
    message: "Too many reset requests. Try again later.",
  },
});