import { Prisma, PrismaClient } from "@prisma/client";
import { TransactionSchema } from "./validators/transaction.validator";
import { formatDataResponse } from "../common/dataFormat";
import { getdataWithPagination } from "../common/dataPagination";
import { Request, Response } from "express";
import TransactionData from "./dto/transaction.dto";

const prisma = new PrismaClient();

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

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, transactionType, accountIbanEmitter, accountIbanReceiver } =
      req.body;

    let transactionData: TransactionData;

    switch (transactionType) {
      case "credit":
        transactionData = {
          amount,
          transactionType,
          accountIbanReceiver,
        };
        break;
      case "debit":
        transactionData = {
          amount,
          transactionType,
          accountIbanEmitter,
        };
        break;
      case "transfert":
        transactionData = {
          amount,
          transactionType,
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
        await debitTransaction(transactionData);
        break;
      case "transfert":
        await transferTransaction(transactionData);
        break;
      default:
        return res.status(400).json({ error: "Invalid transaction type" });
    }

    res.status(200).json(createdTransaction);
  } catch (error) {
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

export const getAllTransactions = async (req: any, res: any) => {
  try {
    const transactions = await prisma.transaction.findMany();
    const formattedTransaction = transactions.map((transaction) =>
      formatDataResponse(transaction, "Transaction")
    );

    const response = await getdataWithPagination(formattedTransaction, req);
    res.status(200).json(response);
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: error });
  }
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
