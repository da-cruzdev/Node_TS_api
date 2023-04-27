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
exports.getUserList = exports.login = exports.signUp = void 0;
const client_1 = require("@prisma/client");
const user_validator_1 = require("./validators/user.validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const createToken_1 = require("./token/createToken");
const prisma = new client_1.PrismaClient();
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    try {
        const validateData = yield user_validator_1.userSchema.validateAsync({
            name,
            email,
            password,
        }, { abortEarly: false });
        const oldUser = yield prisma.user.findUnique({ where: { email } });
        if (oldUser) {
            res.status(400).json({ error: `User with email ${email} already exits` });
        }
        const hashedPassword = yield bcrypt_1.default.hash(validateData.password, 10);
        const newUser = yield prisma.user.create({
            data: {
                name: validateData.name,
                email: validateData.email,
                password: hashedPassword,
            },
        });
        const user = Object.assign(Object.assign({}, newUser), { password: undefined });
        res.status(200).json({ newUser: user });
    }
    catch (error) {
        if (error && error.details) {
            const errors = error.details.reduce((acc, current) => {
                acc[current.context.key] = current.message;
                return acc;
            }, {});
            res.status(400).json({ error: "vaildation failed", errors });
        }
    }
});
exports.signUp = signUp;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(401).json({ error: "Invalid email" });
            return;
        }
        const isPassword = yield bcrypt_1.default.compare(password, user.password);
        if (!isPassword) {
            res.status(401).json({ error: "Invalid password" });
            return;
        }
        const token = (0, createToken_1.generateToken)(user);
        res.status(200).json({ token: token });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to login" });
    }
});
exports.login = login;
const getUserList = (limit) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({
        take: limit,
        select: {
            name: true,
            email: true,
        },
    });
    return users;
});
exports.getUserList = getUserList;
