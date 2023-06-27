import express, { Router } from "express"
import { PrismaClient } from "@prisma/client"
import {
  createTransaction,
  getAllTransactions,
  getAllTransactionsByAdmin,
  getOneTransaction,
  getUsersTransactions,
  rejectTransaction,
  updateTransaction,
  validateTransaction,
} from "./transactions.controller"
import { authMiddleware } from "../user/middlewares/auth.middleware"

const TransactionsRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router()

  router.post("/transactions/create", authMiddleware, createTransaction)

  router.post("/transactions/:id/update", updateTransaction)

  router.get("/transactions", authMiddleware, getAllTransactionsByAdmin)

  router.get("/transactions/:id", authMiddleware, getOneTransaction)

  router.get("/users/transactions", authMiddleware, getUsersTransactions)

  router.get("/transactions/:id/validate", authMiddleware, validateTransaction)

  router.get("/transactions/:id/reject", authMiddleware, rejectTransaction)

  return router
}

export default TransactionsRoutes
