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
const { prismaMock } = require("../mocks");
jest.mock("@prisma/client", () => ({
    PrismaClient: jest.fn().mockImplementation(() => prismaMock),
}));
const acounts_controller_1 = require("./acounts.controller");
describe("createAccount", () => {
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
        jest.clearAllMocks();
    });
    it("should create an account successfully with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
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
        yield (0, acounts_controller_1.createAccount)(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(validData);
    }));
    it("should return a 400 error with invalid data", () => __awaiter(void 0, void 0, void 0, function* () {
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
        yield (0, acounts_controller_1.createAccount)(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    }));
    // it("should return a 500 error if something goes wrong with the server", async () => {
    //   const serverError = new Error("Internal server error");
    //   jest.spyOn(prismaMock.account, "create").mockRejectedValueOnce(serverError);
    //   const validData = {
    //     name: "John Doe",
    //     email: "johndoe@example.com",
    //     number: "+2250745896325",
    //     balance: 1000,
    //     currency: "EURO",
    //     bic: "ABCDEF",
    //   };
    //   req.body = validData;
    //   await createAccount(req, res);
    //   expect(res.status).toHaveBeenCalledWith(500);
    //   expect(res.json).toHaveBeenCalledWith({ error: serverError });
    // });
});
describe("createSubAccount", () => {
    let parentAccount;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        parentAccount = yield prismaMock.account.create({
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
    }));
    it("should create a sub-account successfully with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
        const parentAccount = yield prismaMock.account.create({
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
        // make a request to create a sub-account
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
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        yield (0, acounts_controller_1.createSubAccount)(req, res);
        // check that the sub-account was created successfully
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            iban: expect.any(String),
            name: "Sub Account",
            email: "sub_account@example.com",
            number: "789012",
            balance: 500,
            currency: "USD",
            bic: "UVWXYZ",
            accountType: "savings",
            parentId: parentAccount.iban,
        }));
    }));
    // it("should return an error with invalid data", async () => {
    //   const req = {
    //     body: {
    //       accountIban: "DE1234567890",
    //       name: "Jane Doe",
    //       email: "janedoe@example.com",
    //       number: "9876543210",
    //       balance: -500,
    //       currency: "EUR",
    //       bic: "UVWXYZ",
    //       accountType: "invalidType",
    //     },
    //   } as Request;
    //   const res = {
    //     status: jest.fn().mockReturnThis(),
    //     json: jest.fn(),
    //   } as unknown as Response;
    //   await createSubAccount(req, res);
    //   expect(res.status).toHaveBeenCalledWith(400);
    //   expect(res.json).toHaveBeenCalled();
    // });
});
// describe("getAllAccounts", () => {
//   it("should return a list of accounts with pagination information", async () => {
//     const mockAccounts = [
//       {
//         name: "John Doe",
//         email: "johndoe@example.com",
//         number: "1234567890",
//         balance: -1000,
//         currency: "USD",
//         bic: "ABCDEF",
//       },
//     ];
//     prismaMock.account.findMany.mockResolvedValueOnce(mockAccounts);
//     const req = {
//       query: {
//         page: "1",
//         pageSize: "5",
//       },
//     } as unknown as Request;
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     } as unknown as Response;
//     prismaMock.account.count.mockResolvedValueOnce(mockAccounts.length);
//     await getAllAccounts(req, res);
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.json).toHaveBeenCalledWith({
//       totalRecords: expect.any(Number),
//       totalPages: expect.any(Number),
//       currentPage: expect.any(Number),
//       accounts: expect.any(Array),
//     });
//   });
// });
