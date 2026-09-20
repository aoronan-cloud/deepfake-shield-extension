// build.js
const esbuild = require('esbuild');

console.log('🚀 Iniciando a compilação do Shield...');

esbuild.build({
  // content_script.js roda no mundo isolado (padrão); webrtc_hook.js roda no
  // MAIN world (ver manifest.json) e por isso precisa ser um arquivo separado.
  entryPoints: {
    content_script: 'src/main.js',
    webrtc_hook: 'src/capture/webrtc_hook.js',
  },

  // Junta todos os arquivos importados (capture, ai, ui) em um só por entry point
  bundle: true,

  // Onde os arquivos finais serão salvos (é o que a extensão vai usar)
  outdir: 'dist',

  // Minimiza o código para ficar leve
  minify: true,

  // Transpila para JavaScript moderno compatível com todos os navegadores
  target: ['chrome100', 'edge100'],

}).then(() => {
  console.log('✅ Build concluído com sucesso! Arquivos gerados em dist/');
}).catch((e) => {
  console.error('❌ Erro na compilação:', e);
  process.exit(1);
});
