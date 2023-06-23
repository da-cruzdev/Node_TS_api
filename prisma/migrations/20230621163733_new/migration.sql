/*
  Warnings:

  - You are about to drop the column `currency` on the `Transaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "transactionType" TEXT NOT NULL,
    "reason" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'in process',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountIbanEmitter" TEXT,
    "accountIbanReceiver" TEXT,
    CONSTRAINT "Transaction_accountIbanReceiver_fkey" FOREIGN KEY ("accountIbanReceiver") REFERENCES "Account" ("iban") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_accountIbanEmitter_fkey" FOREIGN KEY ("accountIbanEmitter") REFERENCES "Account" ("iban") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountIbanEmitter", "accountIbanReceiver", "amount", "createdAt", "id", "status", "transactionType", "updatedAt") SELECT "accountIbanEmitter", "accountIbanReceiver", "amount", "createdAt", "id", "status", "transactionType", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
