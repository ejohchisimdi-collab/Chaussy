import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
/*
────────────────────────────────
BASE EXCEPTION
────────────────────────────────
*/
export class HttpException extends Error {
  public status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = this.constructor.name
  }
}

/*
────────────────────────────────
SPECIFIC EXCEPTIONS
────────────────────────────────
*/
export class NotFoundException extends HttpException {
  constructor(message: string) {
    super(404, message)
  }
}
export class ConflictException extends HttpException {
  constructor(message: string) {
    super(409, message)
  }
}


export class InvalidCredentialsException extends HttpException{
  constructor(message:string){
    super(401,message)
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string) {
    super(401, message)
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string) {
    super(400, message)
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string) {
    super(403, message)
  }
}

export class InternalServerException extends HttpException {
  constructor(message: string = "Something went wrong") {
    super(500, message)
  }
}

/*
────────────────────────────────
6. GLOBAL ERROR HANDLER
Catches ALL exceptions
Must be registered LAST in index.ts
app.use(errorHandler)
────────────────────────────────
*/
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err); // Log full error internally

  if (err instanceof ZodError) {
    // Return a clean, client-friendly validation error
    const errors = err.errors.map(e => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({ errors });
  }

  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message || "Something went wrong";

  res.status(status).json({ message });
};

