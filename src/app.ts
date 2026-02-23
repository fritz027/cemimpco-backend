import express, { Request, Response, NextFunction } from 'express';

import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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
import { API_REQUEST_COUNT_LIMIT, API_TIME_LIMIT,DEVELOPMENT,CREDIT_SESSION_SECRET } from './config/config';
import path from 'path';

const app = express();

logging.log('----------------------------------------');
logging.log('Initializing API');
logging.log('----------------------------------------');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('./Dividend'));
app.use('/uploads',express.static('uploads'));
app.use('/uploads', express.static(path.join(process.cwd(), "uploads")));
app.use(loggingHandler);
app.use(corsHandler);


// ✅ Trust proxy for secure cookies behind reverse proxies
app.set("trust proxy", 1);

app.use(
  session({
    name: "sid",
    secret: CREDIT_SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: DEVELOPMENT,
      sameSite: DEVELOPMENT ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    },
  })
);
app.use(helmet());
logging.log('----------------------------------------');
logging.log('Logging, Security & Configuration');
logging.log('----------------------------------------');


// Rate limiting 100 requests per 10 mins
const limiter = rateLimit({
    windowMs: API_TIME_LIMIT,
    max: API_REQUEST_COUNT_LIMIT,
    skip: (req) => req.method === "OPTIONS",
});
app.use(limiter);

logging.log('----------------------------------------');
logging.log('Define Controller Routing');
logging.log('----------------------------------------');
app.get('/api/v1/healthcheck', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ Status: 'I am  alive!' });
});
// app.use('/api/v1/sample', sampleRoutes)

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/credit', creditRoutes);
app.use('/api/v1/member', memberRoutes);
app.use('/api/v1/loan',  loanRoutes);
app.use('/api/v1/deposit', depositRoutes);
app.use('/api/v1/election', electionRoutes);

logging.log('----------------------------------------');
logging.log('Define Routing Errors');
logging.log('----------------------------------------');
app.use(routeNotFound);
app.use(errorHandler); //other error catcher

export default app;


