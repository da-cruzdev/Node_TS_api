import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getUserList, login, signUp } from "./user.controller";

const UserRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/auth/create", signUp);

  router.post("/auth/login", login);

  router.get("/admin/list", async (req, res) => {
    const { limit } = req.query;

    const users = await getUserList(Number(limit));
    res.status(200).json(users);
  });

  return router;
};

export default UserRoutes;
