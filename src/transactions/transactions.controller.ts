import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createTransaction = async (req: any, res: any) => {
  try {
    const { amount, counterPartyId, transactionType, accountIbanEmitter } =
      req.body;

    // Valider le type de transaction
    if (!["credit", "deposit", "card", "debit"].includes(transactionType)) {
      return res.status(400).json({ error: "Type de transaction invalide" });
    }

    // Traiter la transaction en fonction du type
    let transactionData: {
      amount: any;
      counterPartyId: any;
      transactionType: any;
      accountIbanEmitter?: any;
    };
    switch (transactionType) {
      case "credit":
        transactionData = { amount, counterPartyId, transactionType };
        // Logique spécifique pour les transactions de crédit
        break;
      case "deposit":
        transactionData = { amount, counterPartyId, transactionType };
        // Logique spécifique pour les transactions de dépôt
        break;
      case "card":
        transactionData = { amount, counterPartyId, transactionType };
        // Logique spécifique pour les transactions de carte
        break;
      case "debit":
        transactionData = {
          amount,
          counterPartyId,
          transactionType,
          accountIbanEmitter,
        };
        // Logique spécifique pour les transactions de débit
        break;
      default:
        return res.status(400).json({ error: "Type de transaction invalide" });
    }

    // Créer la transaction dans la base de données
    const createdTransaction = await prisma.transaction.create({
      data: transactionData,
    });

    // Mettre à jour le compte concerné en fonction du type de transaction
    switch (transactionType) {
      case "credit":
        // Logique de mise à jour du compte pour les transactions de crédit
        break;
      case "deposit":
        await prisma.account.update({
          where: { iban: accountIbanEmitter },
          data: { balance: { increment: amount } },
        });
        // Logique de mise à jour du compte pour les transactions de dépôt
        break;
      case "card":
        // Logique de mise à jour du compte pour les transactions de carte
        break;
      case "debit":
        // Logique de mise à jour du compte pour les transactions de débit
        await prisma.account.update({
          where: { iban: accountIbanEmitter },
          data: { balance: { decrement: amount } },
        });
        break;
      default:
        return res.status(400).json({ error: "Type de transaction invalide" });
    }

    res.status(200).json(createdTransaction);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la transaction" });
  }
};
