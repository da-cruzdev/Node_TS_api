import { Prisma, PrismaClient } from "@prisma/client"
import { TransactionSchema } from "./validators/transaction.validator"
import { Request, Response } from "express"
import TransactionData from "./dto/transaction.dto"
import { TransactionFilterOptions } from "./dto/transaction-filter.dto"
import { PaginationOptions } from "./dto/pagination.dto"

const prisma = new PrismaClient()

export const convertCurrency = (amount: number, fromCurrency: string): number => {
  const exchangeRates: Record<string, number> = {
    EURO: 1,
    USD: 1.2,
    FCFA: 656,
  }

  if (!exchangeRates[fromCurrency]) {
    throw new Error(`Currency ${fromCurrency} is not supported`)
  }

  const convertedAmount = amount / exchangeRates[fromCurrency]

  return Math.round(convertedAmount * 100) / 100
}

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, transactionType, reason, accountIbanEmitter, accountIbanReceiver } = req.body

    let transactionData: TransactionData

    switch (transactionType) {
      case "transfert":
        const accountEmitterTransfer = await prisma.account.findUnique({
          where: { iban: accountIbanEmitter },
        })
        if (accountEmitterTransfer?.accountType === "blocked") {
          throw new Error("Les comptes bloqués ne peuvent effectuer que des opérations de crédit")
        }
        transactionData = {
          amount: amount,
          transactionType,
          reason,
          accountIbanReceiver,
          accountIbanEmitter,
          status: "in process",
        }
        break
      default:
        return res.status(400).json({ error: "Type de transaction invalide" })
    }

    validateTransactionData(transactionData)

    const createdTransaction = await prisma.transaction.create({
      data: transactionData,
    })

    res.status(200).json(createdTransaction)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const updateTransaction = async (req: Request, res: Response) => {
  const transactionId = +req.params.id
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  })

  if (!transaction) {
    throw new Error("Transaction non trouvée")
  }

  if (transaction.status === "approved") {
    try {
      await transferTransaction(transaction)
    } catch (error) {
      throw new Error(`Erreur lors du transfert des fonds : ${error}`)
    }
  }
}

export const validateTransactionData = (transactionData: TransactionData) => {
  const validation = TransactionSchema.validate(transactionData, {
    abortEarly: false,
  })

  if (validation.error) {
    throw new Error(validation.error.details[0].message)
  }
}

export const getAccountBalance = async (accountIban: string): Promise<number> => {
  try {
    const account = await prisma.account.findUnique({
      where: {
        iban: accountIban,
      },
    })

    if (!account) {
      throw new Error("Compte non trouvé")
    }

    return account.balance
  } catch (error: any) {
    throw new Error(`Échec de l'obtention du solde du compte: ${error.message}`)
  }
}

export const creditTransaction = async (transactionData: any) => {
  const account = await prisma.account.findUnique({
    where: { iban: transactionData.accountIbanReceiver },
  })

  if (!account) {
    throw new Error("Ce compte n'existe pas")
  }

  await prisma.account.update({
    where: { iban: transactionData.accountIbanReceiver },
    data: { balance: { increment: transactionData.amount } },
  })
}

export const debitTransaction = async (transactionData: any) => {
  const accountData = await prisma.account.findUnique({
    where: { iban: transactionData.accountIbanEmitter },
  })

  if (!accountData) {
    throw new Error("Ce compte n'existe pas")
  }

  if (accountData && accountData.accountType === "blocked") {
    throw new Error("Désolé ce compte est bloqué")
  }

  await prisma.account.update({
    where: { iban: transactionData.accountIbanEmitter },
    data: { balance: { decrement: transactionData.amount } },
  })
}

export const transferTransaction = async (transactionData: any) => {
  const accountIbanEmitterData = await prisma.account.findUnique({
    where: { iban: transactionData.accountIbanEmitter },
  })
  const accountIbanReceiverData = await prisma.account.findUnique({
    where: { iban: transactionData.accountIbanReceiver },
  })

  if (!accountIbanEmitterData) {
    throw new Error("Ce compte n'existe pas")
  }

  if (!accountIbanReceiverData) {
    throw new Error("Le compte du bénéficiaire n'a ps été trouvé")
  }

  if (accountIbanEmitterData.accountType === "blocked" || accountIbanEmitterData.balance < transactionData.amount) {
    throw new Error("Le compte de l'émetteur n'est pas suffisamment approvisionné")
  }

  await prisma.account.update({
    where: { iban: transactionData.accountIbanEmitter },
    data: { balance: { decrement: transactionData.amount } },
  })

  await prisma.account.update({
    where: { iban: transactionData.accountIbanReceiver },
    data: { balance: { increment: transactionData.amount } },
  })
}

export const getAllTransactionsByAdmin = async (req: any, res: Response) => {
  const filterOptions: Prisma.TransactionWhereInput = getTransactionsFilterCriteria(req, true)
  const { take, skip }: PaginationOptions = req.query

  try {
    const role = req.user.role
    if (role === "user") {
      res.status(401).json({ error: "vous n'êtes pas autorisé à avoir ses données" })
    }

    const total = await prisma.transaction.count({ where: filterOptions })

    const transactions = await prisma.transaction.findMany({
      where: { ...filterOptions },
      take: take,
      skip: skip,
      include: {
        accountEmitter: true,
        accountReceiver: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(transactions)
  } catch (error) {}
}

export const getAllTransactions = async (req: any, res: Response) => {
  const { page, pageSize } = req.query
  const pageNumber = parseInt(page as string) || 1
  const pageSizeNumber = parseInt(pageSize as string) || 5

  const totalRecords = await prisma.transaction.count()
  const totalPages = Math.ceil(totalRecords / pageSizeNumber)
  const currentPage = pageNumber > totalPages ? totalPages : pageNumber

  const skip = Math.max((currentPage - 1) * pageSizeNumber, 0)

  const transactions = await prisma.transaction.findMany({
    skip: skip,
    take: pageSizeNumber,
  })

  const response = {
    totalRecords: totalRecords,
    totalPages: totalPages,
    currentPage: currentPage,
    transactions: transactions,
  }

  res.status(200).json(response)
}

export const getOneTransaction = async (req: Request, res: Response) => {
  try {
    const id = +req.params.id
    const transaction = await prisma.transaction.findUnique({ where: { id } })

    if (!transaction) res.status(404).json({ error: `Transaction with id ${id} not found` })
    else return res.status(200).json(transaction)
  } catch (error) {
    res.status(500).json({ error: `Error to get transaction` })
  }
}

export const validateTransaction = async (req: Request, res: Response) => {
  try {
    // const userRole = (req as any).user?.role

    // if (userRole !== "SuperAdmin") {
    //   res.status(401).json({ error: "Non autorisé.....!!!" })
    // }

    const { id } = req.params

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
    })

    if (!transaction) {
      return res.status(404).json({ error: `La transaction avec l'ID ${id} introuvable` })
    }
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "approved" },
    })

    return res.status(200).json(updatedTransaction)
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la validation de la transaction" })
  }
}

export const rejectTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
    })

    if (!transaction) {
      return res.status(404).json({ error: `La transaction avec l'ID ${id} introuvable` })
    }
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "rejected" },
    })

    return res.status(200).json(updatedTransaction)
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du rejet de la transaction" })
  }
}

export const getUsersTransactions = async (req: any, res: Response) => {
  const filterOptions: Prisma.TransactionWhereInput = getTransactionsFilterCriteria(req)
  const { take, skip }: PaginationOptions = req.query

  const total = await prisma.transaction.count({ where: filterOptions })

  try {
    const transactions = await prisma.transaction.findMany({
      where: { ...filterOptions },
      take: Number(take) ?? undefined,
      skip: Number(skip) ?? undefined,
      include: {
        accountReceiver: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json({ data: transactions, pagination: { take, skip, total } })
  } catch (error) {
    res.status(500).json({ error: `Error retrieving transactions: ${error}` })
  }
}

function getTransactionsFilterCriteria(req: any, skipUserId = false): Prisma.TransactionWhereInput {
  const filterOptions: TransactionFilterOptions = req.query

  const userId = req.user.id

  return {
    accountEmitter: {
      ...(userId && !skipUserId && { user: { id: +userId } }),
      ...(filterOptions.accountType && { accountType: filterOptions.accountType }),
    },
    ...(filterOptions.status && { status: filterOptions.status }),
    ...(filterOptions.date && {
      createdAt: {
        gt: getDayRange(filterOptions.date)[0],
        lt: getDayRange(filterOptions.date)[1],
      },
    }),
    ...(filterOptions.query && buildFullTextSearch(filterOptions.query)),
    // ...(filterOptions.accountType && {
    //   accountEmitter: {
    //     accountType: filterOptions.accountType,
    //   },
    // }),
  }
}

function buildFullTextSearch(query: string): Prisma.TransactionWhereInput {
  return {
    OR: [
      {
        accountReceiver: {
          name: { contains: `%${query}%` },
        },
      },
    ],
  }
}

function getDayRange(date: string): [Date, Date] {
  const day = new Date(date)
  const start = day.setHours(0, 0, 0)
  const end = day.setHours(23, 59, 59)

  return [new Date(start), new Date(end)]
}
