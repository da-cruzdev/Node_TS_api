/*
  Warnings:

  - You are about to drop the column `email` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `Account` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "transactionType" TEXT NOT NULL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in process',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountIbanEmitter" TEXT,
    "accountIbanReceiver" TEXT,
    CONSTRAINT "Transaction_accountIbanReceiver_fkey" FOREIGN KEY ("accountIbanReceiver") REFERENCES "Account" ("iban") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_accountIbanEmitter_fkey" FOREIGN KEY ("accountIbanEmitter") REFERENCES "Account" ("iban") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountIbanEmitter", "accountIbanReceiver", "amount", "createdAt", "currency", "id", "transactionType", "updatedAt") SELECT "accountIbanEmitter", "accountIbanReceiver", "amount", "createdAt", "currency", "id", "transactionType", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE TABLE "new_Account" (
    "iban" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "balance" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "bic" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentId" TEXT,
    "userId" INTEGER,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("accountType", "balance", "bic", "createdAt", "currency", "iban", "name", "parentId", "updatedAt") SELECT "accountType", "balance", "bic", "createdAt", "currency", "iban", "name", "parentId", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_iban_key" ON "Account"("iban");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
