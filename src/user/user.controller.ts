import { PrismaClient } from "@prisma/client"
import { Response, Request } from "express"
import { RequestHandler } from "express"

import { CreateUserDTO, LoginDTO } from "./dto/user.dto"
import { userSchema } from "./validators/user.validator"
import bcrypt from "bcrypt"
import { generateToken } from "./token/createToken"
import { generate } from "randomstring"
import { generateIban } from "../accounts/acounts.controller"
import { log } from "console"

const prisma = new PrismaClient()

export const signUp = async (req: Request, res: Response) => {
  const { name, email, password }: CreateUserDTO = req.body
  try {
    const validateData = await userSchema.validateAsync(
      {
        name,
        email,
        password,
      },
      { abortEarly: false },
    )
    const oldUser = await prisma.user.findUnique({ where: { email } })
    if (oldUser) {
      res.status(400).json({ error: `L'utilisateur avec l'email ${email} existe déjà` })
    }

    const hashedPassword = await bcrypt.hash(validateData.password, 10)
    const newUser = await prisma.user.create({
      data: {
        name: validateData.name,
        email: validateData.email,
        password: hashedPassword,
      },
    })

    const iban = generateIban()
    const bic = generateIban()
    const newAccount = {
      iban,
      name: validateData.name,
      balance: 0,
      currency: "XOF",
      bic,
      accountType: "current",
      userId: newUser.id,
    }

    const createdAccount = await prisma.account.create({ data: newAccount })

    const token = generateToken(newUser)

    await prisma.user.update({
      where: { id: newUser.id },
      data: { token: token },
    })

    res.status(200).json({ newUser })
  } catch (error: any) {
    if (error && error.details) {
      const errors = error.details.reduce((acc: any, current: any) => {
        acc[current.context.key] = current.message
        return acc
      }, {})
      res.status(400).json({ error: "Erreur de validation", errors, success: false })
    } else {
      res.status(500).json({ error: "Une erreur est survenue lors de la création du compte" })
    }
  }
}

export const login = async (req: Request, res: Response) => {
  const { email, password }: LoginDTO = req.body

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    if (!user) {
      return res.status(400).json({ error: "Votre email est invalide" })
    }

    const isPassword = await bcrypt.compare(password, user.password)
    if (!isPassword) {
      return res.status(400).json({ error: "Le mot de passe est invalide" })
    }

    const token = generateToken(user)
    const newUser = { ...user, token }

    res.status(200).json(newUser)
  } catch (error) {
    res.status(500).json({ error: "Erreur de connection.....!!!" })
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization

    if (!token) {
      return res.status(401).json({ error: "Authorization header missing" })
    }

    // const user = await prisma.user.findFirst({ where: { token: token } })
    // if (user) {
    //   user.token = ""
    //   await prisma.user.update({
    //     where: { id: user.id },
    //     data: { token: "" },
    //   })
    // }

    res.status(200).json({ message: "Déconnexion réussie" })
  } catch (error) {
    res.status(500).json({ error: "Une erreur est survenue lors de la déconnexion" })
  }
}

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const email = req.body.email
    const userData = await prisma.user.findUnique({
      where: { email: email },
    })

    if (userData) {
      const randomString = generate()
      const updateUser = await prisma.user.update({ where: { email: userData.email }, data: { token: randomString } })
      res.status(200).json({ message: "Veuillez réinitialiser votre mot de passe....!!", token: updateUser.token })
    } else {
      res.status(400).json({ error: "L'email est incorrect" })
    }
  } catch (error) {
    res.status(404).json(error)
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body

    const user = await prisma.user.findFirst({
      where: { token: token },
    })

    if (!user) {
      res.status(400).json({ error: "Le token est invalide" })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        token: "",
      },
    })

    res.status(200).json({ message: "Le mot de passe a été réinitialisé avec succès" })
  } catch (error) {
    res.status(500).json({ error })
  }
}

export const getUserList = async (limit: number) => {
  const users = await prisma.user.findMany({
    take: limit,
    select: {
      name: true,
      email: true,
    },
  })

  return users
}

export const getUserById: RequestHandler = async (req: any, res: Response) => {
  try {
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" })
    }
    res.status(200).json({ user })
  } catch (error) {
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des informations de l'utilisateur" })
  }
}
