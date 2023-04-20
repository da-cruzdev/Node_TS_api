import { Prisma, User } from "@prisma/client";

const bcrypt = require("bcrypt");

const { prismaMock } = require("../mocks");

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => prismaMock),
}));

import { Request, Response } from "express";
import { getUserList, login, signUp } from "./user.controller";

import { userSchema } from "./validators/user.validator";

describe("login", () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = {
      body: {
        email: "example@api.com",
        password: "password123",
      },
    } as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 with error message if email is invalid", async () => {
    jest.spyOn(prismaMock.user, "findUnique").mockResolvedValueOnce(null);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid email" });
  });

  it("should return 401 with error message if password is invalid", async () => {
    jest.spyOn(prismaMock.user, "findUnique").mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      password: await bcrypt.hash("password123", 10),
    } as unknown as Prisma.Prisma__UserClient<User>);

    jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid password" });
  });

  it("should return 200 with token if email and password are valid", async () => {
    jest.spyOn(prismaMock.user, "findUnique").mockResolvedValue({
      id: 1,
      email: "test@api.com",
      password: await bcrypt.hash("password123", 10),
    } as unknown as Prisma.Prisma__UserClient<User>);

    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: expect.any(String) });
  });

  it("should return 500 with error message if an error occurs", async () => {
    jest
      .spyOn(prismaMock.user, "findUnique")
      .mockRejectedValue(new Error("Database error"));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to login" });
  });
});

describe("getUserList", () => {
  let prismaSpy: jest.SpyInstance;

  beforeEach(() => {
    prismaSpy = jest.spyOn(prismaMock.user, "findMany");
  });

  afterEach(() => {
    prismaSpy.mockRestore();
  });

  it("should return an array of users with name and email properties", async () => {
    prismaSpy.mockResolvedValue([
      { name: "John", email: "john@example.com" },
      { name: "Jane", email: "jane@example.com" },
    ]);

    const users = await getUserList(5);

    expect(Array.isArray(users)).toBe(true);
    expect(users[0]).toHaveProperty("name");
    expect(users[0]).toHaveProperty("email");
    expect(users[1]).toHaveProperty("name");
    expect(users[1]).toHaveProperty("email");
  });

  it("should return an empty array if no users are found", async () => {
    prismaSpy.mockResolvedValue([]);

    const users = await getUserList(10);

    expect(users).toEqual([]);
  });

  it("should throw an error if an error occurs while fetching users", async () => {
    prismaSpy.mockRejectedValue(new Error("Database error"));

    await expect(getUserList(3)).rejects.toThrowError("Database error");
  });
});

describe("signUp", () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = {} as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 with new user object if data is valid", async () => {
    req.body = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    jest.spyOn(userSchema, "validateAsync").mockResolvedValue({
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
    } as unknown as Prisma.Prisma__UserClient<User>);

    await signUp(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      newUser: expect.objectContaining({
        id: expect.any(Number),
        name: "John Doe",
        email: "john@example.com",
      }),
    });
  });

  it("should return 400 with error message if user already exists", async () => {
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
    } as unknown as Prisma.Prisma__UserClient<User>);

    await signUp(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "User with email john@example.com already exits",
    });
  });

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
