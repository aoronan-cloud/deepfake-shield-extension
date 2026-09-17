/**
 * Teste de fumaca automatizado para a extensao "Shield: Deepfake & AI Detector".
 *
 * O que faz:
 *  - Abre um Chrome de verdade (nao headless — extensoes nao funcionam bem
 *    em modo headless) com a extensao carregada a partir da pasta local.
 *  - Usa as flags de "camera/microfone falsos" do Chromium para injetar um
 *    arquivo de video/audio como se fosse a webcam — assim da pra testar
 *    com um clipe real ou deepfake sem precisar de camera fisica.
 *  - Navega ate uma URL de teste, espera alguns segundos, e coleta:
 *      - mensagens de console (filtradas por palavras-chave da extensao)
 *      - screenshot da pagina
 *      - um relatorio .json em relatorios/
 *
 * Uso:
 *   node run-extension-test.js real      -> usa amostras/real/*.y4m + .wav
 *   node run-extension-test.js deepfake  -> usa amostras/deepfake/*.y4m + .wav
 *
 * Variaveis de ambiente (todas opcionais, tem default):
 *   EXTENSION_PATH   caminho da pasta da extensao descompactada
 *                     (default: ../../deepfake-shield-extension, ajuste conforme seu clone)
 *   TEST_URL         pagina a abrir (default: pagina local de teste de getUserMedia,
 *                     inclusa neste script como fallback — troque por
 *                     https://meet.google.com/xxx-xxx-xxx depois de logar manualmente
 *                     uma vez e salvar o storageState, ver comentario abaixo)
 *   WAIT_SECONDS     quanto tempo esperar analisando antes de capturar o resultado (default: 20)
 *
 * Pre-requisitos:
 *   cd scripts
 *   npm install
 *   (rodar no Windows, com a pasta do projeto clonada e os videos convertidos
 *   conforme preparar-video.md)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const MODE = process.argv[2]; // 'real' ou 'deepfake'
if (!['real', 'deepfake'].includes(MODE)) {
  console.error('Uso: node run-extension-test.js <real|deepfake>');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const EXTENSION_PATH = process.env.EXTENSION_PATH || path.resolve(ROOT, '..', 'deepfake-shield-extension');
const AMOSTRAS_DIR = path.join(ROOT, 'amostras', MODE);
const RELATORIOS_DIR = path.join(ROOT, 'relatorios');
const WAIT_SECONDS = Number(process.env.WAIT_SECONDS || 20);

// Pagina local minima que so pede getUserMedia e mostra o video — usada como
// fallback para validar que a camera/microfone falsos estao funcionando,
// antes de tentar Meet/Teams de verdade (que exigem login).
const FALLBACK_TEST_PAGE = path.join(ROOT, 'scripts', 'pagina-teste-webcam.html');

function findFile(dir, ext) {
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).find((f) => f.endsWith(ext));
  return f ? path.join(dir, f) : null;
}

async function main() {
  if (!fs.existsSync(EXTENSION_PATH)) {
    console.error(`Pasta da extensao nao encontrada: ${EXTENSION_PATH}`);
    console.error('Ajuste a variavel de ambiente EXTENSION_PATH ou o caminho no topo do script.');
    process.exit(1);
  }

  const videoFile = findFile(AMOSTRAS_DIR, '.y4m');
  const audioFile = findFile(AMOSTRAS_DIR, '.wav');
  if (!videoFile || !audioFile) {
    console.error(`Nao encontrei .y4m e/ou .wav em ${AMOSTRAS_DIR}`);
    console.error('Veja scripts/preparar-video.md para converter seus clipes primeiro.');
    process.exit(1);
  }
  console.log(`Modo: ${MODE}`);
  console.log(`Video falso: ${videoFile}`);
  console.log(`Audio falso: ${audioFile}`);

  const userDataDir = path.join(ROOT, '.chrome-profile-teste');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome', // usa o Chrome instalado no sistema, nao o Chromium do Playwright
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream', // auto-aceita o prompt de permissao de camera/mic
      `--use-file-for-fake-video-capture=${videoFile}`,
      `--use-file-for-fake-audio-capture=${audioFile}`,
    ],
  });

  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    // imprime ao vivo so o que parecer relevante, pra nao poluir o terminal
    if (/shield|deepfake|alert|warn|error/i.test(text)) {
      console.log(`[console:${msg.type()}] ${text}`);
    }
  });

  const testUrl = process.env.TEST_URL || `file://${FALLBACK_TEST_PAGE}`;
  console.log(`Abrindo: ${testUrl}`);
  console.log(
    'AVISO: se for Meet/Teams pela primeira vez, faca login manualmente nesta janela — ' +
      'o perfil fica salvo em .chrome-profile-teste para as proximas execucoes.'
  );
  await page.goto(testUrl, { waitUntil: 'load' });

  console.log(`Aguardando ${WAIT_SECONDS}s para a extensao analisar o fluxo...`);
  await page.waitForTimeout(WAIT_SECONDS * 1000);

  fs.mkdirSync(RELATORIOS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(RELATORIOS_DIR, `${MODE}-${stamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const reportPath = path.join(RELATORIOS_DIR, `${MODE}-${stamp}.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        modo: MODE,
        data: new Date().toISOString(),
        videoUsado: videoFile,
        audioUsado: audioFile,
        urlTestada: testUrl,
        screenshot: screenshotPath,
        consoleLogs,
      },
      null,
      2
    )
  );

  console.log(`\nRelatorio salvo em: ${reportPath}`);
  console.log(`Screenshot salvo em: ${screenshotPath}`);
  console.log(
    '\nPróximo passo: confira manualmente o screenshot e os console logs — ' +
      'procure o alerta de deepfake (modo "deepfake") ou a ausencia dele (modo "real").'
  );

  await context.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
