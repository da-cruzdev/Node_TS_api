import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  createTransaction,
  getAllTransactions,
  getOneTransaction,
} from "./transactions.controller";
import { authMiddleware } from "../user/middlewares/auth.middleware";

const TransactionsRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/transactions/create", authMiddleware, createTransaction);

  router.get("/transactions", authMiddleware, getAllTransactions);

  router.get("/transactions/:id", authMiddleware, getOneTransaction);

  return router;
};

export default TransactionsRoutes;
