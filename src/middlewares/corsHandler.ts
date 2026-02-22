import { Request, Response, NextFunction } from 'express'


const allowedOrigins = ['http://localhost:5173', 'http://localhost:8080']

export function corsHandler(req: Request, res: Response, next: NextFunction) {
  const origin = req.header('origin')

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  res.header("Vary", "Origin"); // ✅ important
  res.header("Access-Control-Allow-Credentials", "true"); // ✅ for sessions
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    // ✅ echo headers back on preflight
    res.sendStatus(200);
    return;
  }

  next()
}
