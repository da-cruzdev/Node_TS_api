import jwt from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";
import * as dotenv from "dotenv";

dotenv.config();

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return sendErrorResponse(res, 401, "Unauthorized");
  }

  try {
    const secret: string = process.env.SECRET as string;
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return sendErrorResponse(res, 401, "Unauthorized");
  }
};

const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string
) => {
  return res.status(statusCode).json({ error: message });
};
