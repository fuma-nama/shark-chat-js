import { PrismaClient } from "@prisma/client";
let prisma: PrismaClient;

declare global {
    var dev_prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "development") {
    if (global.dev_prisma == null) {
        global.dev_prisma = new PrismaClient();
    }

    prisma = global.dev_prisma;
} else {
    prisma = new PrismaClient();
}

export default prisma;
