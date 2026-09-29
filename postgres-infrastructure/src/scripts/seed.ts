import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial administrator account...");
  // TODO: implement seed logic
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
