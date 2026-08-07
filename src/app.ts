import express, { Request, Response, NextFunction } from 'express';

import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { corsHandler } from './middlewares/corsHandler';
import { loggingHandler } from './middlewares/loggingHandler';
import { routeNotFound } from './middlewares/routeNotFound';
import { errorHandler } from './middlewares/errorHandlers';
import authRoutes from './modules/auth/auth.routes';
import creditRoutes from './modules/credit/credit.routes';
import memberRoutes from './modules/member/member.routes';
import loanRoutes from './modules/loan/loan.routes';
import depositRoutes from './modules/deposit/deposit.routes';
import electionRoutes from './modules/election/election.routes';
import survey from './modules/survey/survey.routes';

import {
  API_REQUEST_COUNT_LIMIT,
  API_TIME_LIMIT,
  DEVELOPMENT,
  CREDIT_SESSION_SECRET
} from './config/config';

import path from 'path';

const app = express();

logging.log('----------------------------------------');
logging.log('Initializing API');
logging.log('----------------------------------------');


// ✅ MUST be before anything else
app.set("trust proxy", 1);

// ✅ ARR appends :port to X-Forwarded-For — strip it so Express/rate-limit
// get a valid client IP
app.use((req: Request, _res: Response, next: NextFunction) => {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") {
    req.headers["x-forwarded-for"] = xff
      .split(",")
      .map((s) => s.trim().replace(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/, "$1"))
      .join(", ");
  }
  next();
});

console.log(DEVELOPMENT);

// ✅ IIS doesn't forward X-Forwarded-Proto; site is HTTPS-only via IIS,
// so force it in production so secure cookies work
if (!DEVELOPMENT) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.headers["x-forwarded-proto"] = "https";
    next();
  });
}

app.use(helmet());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('./Dividend'));
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(process.cwd(), "uploads")));
app.use(corsHandler);
app.use(loggingHandler);

app.use(cookieParser());

app.use(
  session({
    name: "sid",
    secret: CREDIT_SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: !DEVELOPMENT,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    },
  })
);



logging.log('----------------------------------------');
logging.log('Logging, Security & Configuration');
logging.log('----------------------------------------');


// ✅ Rate limit (no need custom keyGenerator now)
const limiter = rateLimit({
  windowMs: API_TIME_LIMIT,
  limit: API_REQUEST_COUNT_LIMIT,
});

app.use(limiter);


logging.log('----------------------------------------');
logging.log('Define Controller Routing');
logging.log('----------------------------------------');

app.get('/api/v1/healthcheck', (req: Request, res: Response) => {
  res.status(200).json({ Status: 'I am alive!' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/credit', creditRoutes);
app.use('/api/v1/member', memberRoutes);
app.use('/api/v1/loan', loanRoutes);
app.use('/api/v1/deposit', depositRoutes);
app.use('/api/v1/election', electionRoutes);
app.use('/api/v1/survey', survey);


logging.log('----------------------------------------');
logging.log('Define Routing Errors');
logging.log('----------------------------------------');

app.use(routeNotFound);
app.use(errorHandler);

export default app;