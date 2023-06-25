import express, { Router } from "express"
import { PrismaClient } from "@prisma/client"
import {
  blockAccount,
  createAccount,
  createSubAccount,
  creditAccount,
  deleteAccount,
  deleteSubAccount,
  getAllAccounts,
  getOneAccount,
  getSubAccountByIban,
  getSubAccountsByParentId,
  getUserAccount,
  unblockAccount,
} from "./acounts.controller"
import { authMiddleware } from "../user/middlewares/auth.middleware"

const AccountsRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router()

  router.post("/accounts/create", authMiddleware, createAccount)

  router.post("/accounts/subaccounts/create", authMiddleware, createSubAccount)

  router.get("/accounts", authMiddleware, getAllAccounts)

  router.get("/accounts/:iban", authMiddleware, getOneAccount)

  router.get("/users/accounts", authMiddleware, getUserAccount)

  router.post("/account/credit", creditAccount)

  router.get("/accounts/:iban/subaccounts", authMiddleware, getSubAccountsByParentId)

  router.get("/accounts/:iban/subaccounts/:iban", authMiddleware, getSubAccountByIban)

  router.post("/accounts/:iban/unblock", authMiddleware, unblockAccount)

  router.post("/accounts/:iban/block", authMiddleware, blockAccount)

  router.delete("/accounts/:iban", authMiddleware, deleteAccount)

  router.delete("/subaccounts/:iban", authMiddleware, deleteSubAccount)

  return router
}

export default AccountsRoutes
