import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  createTransaction,
  getAllTransactions,
  getOneTransaction,
} from "./transactions.controller";

const TransactionsRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/transactions/create", createTransaction);

  router.get("/transactions", getAllTransactions);

  router.get("/transactions/:id", async (req: any, res: any) => {
    const id = +req.params.id;

    try {
      const transaction = await getOneTransaction(id);

      if (transaction) res.status(200).json(transaction);
    } catch (error) {
      res.status(404).json({ error: `Transaction with id ${id} not found` });
    }
  });

  return router;
};

export default TransactionsRoutes;
