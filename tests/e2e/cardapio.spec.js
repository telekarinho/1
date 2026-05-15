// cardapio.spec.js — testa flow de cardápio público
const { test, expect } = require('@playwright/test');

test.describe('Cardápio público', () => {
    test('carrega Firebase + sincroniza catalog_config em aba anônima', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.goto('/cardapio.html');
        // Aguarda DataStore sincronizar (até 8s)
        await page.waitForFunction(() => {
            const cfg = (typeof DataStore !== 'undefined') ? DataStore.get('catalog_config') : null;
            return cfg && cfg.sabores && Object.keys(cfg.sabores).length >= 5;
        }, { timeout: 10000 });

        const tabs = await page.locator('.cat-tab').count();
        expect(tabs).toBeGreaterThanOrEqual(5); // 🎨 Monte | 🍨 MilkyPot | + outras

        const sabKeys = await page.evaluate(() => Object.keys(DataStore.get('catalog_config').sabores || {}));
        expect(sabKeys).toContain('monte_seu');
        expect(sabKeys).toContain('milkshake_top');

        const refErrors = errors.filter(e => /is not defined|ReferenceError/.test(e));
        expect(refErrors).toEqual([]);
    });

    test('default tab é Monte do Seu quando disponível', async ({ page }) => {
        await page.goto('/cardapio.html');
        await page.waitForFunction(() => {
            const t = document.querySelector('.cat-tab.active');
            return t && t.dataset.category;
        }, { timeout: 10000 });
        const activeKey = await page.evaluate(() => {
            return document.querySelector('.cat-tab.active')?.dataset.category;
        });
        expect(activeKey).toBe('monteseu');
    });

    test('click em produto Monte do Seu abre wizard de 5 passos', async ({ page }) => {
        await page.goto('/cardapio.html');
        await page.waitForSelector('.product-card-mobile', { timeout: 10000 });
        // Garante aba Monte do Seu
        await page.evaluate(() => {
            const t = document.querySelector('.cat-tab[data-category="monteseu"]');
            if (t) t.click();
        });
        await page.waitForTimeout(300);

        await page.locator('.product-card-mobile').first().click();
        // Wizard MS deve abrir
        await page.waitForSelector('.ms-header-title', { timeout: 5000 });
        const stepsCount = await page.locator('.ms-step').count();
        expect(stepsCount).toBe(5);

        const sheetOpen = await page.evaluate(() => {
            return document.getElementById('productSheet').classList.contains('sheet-open');
        });
        expect(sheetOpen).toBe(true);
    });

    test('click em milkshake (não monte do seu) abre sheet normal', async ({ page }) => {
        await page.goto('/cardapio.html');
        await page.waitForSelector('.cat-tab[data-category="ninho"]', { timeout: 10000 });
        await page.locator('.cat-tab[data-category="ninho"]').click();
        await page.waitForTimeout(400);
        await page.locator('.product-card-mobile').first().click();

        // Sheet deve abrir com display:block + .sheet-open
        await page.waitForFunction(() => {
            const s = document.getElementById('productSheet');
            return s && s.classList.contains('sheet-open') && s.style.display !== 'none';
        }, { timeout: 5000 });
    });
});
