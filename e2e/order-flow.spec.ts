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
