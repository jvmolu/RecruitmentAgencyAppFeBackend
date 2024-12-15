import { Request, Response, NextFunction } from 'express';
import HttpStatusCode from '../../types/enums/http-status-codes';

export function ErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Set status code to 500 if not already set
  const statusCode = res.statusCode === HttpStatusCode.OK ? HttpStatusCode.INTERNAL_SERVER_ERROR : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    // Include stack trace only in development mode
    stack: process.env.ENV === 'production' ? undefined : err.stack,
  });
}