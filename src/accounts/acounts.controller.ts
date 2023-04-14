import { PrismaClient } from "@prisma/client";
import { Response, Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { accountSchema } from "./validators/account.validator";
import { Prisma } from "@prisma/client";

type AccountWhereInputWithParentId = Prisma.AccountWhereInput & {
  parentId?: string;
};

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

export const createSubAccount = async (req: Request, res: Response) => {
  try {
    const {
      accountIban,
      name,
      email,
      number,
      balance,
      currency,
      bic,
      accountType,
    } = req.body;

    const validationResult = accountSchema.validate(
      {
        name,
        email,
        number,
        balance,
        currency,
        bic,
        accountType,
      },
      { abortEarly: false }
    );
    if (validationResult.error) {
      return res
        .status(400)
        .json({ error: validationResult.error.details[0].message });
    }

    const mainAccount = await prisma.account.findUnique({
      where: { iban: accountIban },
    });
    if (!mainAccount) {
      return res.status(404).json({ error: "Main account not found" });
    }

    if (mainAccount.accountType !== "courant") {
      return res
        .status(400)
        .json({ error: "Main account must be of type courant" });
    }

    let subAccountType;
    if (accountType === "savings" || accountType === "frozen") {
      subAccountType = accountType;
    } else {
      return res
        .status(400)
        .json({ error: "Invalid account type for sub account" });
    }

    const iban = `DE${uuidv4()}`;
    const newSubAccount = {
      iban,
      name,
      email,
      number,
      balance,
      currency,
      bic,
      accountType: subAccountType,
      parentId: accountIban,
    };
    const createdSubAccount = await prisma.account.create({
      data: newSubAccount,
    });

    res.status(200).json(createdSubAccount);
  } catch (error: any) {
    res.status(500).json({
      error: `Please ${error.meta.target[0]} already exists...Enter another one`,
    });
  }
};

export const getAllAccounts = async (req: Request, res: Response) => {
  const { page, pageSize } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const pageSizeNumber = parseInt(pageSize as string) || 5;

  const totalRecords = await prisma.account.count();
  const totalPages = Math.ceil(totalRecords / pageSizeNumber);
  const currentPage = pageNumber > totalPages ? totalPages : pageNumber;

  const skip = (currentPage - 1) * pageSizeNumber;
  const accounts = await prisma.account.findMany({
    skip: skip,
    take: pageSizeNumber,
  });

  const response = {
    totalRecords: totalRecords,
    totalPages: totalPages,
    currentPage: currentPage,
    accounts: accounts,
  };

  res.status(200).json(response);
};

export const getOneAccount = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params;
    const account = await prisma.account.findUnique({ where: { iban } });
    if (!account)
      res.status(404).json({ error: `Account with iban ${iban} not found` });
    return res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getSubAccountsByParentId = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params;

    const parentAccount = await prisma.account.findUnique({
      where: {
        iban,
      },
    });
    if (!parentAccount) {
      res.status(404).json({ error: "Parent account not found" });
    }
    const subAccounts = await prisma.account.findMany({
      where: {
        parentId: iban,
      } as AccountWhereInputWithParentId,
    });

    res.status(200).json(subAccounts);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Failed to get sub-accounts", message: error.message });
  }
};

export const getSubAccountByIban = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params;

    const subAccount = await prisma.account.findUnique({
      where: { iban },
    });

    if (!subAccount) {
      return res.status(404).json({ error: "Sub-account not found" });
    }

    res.status(200).json(subAccount);
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to get sub-account",
    });
  }
};

export const unblockAccount = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params;
    const accountData = await prisma.account.findUnique({
      where: { iban },
    });

    if (!accountData) {
      throw new Error("Account not found");
    }

    if (accountData.accountType !== "blocked") {
      throw new Error("Account is not blocked");
    }

    await prisma.account.update({
      where: { iban },
      data: { accountType: "savings" },
    });

    return { success: true, message: "Account unblocked successfully" };
  } catch (error) {
    throw new Error("Failed to unblock account");
  }
};
