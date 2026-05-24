import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field:   e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ success: false, errors });
      return;
    }
    // Attach parsed + coerced data back to request
    req[source] = result.data as typeof req[typeof source];
    next();
  };
}
