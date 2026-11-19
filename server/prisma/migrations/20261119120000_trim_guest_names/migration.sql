-- Schritt 3 der Gastnamen-Trim-Aktion: bestehende Zeilen mit fuehrenden oder
-- abschliessenden Leerzeichen bereinigen. Handy-Tastaturen haengen nach einem
-- Wortvorschlag automatisch ein Leerzeichen an, der Client gab den Namen
-- ungetrimmt weiter, der Server speicherte getrimmt - der exakte Vergleich in
-- App.tsx trennte dann den Gast von seiner Bestellung (keine Warteansicht,
-- kein "fertig", keine Historie). Schritt 1 und 2 trimmen jetzt schon jeden
-- Eingang, dieser Schritt raumt die Altbestaende in beiden Tabellen auf.

-- Idempotent: jeder Lauf trimmt nur Zeilen, deren Name sich vom getrimmten
-- unterscheidet ("guestName" <> TRIM(...)) - ein zweiter Lauf findet keine.

-- 1) ratings: ungetrimmte Zeilen loeschen, die nach dem Trimmen mit einer
--    vorhandenen getrimmten Zeile (gleicher Gastname + gleicher Cocktail)
--    kollidieren wuerden - die @@unique([guestName, cocktailId]) aus
--    schema.prisma wirft sonst beim UPDATE. Die getrimmte Zeile bleibt, die
--    ungetrimmte faellt. Haben mehrere ungetrimmte Varianten KEINEN
--    getrimmten Partner, bleibt die mit der kleinsten id, die uebrigen
--    fallen (TRIM(r2.guestName) = TRIM(r.guestName) und r2.id < r.id).
DELETE FROM "ratings"
WHERE "guestName" <> TRIM("guestName")
  AND EXISTS (
    SELECT 1 FROM "ratings" AS other
    WHERE other."cocktailId" = "ratings"."cocktailId"
      AND TRIM(other."guestName") = TRIM("ratings"."guestName")
      AND other."id" <> "ratings"."id"
      AND (
        other."guestName" = TRIM("ratings"."guestName")
        OR other."id" < "ratings"."id"
      )
  );

-- 2) ratings: Gastnamen vorne und hinten trimmen, wo er sich vom getrimmten
--    unterscheidet. Innere Leerzeichen bleiben, TRIM ohne Argument trimmt
--    beide Seiten. Nach Schritt 1 kann hier keine @@unique mehr verletzen.
UPDATE "ratings"
SET "guestName" = TRIM("guestName")
WHERE "guestName" <> TRIM("guestName");

-- 3a) orders: abgeschlossene Bestellungen direkt trimmen. Fuer erledigte
--     Zeilen gibt es keine Unique-Regel (der Teil-Index covered nur offene),
--     eine Kollision ist also ungefaehrlich.
UPDATE "orders"
SET "name" = TRIM("name")
WHERE "completedAt" IS NOT NULL
  AND "name" <> TRIM("name");

-- 3b) orders: offene Bestellungen nur umbenennen, wenn keine andere offene
--     Bestellung denselben getrimmten Namen haette - sonst waere der
--     Teil-Index "orders_one_open_per_guest" ("name" WHERE
--     "completedAt" IS NULL, Migration 20261010120000_one_open_order_per_guest)
--     verletzt. Die Bedingung fuer "offen" ist woertlich die des Teil-Index.
--     In diesem Fall bleibt die Zeile unveraendert, es wird nichts geloescht.
UPDATE "orders" AS o
SET "name" = TRIM(o."name")
WHERE o."completedAt" IS NULL
  AND o."name" <> TRIM(o."name")
  AND NOT EXISTS (
    SELECT 1 FROM "orders" AS other
    WHERE other."completedAt" IS NULL
      AND other."orderId" <> o."orderId"
      AND TRIM(other."name") = TRIM(o."name")
  );
