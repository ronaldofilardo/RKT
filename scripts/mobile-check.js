const { chromium, devices } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const iPhone = devices['iPhone 13'];
  const context = await browser.newContext({
    ...iPhone,
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[pageerror]', err.message));

  // navega para uma página qualquer com o modal
  // Não temos credenciais; então vamos apenas verificar a renderização por um teste isolado.
  // Mas para reproduzir o bug precisa estar logado. Vamos ao menos ver se o app está rodando.
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('[ok] home carregou');
  } catch (e) {
    console.log('[err home]', e.message);
  }

  await page.screenshot({ path: '/tmp/check-home.png', fullPage: true });
  console.log('screenshot salva em /tmp/check-home.png');

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
