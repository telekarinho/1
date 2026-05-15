// raspinha.spec.js — testa o flow crítico de raspinha em prod
// Usa payload base64 de teste com expiresAt longe no futuro
const { test, expect } = require('@playwright/test');

// Payload de raspinha teste (mesma estrutura do user real)
const TEST_PAYLOAD = 'eyJjb2RlIjoiTUtQLU1VRkYtMjAyNjA1MTQtVERLRFo0OVMiLCJzaG9ydENvZGUiOiJRU0EtRDlZIiwiZnJhbmNoaXNlSWQiOiJtdWZmYXRvLXF1aW50aW5vIiwic3RvcmVOYW1lIjoiTWlsa3lQb3QgTXVmZmF0byBRdWludGlubyIsInByaXplQ29kZSI6IlJTUF9QSUNPTEVfMTUiLCJwcml6ZU5hbWUiOiJQaWNvbMOpIGVtIERvYnJvIiwicHJpemVEZXNjIjoiTmEgY29tcHJhIGRlIDEgcGljb2zDqSBlIHBlZGlkbyBtw61uaW1vIGRlIFIkMTUsIGxldmEgMiBwaWNvbMOpcy4iLCJwcml6ZVRpZXIiOiJzbWFsbCIsInByaXplU2NvcGUiOiJzYW1lIiwibWluT3JkZXIiOjE1LCJleHBpcmVzQXQiOiIyMDI2LTA1LTIyVDAwOjQyOjM2LjAwNVoifQ';

test.describe('Raspinha', () => {
    test('canvas inicializa com dimensões corretas (não fica 300x150 default)', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));
        page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

        await page.goto(`/raspinha.html?c=QSA-D9Y&d=${TEST_PAYLOAD}`);

        // Aguarda DataStore + showScratchStage
        await page.waitForFunction(() => {
            const c = document.getElementById('scratchCanvas');
            return c && c.width > 300; // > 300x150 default
        }, { timeout: 10000 });

        const canvasInfo = await page.evaluate(() => {
            const c = document.getElementById('scratchCanvas');
            return { width: c.width, height: c.height };
        });

        expect(canvasInfo.width).toBeGreaterThan(500);
        expect(canvasInfo.height).toBeGreaterThan(300);

        // Não pode ter ReferenceError silencioso
        const refErrors = errors.filter(e => /is not defined|ReferenceError/.test(e));
        expect(refErrors).toEqual([]);
    });

    test('prize info renderiza (nome + descrição + código)', async ({ page }) => {
        await page.goto(`/raspinha.html?c=QSA-D9Y&d=${TEST_PAYLOAD}`);
        await page.waitForSelector('#prizeName', { state: 'visible' });
        const prizeName = await page.locator('#prizeName').textContent();
        const prizeDesc = await page.locator('#prizeDesc').textContent();
        const redeemCode = await page.locator('#redeemShortCode').textContent();
        expect(prizeName.toLowerCase()).toContain('picolé');
        expect(prizeDesc.length).toBeGreaterThan(10);
        expect(redeemCode).toBe('QSA-D9Y');
    });

    test('drag raspa pixels do canvas', async ({ page }) => {
        await page.goto(`/raspinha.html?c=QSA-D9Y&d=${TEST_PAYLOAD}`);
        await page.waitForFunction(() => {
            const c = document.getElementById('scratchCanvas');
            return c && c.width > 300;
        }, { timeout: 10000 });

        const canvas = page.locator('#scratchCanvas');
        await canvas.scrollIntoViewIfNeeded();
        const box = await canvas.boundingBox();
        // Drag em zigzag
        await page.mouse.move(box.x + 30, box.y + 30);
        await page.mouse.down();
        for (let i = 30; i < box.width - 30; i += 20) {
            await page.mouse.move(box.x + i, box.y + 40 + Math.sin(i / 20) * 30);
        }
        await page.mouse.up();

        const transparentPixels = await page.evaluate(() => {
            const c = document.getElementById('scratchCanvas');
            const ctx = c.getContext('2d');
            const data = ctx.getImageData(0, 0, c.width, c.height).data;
            let count = 0;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 50) count++;
            }
            return count;
        });
        expect(transparentPixels).toBeGreaterThan(100);
    });
});
