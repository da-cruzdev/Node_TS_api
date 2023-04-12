import { PrismaClient } from "@prisma/client";
import { Response, Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { accountSchema } from "./validators/account.validator";

const prisma = new PrismaClient();

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, email, number, balance, currency, bic, accountType } =
      req.body;
    const validateData = await accountSchema.validateAsync(
      { name, email, number, balance, currency, bic, accountType },
      {
        abortEarly: false,
      }
    );

    const iban = `DE${uuidv4()}`;
    const newAccount = {
      iban,
      name: validateData.name,
      email: validateData.email,
      number: validateData.number,
      balance: validateData.balance,
      currency: validateData.currency,
      bic: validateData.bic,
      accountType: validateData.accountType,
    };
    const createdAccount = await prisma.account.create({ data: newAccount });
    res.status(200).json(createdAccount);
  } catch (error: any) {
    if (error && error.details) {
      const errors = error.details.reduce((acc: any, current: any) => {
        acc[current.context.key] = current.message;
        return acc;
      }, {});
      res.status(500).json({ error: "Account creation failed", errors });
    } else {
      res.status(500).json({ error: "Account creation failed", errors: null });
    }
  }
};

export const getAllAccounts = async (req: Request, res: Response) => {
  const accounts = await prisma.account.findMany();

  res.status(200).json(accounts);
};

export const getOneAccount = async (iban: string) => {
  try {
    const account = await prisma.account.findUnique({ where: { iban } });
    return account;
  } catch (error) {
    throw new Error("Erreur lors de la récupération du compte");
  }
};
