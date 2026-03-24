import { z, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Pass the actual ZodError to your error handler
      return next(result.error); 
    }

    req.body = result.data;
    next();
  }