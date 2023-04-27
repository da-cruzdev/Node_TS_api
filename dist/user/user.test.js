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
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const { prismaMock } = require("../mocks");
jest.mock("@prisma/client", () => ({
    PrismaClient: jest.fn().mockImplementation(() => prismaMock),
}));
const user_controller_1 = require("./user.controller");
const user_validator_1 = require("./validators/user.validator");
describe("login", () => {
    let req;
    let res;
    beforeEach(() => {
        req = {
            body: {
                email: "example@api.com",
                password: "password123",
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("should return 401 with error message if email is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.spyOn(prismaMock.user, "findUnique").mockResolvedValueOnce(null);
        yield (0, user_controller_1.login)(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid email" });
    }));
    it("should return 401 with error message if password is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.spyOn(prismaMock.user, "findUnique").mockResolvedValueOnce({
            id: 1,
            email: "test@example.com",
            password: yield bcrypt.hash("password123", 10),
        });
        jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);
        yield (0, user_controller_1.login)(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid password" });
    }));
    it("should return 200 with token if email and password are valid", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.spyOn(prismaMock.user, "findUnique").mockResolvedValue({
            id: 1,
            email: "test@api.com",
            password: yield bcrypt.hash("password123", 10),
        });
        jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
        yield (0, user_controller_1.login)(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ token: expect.any(String) });
    }));
    it("should return 500 with error message if an error occurs", () => __awaiter(void 0, void 0, void 0, function* () {
        jest
            .spyOn(prismaMock.user, "findUnique")
            .mockRejectedValue(new Error("Database error"));
        yield (0, user_controller_1.login)(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to login" });
    }));
});
describe("getUserList", () => {
    let prismaSpy;
    beforeEach(() => {
        prismaSpy = jest.spyOn(prismaMock.user, "findMany");
    });
    afterEach(() => {
        prismaSpy.mockRestore();
    });
    it("should return an array of users with name and email properties", () => __awaiter(void 0, void 0, void 0, function* () {
        prismaSpy.mockResolvedValue([
            { name: "John", email: "john@example.com" },
            { name: "Jane", email: "jane@example.com" },
        ]);
        const users = yield (0, user_controller_1.getUserList)(5);
        expect(Array.isArray(users)).toBe(true);
        expect(users[0]).toHaveProperty("name");
        expect(users[0]).toHaveProperty("email");
        expect(users[1]).toHaveProperty("name");
        expect(users[1]).toHaveProperty("email");
    }));
    it("should return an empty array if no users are found", () => __awaiter(void 0, void 0, void 0, function* () {
        prismaSpy.mockResolvedValue([]);
        const users = yield (0, user_controller_1.getUserList)(10);
        expect(users).toEqual([]);
    }));
    it("should throw an error if an error occurs while fetching users", () => __awaiter(void 0, void 0, void 0, function* () {
        prismaSpy.mockRejectedValue(new Error("Database error"));
        yield expect((0, user_controller_1.getUserList)(3)).rejects.toThrowError("Database error");
    }));
});
describe("signUp", () => {
    let req;
    let res;
    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it("should return 200 with new user object if data is valid", () => __awaiter(void 0, void 0, void 0, function* () {
        req.body = {
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
        };
        jest.spyOn(user_validator_1.userSchema, "validateAsync").mockResolvedValue({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
        });
        jest.spyOn(prismaMock.user, "findUnique").mockResolvedValue(null);
        jest.spyOn(bcrypt, "hash").mockResolvedValue("hashedPassword");
        jest.spyOn(prismaMock.user, "create").mockResolvedValue({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            password: "hashedPassword",
        });
        yield (0, user_controller_1.signUp)(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            newUser: expect.objectContaining({
                id: expect.any(Number),
                name: "John Doe",
                email: "john@example.com",
            }),
        });
    }));
    it("should return 400 with error message if user already exists", () => __awaiter(void 0, void 0, void 0, function* () {
        req.body = {
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
        };
        jest.spyOn(prismaMock.user, "findUnique").mockResolvedValue({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            password: "hashedPassword",
        });
        yield (0, user_controller_1.signUp)(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "User with email john@example.com already exits",
        });
    }));
    // it("should return 400 with error message if data validation fails", async () => {
    //   req.body = {
    //     name: "John Doe",
    //     email: "john@example.com",
    //     password: "p",
    //   };
    //   jest
    //     .spyOn(userSchema, "validateAsync")
    //     .mockRejectedValue(new Error("vaildation failed"));
    //   await signUp(req, res);
    //   expect(res.status).toHaveBeenCalledWith(400);
    //   expect(res.json).toHaveBeenCalledWith({
    //     error: "vaildation failed",
    //     errors: { password: "Mot de passe doit contenir au moins 6 caractères" },
    //   });
    // });
});
