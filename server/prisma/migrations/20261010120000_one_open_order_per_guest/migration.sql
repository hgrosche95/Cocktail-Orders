-- Hoechstens eine offene Bestellung pro Gast, auch bei gleichzeitigen
-- Requests (Doppelklick, zwei Tabs). Die Pruefung in app.js allein
-- (findFirst, dann create) laesst mehrere Requests durch, die gleichzeitig
-- ankommen.
--
-- Partieller Index: Prisma kann ihn im Schema nicht ausdruecken, deshalb
-- nur hier als SQL (siehe Kommentar in schema.prisma).

-- Bereits vorhandene Doppelte aufloesen, sonst schlaegt CREATE UNIQUE
-- INDEX fehl und der Container startet nicht (migrate deploy laeuft beim
-- Start). Pro Gast bleibt die aelteste offene Bestellung offen, die
-- uebrigen gelten als erledigt.
UPDATE "orders" AS o
SET "completedAt" = CURRENT_TIMESTAMP
WHERE o."completedAt" IS NULL
  AND EXISTS (
    SELECT 1 FROM "orders" AS older
    WHERE older."name" = o."name"
      AND older."completedAt" IS NULL
      AND (older."createdAt", older."orderId") < (o."createdAt", o."orderId")
  );

CREATE UNIQUE INDEX "orders_one_open_per_guest" ON "orders"("name") WHERE "completedAt" IS NULL;
