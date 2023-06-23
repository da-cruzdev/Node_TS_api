import { PrismaClient } from "@prisma/client"
import { Response, Request } from "express"
import { v4 as uuidv4 } from "uuid"
import { accountSchema } from "./validators/account.validator"
import { Prisma } from "@prisma/client"

type AccountWhereInputWithParentId = Prisma.AccountWhereInput & {
  parentId?: string
}

const prisma = new PrismaClient()

export const generateIban = (): string => {
  const ibanPrefix = "CI"
  const iban = `${ibanPrefix}${uuidv4()}`
  return iban
}

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, number, balance, currency, bic } = req.body
    const validateData = await accountSchema.validateAsync(
      { name, number, balance, currency, bic, accountType: "current" },
      {
        abortEarly: false,
      },
    )

    const iban = generateIban()
    const newAccount = {
      iban,
      name: validateData.name,
      balance: validateData.balance,
      currency: validateData.currency,
      bic: validateData.bic,
      accountType: validateData.accountType,
    }

    const createdAccount = await prisma.account.create({ data: newAccount })
    res.status(200).json(createdAccount)
  } catch (error: any) {
    res.status(400).json({ error: error.details[0].message })
  }
}

export const createSubAccount = async (req: Request, res: Response) => {
  try {
    const { accountIban, accountType } = req.body

    const mainAccount = await prisma.account.findUnique({
      where: { iban: accountIban },
    })
    if (!mainAccount) {
      return res.status(404).json({ error: "Compte principal introuvable" })
    }

    if (mainAccount.accountType !== "current") {
      return res.status(400).json({ error: "Le compte principal doit être de type courant" })
    }

    let subAccountType
    if (accountType === "savings" || accountType === "blocked") {
      subAccountType = accountType
    } else {
      return res.status(400).json({ error: "Type de compte invalide pour le sous-compte" })
    }

    const iban = generateIban()

    const newSubAccount = {
      iban,
      name: mainAccount.name,
      balance: 0,
      currency: mainAccount.currency,
      bic: mainAccount.bic,
      accountType: subAccountType,
      parentId: mainAccount.iban,
      userId: mainAccount.userId,
    }

    const createdSubAccount = await prisma.account.create({
      data: newSubAccount,
    })

    res.status(200).json(createdSubAccount)
  } catch (error: any) {
    res.status(500).json({ error: "Une erreur est survenue lors de la création du sous-compte" })
  }
}

export const getAllAccounts = async (req: Request, res: Response) => {
  const { page, pageSize } = req.query
  const pageNumber = parseInt(page as string) || 1
  const pageSizeNumber = parseInt(pageSize as string) || 5

  const totalRecords = await prisma.account.count({
    where: { parentId: null },
  })
  const totalPages = Math.ceil(totalRecords / pageSizeNumber)
  const currentPage = pageNumber > totalPages ? totalPages : pageNumber

  const skip = Math.max((currentPage - 1) * pageSizeNumber, 0)

  const accounts = await prisma.account.findMany({
    where: {
      parentId: null,
    },
    skip: skip,
    take: pageSizeNumber,
  })

  const response = {
    totalRecords: totalRecords,
    totalPages: totalPages,
    currentPage: currentPage,
    accounts: accounts,
  }

  res.status(200).json(response)
}

export const getUserAccount = async (req: any, res: Response) => {
  try {
    const userId = req.user.id

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable" })
    }

    const mainAccount = await prisma.account.findFirst({ where: { userId } })
    if (!mainAccount) {
      res.status(404).json({ error: "Compte principal introuvable" })
    }

    let subAccounts: any[] = []
    if (mainAccount) {
      subAccounts = await prisma.account.findMany({ where: { parentId: mainAccount.iban } })
    }

    const userAccounts = {
      mainAccount,
      subAccounts,
    }

    res.status(200).json(userAccounts)
  } catch (error) {
    res.status(500).json({ error: "Erreur survenue lors de la récupération des comptes" })
  }
}

export const creditAccount = async (req: Request, res: Response) => {
  try {
    const { accountIban, amount } = req.body

    const account = await prisma.account.findUnique({
      where: { iban: accountIban },
    })
    if (!account) {
      return res.status(404).json({ error: "Compte introuvable" })
    }

    const updatedAccount = await prisma.account.update({
      where: { iban: accountIban },
      data: {
        balance: account.balance + amount,
      },
    })

    res.status(200).json(updatedAccount)
  } catch (error: any) {
    res.status(500).json({ error: "Une erreur est survenue lors du crédit du compte" })
  }
}

export const getOneAccount = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params
    const account = await prisma.account.findUnique({ where: { iban } })
    if (!account) res.status(404).json({ error: `Account with iban ${iban} not found` })
    return res.status(200).json(account)
  } catch (error) {
    res.status(500).json({ error })
  }
}

export const getSubAccountsByParentId = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params

    const parentAccount = await prisma.account.findUnique({
      where: {
        iban,
      },
    })
    if (!parentAccount) {
      res.status(404).json({ error: "Parent account not found" })
    }
    const subAccounts = await prisma.account.findMany({
      where: {
        parentId: iban,
      } as AccountWhereInputWithParentId,
    })

    res.status(200).json(subAccounts)
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get sub-accounts", message: error.message })
  }
}

export const getSubAccountByIban = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params

    const subAccount = await prisma.account.findUnique({
      where: { iban },
    })

    if (!subAccount) {
      return res.status(404).json({ error: "Sub-account not found" })
    }

    res.status(200).json(subAccount)
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to get sub-account",
    })
  }
}

export const unblockAccount = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params
    const accountData = await prisma.account.findUnique({
      where: { iban },
    })

    if (!accountData) {
      throw new Error("Account not found")
    }

    if (accountData.accountType !== "blocked") {
      throw new Error("Account is not blocked")
    }

    await prisma.account.update({
      where: { iban },
      data: { accountType: "savings" },
    })

    return res.status(200).json({ message: "Account unblocked successfully" })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { iban, name, email, number, balance, currency, bic, accountType } = req.body

    const validationResult = accountSchema.validate(
      {
        name,
        email,
        balance,
        currency,
        bic,
        accountType,
      },
      { abortEarly: false },
    )
    if (validationResult.error) {
      return res.status(400).json({ error: validationResult.error.details[0].message })
    }

    const existingAccount = await prisma.account.findUnique({
      where: { iban },
    })
    if (!existingAccount) {
      return res.status(404).json({ error: "Account not found" })
    }

    if (existingAccount.accountType === "blocked") {
      return res.status(400).json({ error: "Blocked account cannot be updated" })
    }

    let updatedAccountType
    if (accountType === "savings" || accountType === "blocked") {
      updatedAccountType = accountType
    } else {
      return res.status(400).json({ error: "Invalid account type for update" })
    }

    const updatedAccount = await prisma.account.update({
      where: { iban },
      data: {
        name,

        balance,
        currency,
        bic,
        accountType: updatedAccountType,
      },
    })

    res.status(200).json(updatedAccount)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params

    const existingAccount = await prisma.account.findUnique({
      where: { iban },
    })
    if (!existingAccount) {
      return res.status(404).json({ error: "Account not found" })
    }

    if (existingAccount.accountType === "blocked") {
      return res.status(400).json({ error: "Blocked account cannot be deleted" })
    }

    await prisma.account.delete({ where: { iban } })

    res.status(200).json({ message: "Account successfully deleted" })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteSubAccount = async (req: Request, res: Response) => {
  try {
    const { iban } = req.params

    const existingSubAccount = await prisma.account.findUnique({
      where: { iban },
    })
    if (!existingSubAccount) {
      return res.status(404).json({ error: "Sub-account not found" })
    }

    if (existingSubAccount.accountType === "blocked") {
      return res.status(400).json({ error: "Blocked sub-account cannot be deleted" })
    }

    await prisma.account.delete({ where: { iban } })

    res.status(200).json({ message: "Sub-account successfully deleted" })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
