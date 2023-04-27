const { prismaMock } = require("../mocks");

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => prismaMock),
}));

import { Request, Response } from "express";
import {
  createAccount,
  createSubAccount,
  getAllAccounts,
} from "./acounts.controller";

describe("createAccount", () => {
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
    jest.clearAllMocks();
  });

  it("should create an account successfully with valid data", async () => {
    const validData = {
      iban: "DE455679",
      name: "John Doe",
      email: "johndoe@example.com",
      number: "+2250545896398",
      balance: 1000,
      currency: "EURO",
      bic: "ABCDEF",
    };
    prismaMock.account.create.mockResolvedValueOnce(validData);

    req.body = validData;

    await createAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(validData);
  });

  it("should return a 400 error with invalid data", async () => {
    const invalidData = {
      name: "John Doe",
      email: "johndoe@example.com",
      number: "1234567890",
      balance: -1000,
      currency: "USD",
      bic: "ABCDEF",
    };

    prismaMock.account.create.mockRejectedValueOnce(invalidData);
    req.body = invalidData;

    await createAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
});

describe("createSubAccount", () => {
  let parentAccount: { iban: string };

  beforeAll(async () => {
    parentAccount = await prismaMock.account.create({
      data: {
        name: "John Doe",
        email: "johndoe@example.com",
        number: "+22501234567",
        balance: 1000,
        currency: "EURO",
        bic: "ABCDEF",
        accountType: "courant",
      },
    });
  });

  it("should create a sub-account successfully with valid data", async () => {
    const parentAccount = await prismaMock.account.create({
      data: {
        name: "Main Account",
        email: "main_account@example.com",
        number: "123456",
        balance: 1000,
        currency: "USD",
        bic: "ABCDEF",
        accountType: "courant",
      },
    });

    const req = {
      body: {
        accountIban: parentAccount.iban,
        name: "Sub Account",
        email: "sub_account@example.com",
        number: "789012",
        balance: 500,
        currency: "USD",
        bic: "UVWXYZ",
        accountType: "savings",
      },
    } as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await createSubAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        iban: expect.any(String),
        name: "Sub Account",
        email: "sub_account@example.com",
        number: "789012",
        balance: 500,
        currency: "USD",
        bic: "UVWXYZ",
        accountType: "savings",
        parentId: parentAccount.iban,
      })
    );
  });

  it("should return an error with invalid data", async () => {
    const req = {
      body: {
        accountIban: "DE1234567890",
        name: "Jane Doe",
        email: "janedoe@example.com",
        number: "9876543210",
        balance: -500,
        currency: "EUR",
        bic: "UVWXYZ",
        accountType: "invalidType",
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    await createSubAccount(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });
});

describe("getAllAccounts", () => {
  it("should return a list of accounts with pagination information", async () => {
    const mockAccounts = [
      {
        name: "John Doe",
        email: "johndoe@example.com",
        number: "1234567890",
        balance: -1000,
        currency: "USD",
        bic: "ABCDEF",
      },
    ];

    prismaMock.account.findMany.mockResolvedValueOnce(mockAccounts);
    const req = {
      query: {
        page: "1",
        pageSize: "5",
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    prismaMock.account.count.mockResolvedValueOnce(mockAccounts.length);
    await getAllAccounts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      totalRecords: expect.any(Number),
      totalPages: expect.any(Number),
      currentPage: expect.any(Number),
      accounts: expect.any(Array),
    });
  });
});
