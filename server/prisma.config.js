import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Seit Prisma 7 steht die Datenbank-URL fuer die CLI (migrate, generate)
// hier statt in schema.prisma. process.env statt env() von Prisma, damit
// 'prisma generate' im Docker-Build (npm ci -> postinstall) auch ohne
// DATABASE_URL laeuft - dort wird keine Verbindung gebraucht.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
