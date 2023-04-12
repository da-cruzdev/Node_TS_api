import { PrismaClient } from "@prisma/client";
import { Response, Request } from "express";
import { CreateUserDTO, LoginDTO, userSchema } from "./user.dto";
import bcrypt from "bcrypt";
import { generateToken } from "./token/createToken";

const prisma = new PrismaClient();

export const signUp = async (req: Request, res: Response) => {
  const { name, email, password }: CreateUserDTO = req.body;
  try {
    const validateData = await userSchema.validateAsync(
      {
        name,
        email,
        password,
      },
      { abortEarly: false }
    );
    const hashedPassword = await bcrypt.hash(validateData.password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: validateData.name,
        email: validateData.email,
        password: hashedPassword,
      },
    });
    res.status(200).json(newUser);
  } catch (error: any) {
    if (error && error.details) {
      const errors = error.details.reduce((acc: any, current: any) => {
        acc[current.context.key] = current.message;
        return acc;
      }, {});
      res.status(400).json({ error: "vaildation failed", errors });
    }
  }
};
export const login = async (req: Request, res: Response) => {
  const { email, password }: LoginDTO = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      res.status(401).json({ error: "Invalid email" });
      return;
    }

    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    const token = generateToken(user);
    res.status(200).json({ token: token });
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
};
