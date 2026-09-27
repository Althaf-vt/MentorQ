import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding Postgres database...");
}
main().catch(console.error).finally(() => prisma.$disconnect());