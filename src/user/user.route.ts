import express, { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { verifyEmail, getUserList, login, signUp, resetPassword, logout, getUserById } from "./user.controller"
import { authMiddleware } from "./middlewares/auth.middleware"

const UserRoutes = (prisma: PrismaClient): Router => {
  const router = express.Router()

  router.post("/auth/signup", signUp)

  router.post("/auth/login", login)

  router.post("/auth/logout", authMiddleware, logout)

  router.post("/auth/forget-password", verifyEmail)

  router.post("/auth/reset-password", resetPassword)

  router.get("/user", authMiddleware, getUserById)

  router.get("/admin/list", async (req, res) => {
    const { limit } = req.query

    const users = await getUserList(Number(limit))
    res.status(200).json(users)
  })

  return router
}

export default UserRoutes
