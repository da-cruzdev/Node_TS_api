"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const UserRoutes = (prisma) => {
    const router = express_1.default.Router();
    router.post("/auth/create", user_controller_1.signUp);
    router.post("/auth/login", user_controller_1.login);
    router.get("/admin/list", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { limit } = req.query;
        const users = yield (0, user_controller_1.getUserList)(Number(limit));
        res.status(200).json(users);
    }));
    return router;
};
exports.default = UserRoutes;
