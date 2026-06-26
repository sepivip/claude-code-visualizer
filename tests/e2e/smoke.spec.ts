import { test, expect } from '@playwright/test';

test.describe('Claude Code Interactive Trainer smoke', () => {
  test('loads, switches surfaces, and runs a command', async ({ page }) => {
    // Home — base path is applied by baseURL in playwright.config.ts.
    // TitleBar renders <header><h1>✻ Claude Code — Interactive Trainer</h1></header>.
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Claude Code/i }),
    ).toBeVisible();

    // Cheatsheet tab → searchbox 'clear' → expect at least one result card.
    // SearchBox is <input type="search" aria-label="Search features">; results
    // live in data-testid="results-grid" with cards data-testid="item-card".
    await page.getByRole('tab', { name: /Cheatsheet/i }).click();
    const search = page.getByRole('searchbox');
    await search.fill('clear');
    await expect(
      page.getByTestId('results-grid').getByTestId('item-card').first(),
    ).toBeVisible();

    // Keyboard tab → expect the interactive keyboard (root data-testid="keyboard").
    await page.getByRole('tab', { name: /Keyboard/i }).click();
    await expect(page.getByTestId('keyboard')).toBeVisible();

    // Playground via the prompt: the input has data-testid="prompt-input"
    // and aria-label="Prompt". Type '/playground' + Enter to navigate; the
    // Playground surface shows WelcomeBox (data-testid="welcome") persistently.
    await page.getByRole('tab', { name: /Playground/i }).click();
    const prompt = page.getByTestId('prompt-input');
    await prompt.click();
    await prompt.fill('/playground');
    await prompt.press('Enter');
    await expect(page.getByTestId('welcome')).toContainText(
      /Welcome to the Claude Code Trainer/i,
    );
  });
});
