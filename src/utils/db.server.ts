import { PrismaClient } from "@prisma/client";

let db: PrismaClient;

declare global {
    var __db: PrismaClient | undefined;
}

async function createSuperAdmin(email: any) {
    try {
        const existingAdmin = await global.__db?.user.findFirst({
            where: { email: email },
        });
        if (!existingAdmin) {
            const superAdmin = await global.__db?.user.create({
                data: {
                    name: "admin",
                    email: "superadmin@gmail.com",
                    password: "azertyuiop",
                },
            });

            console.log("Super admin créé avec succès: ", superAdmin);
        }
    } catch (error) {
        console.error("Erreur lors de la création du super admin : ", error);
    }
}

if (!global.__db) {
    global.__db = new PrismaClient();
    // createSuperAdmin('superadmin@gmail.com');
}

db = global.__db;

export { db, createSuperAdmin };
