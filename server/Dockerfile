FROM node:25-slim AS build
WORKDIR /app

# Ohne OpenSSL erkennt Prismas Postinstall-Skript (laeuft hier via 'npm ci')
# die Ziel-Runtime falsch und laedt die passende Query-Engine fuer's
# spaetere Laufzeit-Image nicht.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY server/package.json server/package-lock.json ./
COPY server/prisma ./prisma
RUN npm ci

COPY server .

FROM build AS prune
WORKDIR /app
RUN npm prune --omit=dev

FROM node:25-slim
WORKDIR /app

# Prisma's Query-Engine-Binary braucht libssl zur Laufzeit; node:24-slim
# (Debian) hat das nicht vorinstalliert.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 'prisma migrate deploy' laeuft beim Containerstart, bevor der Server
# startet - dafuer braucht es zur Laufzeit die Prisma-CLI (deshalb steht
# 'prisma' in den dependencies statt devDependencies) sowie Schema und
# Migrationsdateien.
# *.js statt einzelner Dateinamen - sonst fehlt bei jedem neuen
# Root-Modul (wie zuletzt recommendations.js und groq.js) automatisch
# eine Zeile hier, und der Container crasht erst beim Start in Produktion.
# .dockerignore haelt *.test.js aus dem Image raus.
COPY --from=prune /app/node_modules ./node_modules
COPY --from=prune /app/prisma ./prisma
COPY --from=prune /app/package.json ./package.json
COPY --from=prune /app/*.js ./
# Gemeinsame Cocktail-Karte (auch vom Frontend genutzt). menu.js liest sie
# ueber ../shared, von /app aus ist das /shared.
COPY shared/cocktails.json /shared/cocktails.json

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
