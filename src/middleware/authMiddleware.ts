import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { UnauthorizedException } from "./exceptions"

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedException("Invalid token format");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);

    if (typeof decoded !== "object" || decoded === null || !("userId" in decoded)) {
      throw new UnauthorizedException("Invalid token payload");
    }

    req.user = decoded as JwtPayload;
    next();
  } catch {
    throw new UnauthorizedException("Invalid token");
  }
};
interface User{
  userId:number,
  email:string,
}

declare global {
  namespace Express {
    interface Request {
      user?: User; 
    }
  }
}




const SECRET = process.env.JWT_SECRET!;
const EXPIRY = "15m";

export interface JwtPayload {
    userId: number;
    email: string;
    
}

export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, SECRET) as JwtPayload;
};

