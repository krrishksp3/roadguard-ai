import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
  console.error('[Unhandled Error]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof Error) {
    const is503 =
      (err as any).statusCode === 503 ||
      (err as any).status === 503 ||
      err.message.includes('503') ||
      err.message.toUpperCase().includes('UNAVAILABLE');

    const statusCode = is503 ? 503 : (err as any).statusCode || (err as any).status || 500;

    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred.',
  });
};
