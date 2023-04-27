"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const acounts_controller_1 = require("./acounts.controller");
const auth_middleware_1 = require("../user/middlewares/auth.middleware");
const AccountsRoutes = (prisma) => {
    const router = express_1.default.Router();
    router.post("/accounts/create", auth_middleware_1.authMiddleware, acounts_controller_1.createAccount);
    router.post("/accounts/subaccounts/create", auth_middleware_1.authMiddleware, acounts_controller_1.createSubAccount);
    router.get("/accounts", auth_middleware_1.authMiddleware, acounts_controller_1.getAllAccounts);
    router.get("/accounts/:iban", auth_middleware_1.authMiddleware, acounts_controller_1.getOneAccount);
    router.get("/accounts/:iban/subaccounts", auth_middleware_1.authMiddleware, acounts_controller_1.getSubAccountsByParentId);
    router.get("/accounts/:iban/subaccounts/:iban", auth_middleware_1.authMiddleware, acounts_controller_1.getSubAccountByIban);
    router.get("/accounts/:iban/subaccounts/:iban/unblock", auth_middleware_1.authMiddleware, acounts_controller_1.unblockAccount);
    router.delete("/accounts/:iban", auth_middleware_1.authMiddleware, acounts_controller_1.deleteAccount);
    router.delete("/subaccounts/:iban", auth_middleware_1.authMiddleware, acounts_controller_1.deleteSubAccount);
    return router;
};
exports.default = AccountsRoutes;
