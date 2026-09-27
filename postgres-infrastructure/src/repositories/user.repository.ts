import { prisma } from "../lib/prisma";
import { BaseRepository } from "./base.repository";

export class UserRepository implements BaseRepository<any> {
  async findById(id: string) { return prisma.user.findUnique({ where: { id } }); }
  async findByEmail(email: string) { return prisma.user.findUnique({ where: { email } }); }
  async create(data: any) { return prisma.user.create({ data }); }
  async update(id: string, data: any) { return prisma.user.update({ where: { id }, data }); }
  async delete(id: string) { await prisma.user.delete({ where: { id } }); return true; }
}