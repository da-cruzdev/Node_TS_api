import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { login, signUp } from "./user.controller";

const UserRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/auth/create", signUp);

  router.post("/auth/login", login);

  router.get("/", (req, res) => {
    res.send("Hello");
  });

  return router;
};

export default UserRoutes;
