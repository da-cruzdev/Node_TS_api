import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createAccount } from "./acounts.controller";

const AccountsRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/account/create", createAccount);

  return router;
};

export default AccountsRoutes;
