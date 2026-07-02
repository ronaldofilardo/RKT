import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context';

test.describe('Fluxo de Retomada: Dashboard -> Modal -> Scoring', () => {
  let ctx: TestContext;

  test.beforeAll(async () => {
    ctx = await TestContext.create();
  });

  test('deve abrir modal de retomada e navegar para scoring após confirmação', async () => {
    const { page } = ctx.browser;

    // 1. Login e Navegação para o Dashboard
    await page.goto('/dashboard');
    
    // 2. Localizar partida na seção "Anotações Suspensas"
    // Busca pelo texto do cabeçalho da seção e depois o card de partida
    const suspendedSection = page.locator('text=🔴 Anotações Suspensas');
    await expect(suspendedSection).toBeVisible();
    
    const suspendedCard = page.locator('text=🔴 Anotações Suspensas').locator('..').locator('.cursor-pointer').first();
    await suspendedCard.click();

    // 3. Validar abertura do ResumeScoreModal
    const modalTitle = page.locator('text=Retomar Partida em Andamento');
    await expect(modalTitle).toBeVisible();

    // 4. Preencher placar no modal para teste de retomada
    // Set 1: 6-4 (concluído)
    await page.locator('input[type="number"]').nth(0).fill('6'); // Player 1 games
    await page.locator('input[type="number"]').nth(1).fill('4'); // Player 2 games
    await page.locator('button:has-text("+ Adicionar Set Concluído")').click();
    
    // Set 2: 2-1 (em andamento)
    await page.locator('input[type="number"]').nth(0).fill('2');
    await page.locator('input[type="number"]').nth(1).fill('1');
    
    // Pontos: 15-30
    await page.locator('input[placeholder="0, 15, 30, 40, A"]').nth(0).fill('15');
    await page.locator('input[placeholder="0, 15, 30, 40, A"]').nth(1).fill('30');
    
    await page.locator('button:has-text("Confirmar e Iniciar")').click();

    // 5. Validar navegação para a página de scoring
    await expect(page).toHaveURL(/.*\/scoring/);
    
    // 6. Validar se o placar inserido está refletido na tela
    // Verifica se o placar de sets (1-0) e games (2-1) aparece na UI
    await expect(page.locator('text=1-0')).toBeVisible(); 
    await expect(page.locator('text=2-1')).toBeVisible();
  });
});
