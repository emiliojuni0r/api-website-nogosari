// Ganti impor default lama ke named export {}
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;