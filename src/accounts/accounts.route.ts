import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  createAccount,
  createSubAccount,
  getAllAccounts,
  getOneAccount,
  getSubAccountByIban,
  getSubAccountsByParentId,
  unblockAccount,
} from "./acounts.controller";

const AccountsRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/accounts/create", createAccount);

  router.post("/accounts/subaccounts/create", createSubAccount);

  router.get("/accounts", getAllAccounts);

  router.get("/accounts/:iban", getOneAccount);

  router.get("/accounts/:iban/subaccounts", getSubAccountsByParentId);

  router.get("/accounts/:iban/subaccounts/:iban", getSubAccountByIban);

  router.get("/accounts/:iban/subaccounts/:iban/unblock", unblockAccount);

  return router;
};

export default AccountsRoutes;
