import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

export const generateToken = (user: User): string => {
    const secret: string = process.env.SECRET as string;
    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
        expiresIn: "24h",
    });

    return token;
};
