import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  createAccount,
  createSubAccount,
  getAllAccounts,
  getOneAccount,
} from "./acounts.controller";

const AccountsRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/account/create", createAccount);

  router.post("/subaccount/create", createSubAccount);

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

  return router;
};

export default AccountsRoutes;
