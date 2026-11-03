import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Prisma 7 verbindet sich ueber einen Driver-Adapter (node-postgres) statt
// ueber die eingebaute Query-Engine; die URL kommt deshalb hier rein.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })
