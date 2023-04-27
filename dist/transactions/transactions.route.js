"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transactions_controller_1 = require("./transactions.controller");
const auth_middleware_1 = require("../user/middlewares/auth.middleware");
const TransactionsRoutes = (prisma) => {
    const router = express_1.default.Router();
    router.post("/transactions/create", auth_middleware_1.authMiddleware, transactions_controller_1.createTransaction);
    router.get("/transactions", auth_middleware_1.authMiddleware, transactions_controller_1.getAllTransactions);
    router.get("/transactions/:id", auth_middleware_1.authMiddleware, transactions_controller_1.getOneTransaction);
    return router;
};
exports.default = TransactionsRoutes;
