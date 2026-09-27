import { prisma } from "../src/lib/prisma";
async function clean() {
  await prisma.$executeRawUnsafe("TRUNCATE TABLE \"User\" CASCADE;");
}
clean();
