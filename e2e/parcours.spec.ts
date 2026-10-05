import { expect, test, type Page } from '@playwright/test'

// Date figée : lundi 5 octobre 2026 → séance du jour = Haut A (semaine type).
const MONDAY = new Date('2026-10-05T08:00:00+02:00')

async function open(page: Page, hash = '') {
  await page.clock.setFixedTime(MONDAY)
  await page.goto(`./${hash ? `#${hash}` : ''}`)
}

const heading = (page: Page) => page.locator('main h1')

test('accueil : séance du jour en avant, 4 entrées de navigation', async ({ page }) => {
  await open(page)
  await expect(heading(page)).toHaveText('Haut A')
  await expect(page.getByRole('link', { name: 'Démarrer' })).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'Navigation principale' })
  await expect(nav.getByRole('link')).toHaveText(['Aujourd’hui', 'Séances', 'Suivi', 'Plus'])
})

test('séance : machine occupée, enchaînement, faire plus tard, enregistrement', async ({ page }) => {
  await open(page, '/seance/haut-a/go')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await expect(heading(page)).toHaveText('Développé couché haltères ou Smith')

  // Machine occupée → alternative
  await page.getByRole('button', { name: 'Machine occupée ?' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /Chest press machine/ }).click()
  await expect(heading(page)).toHaveText('Chest press machine')
  await expect(page.getByText('au lieu de Développé couché haltères ou Smith')).toBeVisible()

  // 4 séries validées → passage automatique à l'exercice suivant
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Valider la série' }).click()
  }
  await expect(heading(page)).toHaveText('Tirage vertical (lat pulldown)')

  // Faire plus tard → l'exercice suivant prend sa place
  await page.getByRole('button', { name: 'Machine occupée ?' }).click()
  await page.getByRole('dialog').getByRole('button', { name: /Faire plus tard/ }).click()
  await expect(heading(page)).toHaveText('Développé incliné machine ou Smith')

  // Aller au bilan et enregistrer
  for (let i = 0; i < 10 && (await heading(page).textContent()) !== 'Bilan'; i++) {
    await page.locator('.workout-bar .btn.primary').click()
  }
  await expect(heading(page)).toHaveText('Bilan')
  await page.getByRole('button', { name: 'Enregistrer la séance' }).click()
  await expect(heading(page)).toHaveText('Séance enregistrée 💪')

  // Le carnet note l'alternative réellement faite
  await page.goto('./#/suivi')
  await page.getByRole('tab', { name: 'Carnet' }).click()
  await page.getByText('Haut A').first().click()
  await expect(page.getByText('au lieu de Développé couché haltères ou Smith')).toBeVisible()
})

test('le geste s’ouvre par-dessus la séance et se ferme', async ({ page }) => {
  await open(page, '/seance/bas-a/go')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await page.getByRole('button', { name: /Voir le geste/ }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Squat Smith ou squat machine' })).toBeVisible()
  await expect(dialog.locator('img').first()).toHaveJSProperty('complete', true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(heading(page)).toHaveText('Squat Smith ou squat machine')
})

test('pesée du matin : enregistrée depuis l’accueil, visible dans le suivi', async ({ page }) => {
  await open(page)
  await page.getByLabel('Poids ce matin (kg)').fill('108.4')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText('108,4', { exact: true })).toBeVisible()
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Suivi' }).click()
  await expect(page.locator('.key .value')).toContainText('108,4')
})

test('illustrations servies sous le sous-chemin GitHub Pages', async ({ page }) => {
  await open(page, '/exercices/hack-squat')
  const img = page.locator('figure img').first()
  await expect(img).toHaveAttribute('src', /\/sport\/exercises\/Hack_Squat\/0\.webp$/)
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)
})

test('rappel de sauvegarde : « Plus tard » le masque', async ({ page }) => {
  await open(page)
  // 3 jours de suivi suffisent pour qu'il y ait quelque chose à perdre.
  await page.evaluate(() => {
    const dailies = { '2026-10-01': { weight: 109 }, '2026-10-02': { weight: 108.8 }, '2026-10-03': { weight: 108.6 } }
    localStorage.setItem('ari:v1:tracking', JSON.stringify({ dailies, waists: [], measurements: [], cardio: [] }))
  })
  await page.reload()
  await expect(page.getByText('fais une première sauvegarde')).toBeVisible()
  await page.getByRole('button', { name: 'Plus tard' }).click()
  await expect(page.getByText('fais une première sauvegarde')).toBeHidden()
})

test('parties du corps : résumé de la séance, étiquettes par exercice et en mode séance', async ({ page }) => {
  await open(page, '/seances/bas-a')
  const parts = page.getByRole('region', { name: 'Parties du corps travaillées' })
  await expect(parts.getByText('Quadriceps')).toBeVisible()
  await expect(parts.getByRole('img', { name: /Schéma du corps\. Travaille : .*Quadriceps/ })).toBeVisible()
  await expect(page.locator('.items .parts').first()).toBeVisible()

  await open(page, '/seance/haut-a/go')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await expect(page.locator('.wex .parts').first()).toContainText('Pectoraux')
})
