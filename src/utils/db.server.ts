import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { generateAdminToken } from "../user/token/createToken"

let db: PrismaClient

declare global {
  var __db: PrismaClient | undefined
}

async function createSuperAdmin(email: any) {
  try {
    const existingAdmin = await global.__db?.user.findFirst({
      where: { email: email },
    })
    if (!existingAdmin) {
      const password = await bcrypt.hash("azertyuiop", 10)
      const superAdmin = await global.__db?.user.create({
        data: {
          name: "admin",
          email: "superadmin@gmail.com",
          password: password,
          role: "SuperAdmin",
        },
      })

      const token = generateAdminToken(superAdmin)

      await global.__db?.user.update({
        where: { id: superAdmin?.id },
        data: { token: token },
      })

      console.log("Super admin créé avec succès: ", superAdmin)
    }
  } catch (error) {
    console.error("Erreur lors de la création du super admin : ", error)
  }
}

if (!global.__db) {
  global.__db = new PrismaClient()
}

db = global.__db

export { db, createSuperAdmin }
