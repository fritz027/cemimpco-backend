import { Request, Response, NextFunction } from 'express';
import logging from '../config/logging';

function getClientIp(req: Request): string {
    const xff = req.headers['x-forwarded-for'];

    if (typeof xff === 'string' && xff.length > 0) {
        // X-Forwarded-For can contain multiple IPs
        return xff.split(',')[0].trim();
    }

    const ip = req.ip || req.socket.remoteAddress || '';
    return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

export function loggingHandler(req: Request, res: Response, next: NextFunction) {
    const ip = getClientIp(req);

    logging.log(
        `Incoming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${ip}]`
    );

    res.on('finish', () => {
        logging.log(
            `Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${ip}] - STATUS: [${res.statusCode}]`
        );
    });

    next();
}