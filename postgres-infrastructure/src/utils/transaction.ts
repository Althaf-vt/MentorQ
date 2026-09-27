import { prisma } from "../lib/prisma";

export const withTransaction = async (callback: (tx: any) => Promise<any>) => {
  return prisma.$transaction(callback);
};