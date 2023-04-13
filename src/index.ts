import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import UserRoutes from "./user/user.route";
import { PrismaClient } from "@prisma/client";
import AccountsRoutes from "./accounts/accounts.route";
import TransactionsRoutes from "./transactions/transactions.route";

const prisma = new PrismaClient();

dotenv.config();

if (!process.env.PORT) {
  process.exit();
}

const port: number = parseInt(process.env.PORT as string, 10);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", UserRoutes(prisma));
app.use("/", AccountsRoutes(prisma));
app.use("/", TransactionsRoutes(prisma));

app.listen(port, () => {
  console.log(`Listennig on port ${port}`);
});
