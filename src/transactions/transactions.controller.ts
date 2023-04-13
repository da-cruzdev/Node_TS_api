import { PrismaClient } from "@prisma/client";
import { TransactionSchema } from "./validators/transaction.validator";
import TransactionDto from "./dto/transaction.dto";

const prisma = new PrismaClient();

export const createTransaction = async (req: any, res: any) => {
  try {
    const { amount, counterPartyId, transactionType, accountIbanEmitter } =
      req.body;

    const validation = TransactionSchema.validate(req.body, {
      abortEarly: false,
    });
    if (validation.error) {
      return res
        .status(400)
        .json({ error: validation.error.details[0].message });
    }

    let transactionData: TransactionDto;
    switch (transactionType) {
      case "credit":
        transactionData = { amount, counterPartyId, transactionType };
        break;
      case "deposit":
        transactionData = { amount, counterPartyId, transactionType };
        break;
      case "card":
        transactionData = { amount, counterPartyId, transactionType };
        break;
      case "debit":
        transactionData = {
          amount,
          counterPartyId,
          transactionType,
          accountIbanEmitter,
        };
        break;
      default:
        return res.status(400).json({ error: "Type de transaction invalide" });
    }

    const createdTransaction = await prisma.transaction.create({
      data: transactionData,
    });

    switch (transactionType) {
      case "credit":
        break;
      case "deposit":
        await prisma.account.update({
          where: { iban: accountIbanEmitter },
          data: { balance: { increment: amount } },
        });
        break;
      case "card":
        break;
      case "debit":
        await prisma.account.update({
          where: { iban: accountIbanEmitter },
          data: { balance: { decrement: amount } },
        });
        break;
      default:
        return res.status(400).json({ error: "Type de transaction invalide" });
    }

    res.status(200).json(createdTransaction);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la transaction" });
  }
};

const formatTransactionResponse = (transaction: any) => {
  return {
    id: transaction.id,
    amount: transaction.amount,
    counterPartyId: transaction.counterPartyId,
    transactionType: transaction.transactionType,
    createdAt: transaction.createdAt.toDateString(),
    updatedAt: transaction.updatedAt.toDateString(),
    accountIbanEmitter: transaction.accountIbanEmitter,
  };
};

export const getAllTransactions = async (req: any, res: any) => {
  const transactions = await prisma.transaction.findMany();
  const totalRecords = transactions.length;
  const totalPages = Math.ceil(totalRecords / 5);
  const currentPage = parseInt(req.query.page) || 1;

  const startIndex = (currentPage - 1) * 5;
  const endIndex = startIndex + 5;
  const transactionsPerPage = transactions.slice(startIndex, endIndex);

  const response = {
    totalRecords,
    totalPages,
    currentPage,
    transactions: transactionsPerPage.map(formatTransactionResponse),
  };

  res.status(200).json(response);
};

export const getOneTransaction = async (id: number) => {
  try {
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) throw new Error(`Transaction with id ${id} not found`);
    else return formatTransactionResponse(transaction);
  } catch (error) {
    throw new Error(`Error to get  transaction`);
  }
};
