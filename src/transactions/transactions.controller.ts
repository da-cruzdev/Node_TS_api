import { Prisma, PrismaClient } from "@prisma/client";
import { TransactionSchema } from "./validators/transaction.validator";
import { formatDataResponse } from "../common/dataFormat";
import { getdataWithPagination } from "../common/dataPagination";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, transactionType, accountIbanEmitter, accountIbanReceiver } =
      req.body;

    const validation = TransactionSchema.validate(req.body, {
      abortEarly: false,
    });
    if (validation.error) {
      return res
        .status(400)
        .json({ error: validation.error.details[0].message });
    }

    let transactionData;
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

    const createdTransaction = await prisma.transaction.create({
      data: transactionData,
    });

    switch (transactionType) {
      case "credit":
        await prisma.account.update({
          where: { iban: accountIbanReceiver },
          data: { balance: { increment: amount } },
        });
        break;

      case "debit":
        const accountData = await prisma.account.findUnique({
          where: { iban: accountIbanEmitter },
        });
        if (accountData && accountData.accountType === "blocked") {
          return res.status(400).json({ error: "emitter account blocked" });
        }
        await prisma.account.update({
          where: { iban: accountIbanEmitter },
          data: { balance: { decrement: amount } },
        });
        break;

      case "transfert":
        const accountIbanEmitterData = await prisma.account.findUnique({
          where: { iban: accountIbanEmitter },
        });
        if (
          accountIbanEmitterData &&
          accountIbanEmitterData.accountType === "blocked"
        ) {
          return res.status(400).json({ error: "emitter account blocked" });
        }

        await prisma.account.update({
          where: { iban: accountIbanEmitter },
          data: { balance: { decrement: amount } },
        });
        await prisma.account.update({
          where: { iban: accountIbanReceiver },
          data: { balance: { increment: amount } },
        });
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
