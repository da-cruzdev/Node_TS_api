import { PrismaClient } from "@prisma/client"
import { Response, Request } from "express"
import { CreateUserDTO, LoginDTO } from "./dto/user.dto"
import { userSchema } from "./validators/user.validator"
import bcrypt from "bcrypt"
import { generateToken } from "./token/createToken"
import { generate } from "randomstring"

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
    const token = generateToken(newUser)
    const user = { ...newUser, password: undefined }

    res.status(200).json({ newUser: user, token: token, success: true })
  } catch (error: any) {
    if (error && error.details) {
      const errors = error.details.reduce((acc: any, current: any) => {
        acc[current.context.key] = current.message
        return acc
      }, {})
      res.status(400).json({ error: "Erreur de validation", errors, success: false })
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

    res.status(200).json({ token: token })
  } catch (error) {
    res.status(500).json({ error: "Erreur de connection.....!!!" })
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
