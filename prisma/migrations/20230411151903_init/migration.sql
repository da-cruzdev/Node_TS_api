-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IBAN" TEXT NOT NULL,
    "balance" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "bic" TEXT NOT NULL,
    "lastBankSynchronization" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "valueDate" DATETIME NOT NULL,
    "creationDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_IBAN_key" ON "Account"("IBAN");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
