import { Request, Response, NextFunction } from 'express';

export function routeNotFound(req: Request, res: Response, next: NextFunction) {
    logging.warning(`404 Not Found - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);

    res.status(404).json({
        error: {
            message: 'Not found'
        }
    });
}