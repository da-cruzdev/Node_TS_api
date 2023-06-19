import * as dotenv from "dotenv"
import express from "express"
import cors from "cors"
import UserRoutes from "./user/user.route"
import { PrismaClient } from "@prisma/client"
import AccountsRoutes from "./accounts/accounts.route"
import TransactionsRoutes from "./transactions/transactions.route"
import { errorHandler } from "./middleware/errorHandler.middleware"
import { createSuperAdmin } from "./utils/db.server"

const prisma = new PrismaClient()

dotenv.config()

if (!process.env.PORT) {
  process.exit()
}

const port: number = parseInt(process.env.PORT as string, 10)

const app = express()

app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "UPDATE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(errorHandler)

app.use("/", UserRoutes(prisma))
app.use("/", AccountsRoutes(prisma))
app.use("/", TransactionsRoutes(prisma))

createSuperAdmin(process.env.SUPER_ADMIN_EMAIL)
  .then(() => {
    app.listen(port, () => {
      console.log(`Listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error("Error creating super admin:", error)
    process.exit(1) // Quit the application if there is an error creating the super admin
  })
