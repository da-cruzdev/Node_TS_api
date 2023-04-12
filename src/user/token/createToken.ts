import { User } from "@prisma/client";
import jwt from "jsonwebtoken";

export const generateToken = (user: User): string => {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    "your-secret-key",
    { expiresIn: "1h" }
  );
  return token;
};
