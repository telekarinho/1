/* Playwright config — smoke tests prod milkypot.com
 * Roda em PRs via CI (.github/workflows/e2e-smoke.yml).
 * Pra rodar local: npx playwright test --config tests/e2e/playwright.config.js
 */
module.exports = {
    testDir: '.',
    timeout: 30000,
    expect: { timeout: 5000 },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: process.env.E2E_BASE_URL || 'https://milkypot.com',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        viewport: { width: 1280, height: 800 },
        actionTimeout: 10000
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' }
        }
    ]
};
