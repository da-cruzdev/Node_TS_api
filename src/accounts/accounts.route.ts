import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  createAccount,
  createSubAccount,
  getAllAccounts,
  getOneAccount,
  getSubAccountByIban,
  getSubAccountsByParentId,
} from "./acounts.controller";

const AccountsRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/accounts/create", createAccount);

  router.post("/accounts/subaccounts/create", createSubAccount);

  router.get("/accounts", getAllAccounts);

  router.get("/accounts/:iban", async (req: any, res: any) => {
    try {
      const iban = req.params.iban;
      const account = await getOneAccount(iban);
      if (account) {
        res.status(200).json(account);
      } else {
        res.status(404).json({ error: "account not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération du compte" });
    }
  });

  router.get("/accounts/:iban/subaccounts", getSubAccountsByParentId);

  router.get("/accounts/:iban/subaccounts/:iban", getSubAccountByIban);

  return router;
};

export default AccountsRoutes;
