import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { signUp } from "./user.controller";

const UserRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router();

  router.post("/user/create", async (req, res) => {
    const { name, email, password } = req.body;

    try {
      const newUser = await signUp(name, email, password);
      res.json(newUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to signup" });
    }
  });

  router.get("/", (req, res) => {
    res.send("Hello");
  });

  return router;
};

export default UserRoutes;
