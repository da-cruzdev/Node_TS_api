import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const signUp = async (name: string, email: string, password: string) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    return newUser;
  } catch (error) {
    throw new Error("Failed to sign up");
  }
};
