import { test, expect } from '@playwright/test';

const PASSWORD = 'Teste123!';

function generateValidCpf(): string {
  const digits: number[] = [];
  for (let i = 0; i < 9; i++) digits.push(Math.floor(Math.random() * 10));
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let dv = 11 - (sum % 11);
  if (dv >= 10) dv = 0;
  digits.push(dv);
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  dv = 11 - (sum % 11);
  if (dv >= 10) dv = 0;
  digits.push(dv);
  return digits.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function generateValidCnpj(): string {
  const digits: number[] = [];
  for (let i = 0; i < 12; i++) digits.push(Math.floor(Math.random() * 10));
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += digits[i] * w1[i];
  let dv = 11 - (sum % 11);
  if (dv >= 10) dv = 0;
  digits.push(dv);
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += digits[i] * w2[i];
  dv = 11 - (sum % 11);
  if (dv >= 10) dv = 0;
  digits.push(dv);
  return digits.join('').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

test.describe('Onboarding no primeiro login', () => {
  test('cadastro, três etapas do onboarding e chegada ao painel', async ({ page }) => {
    const email = `onboarding.e2e.${Date.now()}@rkt.com`;

    // 1. Cadastro de um atleta novo (sem flag de onboarding no navegador).
    await page.goto('/signup');
    await page.getByLabel('Nome completo').fill('Atleta Onboarding Playwright');
    await page.getByLabel('E-mail ou CPF').fill(email);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByLabel(/Li e aceito os/).check();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await page.waitForURL(/\/login$/, { timeout: 20_000 });

    // 2. Primeiro login: deve cair no onboarding, não direto no painel.
    await page.getByLabel('E-mail ou CPF').fill(email);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await page.waitForURL(/\/onboarding\?next=.*perfil=ATLETA/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'O que é o RKT e a telemetria de tênis' }),
    ).toBeVisible();

    // 3. Percorre as três etapas do perfil Atleta.
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Como ler seus gráficos de momentum e saque' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Crie ou busque sua primeira partida' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Concluir' }).click();

    // 4. Chega ao painel do atleta e grava a flag local.
    await page.waitForURL(/\/atleta$/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'O que é o RKT e a telemetria de tênis' }),
    ).toHaveCount(0);

    const onboardingKeys = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((key) => key.startsWith('rkt_onboarded_')),
    );
    expect(onboardingKeys).toHaveLength(1);

    // 5. A introdução não se repete em uma nova visita direta.
    await page.goto('/onboarding');
    await page.waitForURL(/\/atleta$/, { timeout: 20_000 });
  });

  test('pular introdução vai direto ao painel e não repete', async ({ page }) => {
    const email = `onboarding.pular.e2e.${Date.now()}@rkt.com`;

    // 1. Cadastro de um atleta novo.
    await page.goto('/signup');
    await page.getByLabel('Nome completo').fill('Atleta Pular Introducao');
    await page.getByLabel('E-mail ou CPF').fill(email);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.locator('#signup-terms-checkbox').check();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await page.waitForURL(/\/login$/, { timeout: 20_000 });

    // 2. Primeiro login: cai no onboarding, não direto no painel.
    await page.getByLabel('E-mail ou CPF').fill(email);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await page.waitForURL(/\/onboarding\?next=.*perfil=ATLETA/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'O que é o RKT e a telemetria de tênis' }),
    ).toBeVisible();

    // 3. Pula a introdução na primeira etapa.
    await page.getByRole('button', { name: 'Pular Introdução' }).click();

    // 4. Chega ao painel do atleta e grava a flag local.
    await page.waitForURL(/\/atleta$/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'O que é o RKT e a telemetria de tênis' }),
    ).toHaveCount(0);

    const onboardingKeys = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((key) => key.startsWith('rkt_onboarded_')),
    );
    expect(onboardingKeys).toHaveLength(1);

    // 5. A introdução não se repete em uma nova visita direta.
    await page.goto('/onboarding');
    await page.waitForURL(/\/atleta$/, { timeout: 20_000 });
  });

  test('gestor cadastro, três etapas do onboarding e chegada ao painel do CT', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    const email = `gestor.e2e.${Date.now()}@rkt.com`;
    const cnpj = generateValidCnpj();
    const cpf = generateValidCpf();
    const legalRepEmail = `gestor.resp.e2e.${Date.now()}@rkt.com`;

    // 1. Cadastro de gestor (abre o modal de clube).
    await page.goto('/signup?perfil=GESTOR');
    await page.getByLabel('Nome completo').fill('Gestor E2E Teste');
    await page.getByLabel('E-mail ou CPF').fill(email);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByLabel(/Li e aceito os/).check();
    await page.getByRole('button', { name: 'Avançar: cadastrar clube' }).click();

    // 2. Modal step 1: dados do clube e responsável legal.
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('CNPJ').fill(cnpj);
    await dialog.getByLabel('Razão Social').fill('CT E2E Ltda');
    await dialog.getByLabel('Nome Fantasia (CT)').fill('CT E2E');
    await dialog.getByLabel('Telefone').first().fill('(11) 98765-4321');
    await dialog.getByLabel('E-mail institucional').fill(`ct.e2e.${Date.now()}@rkt.com`);
    await dialog.getByLabel('Rua').fill('Rua das Flores');
    await dialog.getByLabel('Número').fill('123');
    await dialog.getByLabel('Complemento').fill('Sala 1');
    await dialog.getByLabel('Bairro').fill('Centro');
    await dialog.getByLabel('Cidade').fill('São Paulo');
    await dialog.getByLabel('Estado (UF)').fill('SP');
    await dialog.getByLabel('CEP').fill('01310-000');
    await dialog.getByLabel('Nome completo').fill('João Silva E2E');
    await dialog.getByLabel('CPF').fill(cpf);
    await dialog.getByLabel('E-mail', { exact: true }).fill(legalRepEmail);
    await dialog.getByLabel('Telefone').last().fill('(11) 98765-4321');

    await dialog.getByRole('button', { name: 'Avançar para Responsável' }).click();

    // 3. Modal step 2: responsável (mesmo que o legal) e senha.
    await dialog
      .getByRole('checkbox', {
        name: 'O responsável pelo sistema é o mesmo representante legal da PJ',
      })
      .check();
    await dialog.getByPlaceholder('Mínimo 8 caracteres').fill(PASSWORD);
    await dialog.getByPlaceholder('Repita a senha').fill(PASSWORD);
    await dialog.getByRole('button', { name: 'Concluir Cadastro do Clube' }).click();

    await page.waitForURL(/\/login$/, { timeout: 20_000 });

    // 4. Login do gestor: cai no onboarding, não direto no painel do CT.
    await page.getByLabel('E-mail ou CPF').fill(legalRepEmail);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await page.waitForURL(/\/onboarding\?next=.*perfil=GESTOR/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'Visão do painel executivo do seu CT' }),
    ).toBeVisible();

    // 5. Percorre as três etapas do perfil Gestor.
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Gestão de licenças, treinadores e atletas' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Enviar os primeiros convites para sua equipe' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Concluir' }).click();

    // 6. Chega ao painel do gestor e grava a flag local.
    await page.waitForURL(/\/clube\/gestor$/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'Visão do painel executivo do seu CT' }),
    ).toHaveCount(0);

    const onboardingKeys = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((key) => key.startsWith('rkt_onboarded_')),
    );
    expect(onboardingKeys).toHaveLength(1);

    // 7. A introdução não se repete em uma nova visita direta.
    await page.goto('/onboarding');
    await page.waitForURL(/\/clube\/gestor$/, { timeout: 20_000 });
  });
});
