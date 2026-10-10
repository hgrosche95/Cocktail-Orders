import { test, expect } from '@playwright/test'
import { BARKEEPER_PASSWORD } from '../playwright.config'

// Der ganze Ablauf ueber zwei Browser hinweg: Gast bestellt, die Theke sieht
// die Bestellung live und markiert sie als erledigt, der Gast bekommt ueber
// den WebSocket die Fertig-Meldung und kann bewerten.
//
// Die Datenbank wird nicht geleert (sie kann von den Server-Tests geteilt
// sein); ein eindeutiger Gastname haelt die Laeufe auseinander.
test('guest order reaches the bar live and the guest is notified when it is done', async ({
  browser,
}) => {
  const guestName = `E2E-${Date.now()}`

  const guest = await (await browser.newContext()).newPage()
  const bar = await (await browser.newContext()).newPage()

  // Theke zuerst oeffnen: die Bestellung muss dort live auftauchen, ohne
  // Neuladen.
  await bar.goto('/barkeeper')
  await bar.getByLabel('Barkeeper-Passwort:').fill(BARKEEPER_PASSWORD)
  await bar.getByRole('button', { name: 'Anmelden' }).click()
  await expect(bar.getByRole('heading', { name: /Theke/ })).toBeVisible()

  // Gast meldet sich an und bestellt einen Cable Car mit Anmerkung.
  await guest.goto('/')
  await guest.getByLabel('Wer kommt hoch?').fill(guestName)
  await guest.getByRole('button', { name: /Hochfahren/ }).click()
  await guest.getByRole('button', { name: 'Cable Car bestellen' }).click()
  await guest.getByLabel('Anmerkung an die Theke (optional)').fill('ohne Zimt')
  await guest.getByRole('button', { name: 'Bestellung abschicken' }).click()
  await expect(guest.getByText(/Du bist dran|vor dir/)).toBeVisible()

  // Theke sieht die Bestellung live und erledigt sie.
  const barOrder = bar.locator('.barkeeper-order', { hasText: guestName })
  await expect(barOrder).toBeVisible()
  await expect(barOrder).toContainText('Cable Car')
  await expect(barOrder).toContainText('ohne Zimt')
  await barOrder.getByRole('button', { name: 'Erledigt' }).click()
  await expect(barOrder).toHaveCount(0)

  // Gast bekommt die Fertig-Meldung und den Bewertungs-Prompt.
  await expect(guest.getByText('Deine Bestellung ist fertig!')).toBeVisible()
  const ratingPrompt = guest.locator('.rating-prompt')
  await expect(ratingPrompt).toContainText('Cable Car')
  await ratingPrompt.getByRole('button', { name: '5 von 5 Sternen' }).click()
  await expect(ratingPrompt).toHaveCount(0)
})

test('an ingredient marked as empty hides its cocktails for guests live', async ({ browser }) => {
  const guest = await (await browser.newContext()).newPage()
  const bar = await (await browser.newContext()).newPage()

  await bar.goto('/barkeeper')
  await bar.getByLabel('Barkeeper-Passwort:').fill(BARKEEPER_PASSWORD)
  await bar.getByRole('button', { name: 'Anmelden' }).click()

  await guest.goto('/')
  await guest.getByLabel('Wer kommt hoch?').fill(`E2E-${Date.now()}`)
  await guest.getByRole('button', { name: /Hochfahren/ }).click()
  const cableCar = guest.getByRole('button', { name: 'Cable Car bestellen' })
  await expect(cableCar).toBeVisible()

  // Zimt steckt (Stand der Karte) nur im Cable Car.
  const cinnamon = bar.getByRole('button', { name: /^Zimt/ })
  await cinnamon.click()
  await expect(cinnamon).toHaveAttribute('aria-pressed', 'true')
  try {
    await expect(cableCar).toHaveCount(0)
  } finally {
    // Bestand wiederherstellen, die Datenbank wird nicht geleert.
    await cinnamon.click()
    await expect(cinnamon).toHaveAttribute('aria-pressed', 'false')
  }
  await expect(cableCar).toBeVisible()
})

test('a guest can cancel their open order, the bar sees it disappear live', async ({ browser }) => {
  const guestName = `E2E-${Date.now()}`
  const guest = await (await browser.newContext()).newPage()
  const bar = await (await browser.newContext()).newPage()

  await bar.goto('/barkeeper')
  await bar.getByLabel('Barkeeper-Passwort:').fill(BARKEEPER_PASSWORD)
  await bar.getByRole('button', { name: 'Anmelden' }).click()

  await guest.goto('/')
  await guest.getByLabel('Wer kommt hoch?').fill(guestName)
  await guest.getByRole('button', { name: /Hochfahren/ }).click()
  await guest.getByRole('button', { name: 'Cable Car bestellen' }).click()
  await guest.getByRole('button', { name: 'Bestellung abschicken' }).click()

  const barOrder = bar.locator('.barkeeper-order', { hasText: guestName })
  await expect(barOrder).toBeVisible()

  await guest.getByRole('button', { name: 'Stornieren' }).click()
  await guest.getByRole('button', { name: 'Ja, stornieren' }).click()

  await expect(guest.locator('.waiting-panel')).toHaveCount(0)
  await expect(barOrder).toHaveCount(0)
  // Ein Storno ist keine fertige Bestellung.
  await expect(guest.getByText('Deine Bestellung ist fertig!')).toHaveCount(0)
  await expect(guest.locator('.rating-prompt')).toHaveCount(0)

  // Danach kann der Gast neu bestellen.
  await guest.getByRole('button', { name: 'Cable Car bestellen' }).click()
  await expect(guest.getByRole('button', { name: 'Bestellung abschicken' })).toBeEnabled()
})

test('the bar statistics count a served drink live', async ({ browser }) => {
  const guestName = `E2E-${Date.now()}`
  const guest = await (await browser.newContext()).newPage()
  const bar = await (await browser.newContext()).newPage()
  const stats = await (await browser.newContext()).newPage()

  for (const page of [bar, stats]) {
    await page.goto('/barkeeper')
    await page.getByLabel('Barkeeper-Passwort:').fill(BARKEEPER_PASSWORD)
    await page.getByRole('button', { name: 'Anmelden' }).click()
  }
  await stats.getByRole('link', { name: 'Statistik' }).click()
  // Barkeeper-Ansicht: normaler Header, nicht die Ankunft fuer Gaeste.
  await expect(stats.getByText('Über den Dächern')).toHaveCount(0)
  const served = stats.locator('.stats-tile', { hasText: 'Serviert' }).locator('dd')
  await expect(served).toHaveText(/^\d+$/)
  const before = Number(await served.textContent())

  await guest.goto('/')
  await guest.getByLabel('Wer kommt hoch?').fill(guestName)
  await guest.getByRole('button', { name: /Hochfahren/ }).click()
  await guest.getByRole('button', { name: 'Cable Car bestellen' }).click()
  await guest.getByRole('button', { name: 'Bestellung abschicken' }).click()

  const barOrder = bar.locator('.barkeeper-order', { hasText: guestName })
  await barOrder.getByRole('button', { name: 'Erledigt' }).click()

  await expect(served).toHaveText(String(before + 1))
  await expect(stats.getByRole('heading', { name: 'Meistbestellt' })).toBeVisible()
  await expect(stats.locator('.stats-bar-label', { hasText: 'Cable Car' }).first()).toBeVisible()
})

test('the bar adds a drink, guests see it live and can order it, then it is removed', async ({
  browser,
}) => {
  const drinkName = `E2E Tiki ${Date.now()}`
  const guestName = `E2E-${Date.now()}`
  const guest = await (await browser.newContext()).newPage()
  const bar = await (await browser.newContext()).newPage()

  await guest.goto('/')
  await guest.getByLabel('Wer kommt hoch?').fill(guestName)
  await guest.getByRole('button', { name: /Hochfahren/ }).click()
  const guestDrink = guest.getByRole('button', { name: `${drinkName} bestellen` })
  await expect(guest.getByRole('button', { name: 'Cable Car bestellen' })).toBeVisible()
  await expect(guestDrink).toHaveCount(0)

  await bar.goto('/barkeeper')
  await bar.getByLabel('Barkeeper-Passwort:').fill(BARKEEPER_PASSWORD)
  await bar.getByRole('button', { name: 'Anmelden' }).click()
  await bar.getByRole('link', { name: 'Karte' }).click()
  await bar.getByLabel('Name', { exact: true }).fill(drinkName)
  await bar.getByLabel('Kategorie').selectOption('Süß & Fruchtig')
  await bar.getByLabel('Zutat 1', { exact: true }).fill('Rum')
  await bar.getByLabel('Menge in cl für Zutat 1').fill('5')
  await bar.getByRole('button', { name: '+ Zutat' }).click()
  await bar.getByLabel('Zutat 2', { exact: true }).fill('Ananassaft')
  await bar.getByRole('button', { name: 'Auf die Karte setzen' }).click()
  await expect(bar.getByRole('status')).toContainText(drinkName)

  try {
    // Gast sieht den neuen Drink ohne Neuladen und kann ihn bestellen.
    await guestDrink.click()
    await guest.getByRole('button', { name: 'Bestellung abschicken' }).click()
    await bar.getByRole('link', { name: '← Theke' }).click()
    const barOrder = bar.locator('.barkeeper-order', { hasText: guestName })
    await expect(barOrder).toContainText(drinkName)
    await expect(barOrder).toContainText('Ananassaft')
    await barOrder.getByRole('button', { name: 'Erledigt' }).click()
    await expect(guest.getByText('Deine Bestellung ist fertig!')).toBeVisible()
  } finally {
    // Drink wieder entfernen, die Datenbank wird nicht geleert.
    await bar.goto('/barkeeper/karte')
    await bar.getByRole('button', { name: `${drinkName} entfernen` }).click()
    await bar.getByRole('button', { name: 'Ja, entfernen' }).click()
  }

  await expect(guestDrink).toHaveCount(0)
})
