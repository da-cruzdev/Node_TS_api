import { Prisma, PrismaClient } from "@prisma/client";
import { TransactionSchema } from "./validators/transaction.validator";
import { formatDataResponse } from "../common/dataFormat";
import { getdataWithPagination } from "../common/dataPagination";
import { Request, Response } from "express";
import TransactionData from "./dto/transaction.dto";

const prisma = new PrismaClient();

const convertCurrency = (amount: number, fromCurrency: string): number => {
  const exchangeRates: Record<string, number> = {
    EURO: 1,
    USD: 1.2,
    FCFA: 656,
  };

  if (!exchangeRates[fromCurrency]) {
    throw new Error(`Currency ${fromCurrency} is not supported`);
  }

  const convertedAmount = amount / exchangeRates[fromCurrency];

  return Math.round(convertedAmount * 100) / 100;
};

const validateTransactionData = (transactionData: TransactionData) => {
  const validation = TransactionSchema.validate(transactionData, {
    abortEarly: false,
  });

  if (validation.error) {
    throw new Error(validation.error.details[0].message);
  }
};

const creditTransaction = async (transactionData: any) => {
  await prisma.account.update({
    where: { iban: transactionData.accountIbanReceiver },
    data: { balance: { increment: transactionData.amount } },
  });
};

const debitTransaction = async (transactionData: any) => {
  const accountData = await prisma.account.findUnique({
    where: { iban: transactionData.accountIbanEmitter },
  });

  if (accountData && accountData.accountType === "blocked") {
    throw new Error("emitter account blocked");
  }

  await prisma.account.update({
    where: { iban: transactionData.accountIbanEmitter },
    data: { balance: { decrement: transactionData.amount } },
  });
};

const transferTransaction = async (transactionData: any) => {
  const accountIbanEmitterData = await prisma.account.findUnique({
    where: { iban: transactionData.accountIbanEmitter },
  });

  if (
    accountIbanEmitterData &&
    accountIbanEmitterData.accountType === "blocked"
  ) {
    throw new Error("emitter account blocked");
  }

  await prisma.account.update({
    where: { iban: transactionData.accountIbanEmitter },
    data: { balance: { decrement: transactionData.amount } },
  });

  await prisma.account.update({
    where: { iban: transactionData.accountIbanReceiver },
    data: { balance: { increment: transactionData.amount } },
  });
};

const getAccountBalance = async (accountIban: string): Promise<number> => {
  try {
    const account = await prisma.account.findUnique({
      where: {
        iban: accountIban,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    return account.balance;
  } catch (error: any) {
    throw new Error(`Failed to get account balance: ${error.message}`);
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const {
      amount,
      transactionType,
      currency,
      accountIbanEmitter,
      accountIbanReceiver,
    } = req.body;

    let transactionData: TransactionData;

    switch (transactionType) {
      case "credit":
        transactionData = {
          amount: convertCurrency(amount, currency),
          transactionType,
          currency,
          accountIbanReceiver,
        };
        break;
      case "debit":
        const accountEmitter = await prisma.account.findUnique({
          where: { iban: accountIbanEmitter },
        });
        if (accountEmitter?.accountType === "blocked") {
          throw new Error(
            "Blocked accounts can only perform credit transactions"
          );
        }
        transactionData = {
          amount: amount,
          transactionType,
          currency: "EURO",
          accountIbanEmitter,
        };
        break;
      case "transfert":
        const accountEmitterTransfer = await prisma.account.findUnique({
          where: { iban: accountIbanEmitter },
        });
        if (accountEmitterTransfer?.accountType === "blocked") {
          throw new Error(
            "Blocked accounts can only perform credit transactions"
          );
        }
        transactionData = {
          amount: convertCurrency(amount, currency),
          transactionType,
          currency,
          accountIbanReceiver,
          accountIbanEmitter,
        };
        break;
      default:
        return res.status(400).json({ error: "Invalid transaction type" });
    }

    validateTransactionData(transactionData);

    const createdTransaction = await prisma.transaction.create({
      data: transactionData,
    });

    switch (transactionType) {
      case "credit":
        await creditTransaction(transactionData);

        break;
      case "debit":
        if (
          transactionData.amount > (await getAccountBalance(accountIbanEmitter))
        ) {
          throw new Error(
            "Insufficient balance in the account for the debit transaction"
          );
        }
        await debitTransaction(transactionData);
        break;
      case "transfert":
        if (
          transactionData.amount > (await getAccountBalance(accountIbanEmitter))
        ) {
          throw new Error(
            "Insufficient balance in the account for the transfer transaction"
          );
        }
        await transferTransaction(transactionData);
        break;
      default:
        return res.status(400).json({ error: "Invalid transaction type" });
    }

    res.status(200).json(createdTransaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  const { page, pageSize } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const pageSizeNumber = parseInt(pageSize as string) || 5;

  const totalRecords = await prisma.transaction.count();
  const totalPages = Math.ceil(totalRecords / pageSizeNumber);
  const currentPage = pageNumber > totalPages ? totalPages : pageNumber;

  const skip = Math.max((currentPage - 1) * pageSizeNumber, 0);

  const transactions = await prisma.transaction.findMany({
    skip: skip,
    take: pageSizeNumber,
  });

  const response = {
    totalRecords: totalRecords,
    totalPages: totalPages,
    currentPage: currentPage,
    transactions: transactions,
  };

  res.status(200).json(response);
};

export const getOneTransaction = async (id: number) => {
  try {
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) throw new Error(`Transaction with id ${id} not found`);
    else return formatDataResponse(transaction, "Transaction");
  } catch (error) {
    throw new Error(`Error to get  transaction`);
  }
};
