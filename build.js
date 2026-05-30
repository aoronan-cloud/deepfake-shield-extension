// build.js
const esbuild = require('esbuild');

console.log('🚀 Iniciando a compilação do Shield...');

esbuild.build({
  // Onde o código começa (vamos criar esse arquivo no próximo passo)
  entryPoints: ['src/main.js'],
  
  // Junta todos os arquivos importados (capture, ai, ui) em um só
  bundle: true,
  
  // Onde o arquivo final será salvo (este é o que a extensão vai usar)
  outfile: 'dist/content_script.js',
  
  // Minimiza o código para ficar leve
  minify: true,
  
  // Transpila para JavaScript moderno compatível com todos os navegadores
  target: ['chrome100', 'edge100'],
  
}).then(() => {
  console.log('✅ Build concluído com sucesso! Arquivo gerado em dist/content_script.js');
}).catch((e) => {
  console.error('❌ Erro na compilação:', e);
  process.exit(1);
});
