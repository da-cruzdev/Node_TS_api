// const { Request, Response } = require('express');
const { PrismaClient } = require("@prisma/client");
const { createTransaction } = require("./transactions.controller");
const prisma = new PrismaClient();

const cleanup = async () => {
  await prisma.transaction.deleteMany();
};

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await cleanup();
});

afterEach(async () => {
  await cleanup();
});

describe("createTransaction", () => {
  // it("should create a transaction with the appropriate data", async () => {
  //   const req = {
  //     body: {
  //       amount: 100,
  //       transactionType: "credit",
  //       accountIbanReceiver: "FR1234567890",
  //     },
  //   };
  //   const res = {
  //     status: jest.fn().mockReturnThis(),
  //     json: jest.fn(),
  //   };

  //   const expected = {
  //     id: expect.any(Number),
  //     amount: 100,
  //     transactionType: "credit",
  //     accountIbanReceiver: "FR1234567890",
  //     status: "success",
  //   };

  //   await createTransaction(req, res);

  //   expect(res.status).toHaveBeenCalledWith(200);
  //   expect(res.json).toHaveBeenCalledWith(expect.objectContaining(expected));
  // });

  it("should return an error with a status of 400 for an invalid transaction type", async () => {
    const req = {
      body: {
        amount: 100,
        transactionType: "invalid",
        accountIbanReceiver: "FR1234567890",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid transaction type",
    });
  });
});
