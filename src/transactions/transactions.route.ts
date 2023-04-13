import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  createTransaction,
  getAllTransactions,
} from "./transactions.controller";

const TransactionsRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/transactions/create", createTransaction);

  router.get("/transactions", getAllTransactions);

  return router;
};

export default TransactionsRoutes;
