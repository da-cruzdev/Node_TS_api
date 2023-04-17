import { Request, Response } from "express";
import { createAccount } from "./acounts.controller";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// const prisma = new PrismaClient()

// describe("createAccount", () => {
//   let req: Partial<Request>;
//   let res: Partial<Response>;

//   beforeEach(() => {
//     req = {
//       body: {
//         name: "John Doe",
//         email: "john.doe@example.com",
//         number: "1234567890",
//         balance: 1000,
//         currency: "USD",
//         bic: "ABCD1234",
//       },
//     };
//     res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };
//   });

//   afterEach(() => {
//     jest.resetAllMocks();
//   });

//   it("should create an account with valid data and return 200 status code", async () => {
//     const mockedUuidv4 = "mocked-uuid";
//     const mockedCreatedAccount = {
//       id: 1,
//       iban: `DE${mockedUuidv4}`,
//       name: req.body.name,
//       email: req.body.email,
//       number: req.body.number,
//       balance: req.body.balance,
//       currency: req.body.currency,
//       bic: req.body.bic,
//       accountType: "courant",
//     };
//     jest.spyOn(uuidv4, 'v4').mockReturnValue(mockedUuidv4);
//     jest
//       .spyOn(prisma.account, "create")
//       .mockResolvedValue(mockedCreatedAccount);

//     await createAccount(req as Request, res as Response);

//     expect(uuidv4.v4).toHaveBeenCalled();
//     expect(prisma.account.create).toHaveBeenCalledWith({
//       data: mockedCreatedAccount,
//     });
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.json).toHaveBeenCalledWith(mockedCreatedAccount);
//   });

//   it("should return 400 status code with error message for invalid data", async () => {
//     req.body.name = "";

//     await createAccount(req as Request, res as Response);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       error: expect.any(String),
//     });
//   });

//   it("should return 500 status code with error message for server error", async () => {
//     jest
//       .spyOn(prisma.account, "create")
//       .mockRejectedValue(new Error("Mocked error"));

//     await createAccount(req as Request, res as Response);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.json).toHaveBeenCalledWith({
//       error: "Mocked error",
//     });
//   });
// });
