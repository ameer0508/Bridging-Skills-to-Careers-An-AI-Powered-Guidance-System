import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Reusable validator middleware. Executes schema.parse on req.body.
 * Parsing errors are passed to the central error handler (which handles ZodErrors).
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
