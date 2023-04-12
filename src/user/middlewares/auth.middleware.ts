import jwt from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";
import * as dotenv from "dotenv";

dotenv.config();

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  const errorResponse = res.status(401).json({ error: "Unauthorized" });

  if (!token) return errorResponse;

  try {
    const secret: string = process.env.SECRET as string;
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse;
  }
};
