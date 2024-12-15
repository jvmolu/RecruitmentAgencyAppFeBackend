import { Request, Response, NextFunction } from 'express';
import HttpStatusCode from '../../types/enums/http-status-codes';

export function RouteNotFound(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(HttpStatusCode.NOT_FOUND);
  next(error);
}