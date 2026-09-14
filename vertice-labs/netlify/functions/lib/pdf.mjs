// PDF da página do contrato, impresso pelo Chromium headless.
//
// No Netlify usa o binário do @sparticuz/chromium (empacotado com a function,
// ver netlify.toml). Em desenvolvimento, defina PUPPETEER_EXECUTABLE_PATH com
// o caminho do Edge/Chrome local e o mesmo código roda na máquina.
//
// A function tem 10 s no plano atual do Netlify; os tempos abaixo somam menos
// que isso. A página sinaliza que terminou de desenhar os carimbos com
// document.documentElement.dataset.pronto = "1" (modo ?pdf=1).

import puppeteer from "puppeteer-core";

const ESPERA_PAGINA_MS = 7000;
const ESPERA_PRONTO_MS = 3000;

export async function gerarPdf(url) {
  const browser = await abrirNavegador();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1400, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: ESPERA_PAGINA_MS });
    await page
      .waitForFunction(() => document.documentElement.dataset.pronto === "1", { timeout: ESPERA_PRONTO_MS })
      .catch(() => {}); // sem o sinal, imprime o que estiver na tela
    await page.evaluateHandle("document.fonts.ready");
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => {});
  }
}

async function abrirNavegador() {
  const local = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (local) {
    return puppeteer.launch({ executablePath: local, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  }
  const { default: chromium } = await import("@sparticuz/chromium");
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });
}
