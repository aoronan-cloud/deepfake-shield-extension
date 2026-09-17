# Kit de Testes — Shield: Deepfake & AI Detector

Base para testar a extensão (Chrome + Edge, v1.1.0) antes de evoluir o projeto.
Cobre: checklist funcional, plano de casos de teste, script automatizado
(Playwright, injeta vídeo/áudio de amostra como se fosse a webcam) e onde
conseguir vídeos de amostra (reais e deepfake) para o teste de detecção.

## Estrutura

```
deepfake-shield-tests/
├── PLANO_DE_TESTES.md      ← checklist + casos de teste (comece por aqui)
├── amostras/
│   └── README.md           ← onde conseguir vídeos reais e deepfake de teste
├── scripts/
│   ├── run-extension-test.js  ← automação Playwright (carrega a extensão de verdade)
│   ├── package.json
│   └── preparar-video.md      ← como converter .mp4 para o formato que o Chrome aceita como "webcam falsa"
└── relatorios/              ← saída dos testes (gerado automaticamente)
```

## Como usar (visão geral)

1. Leia o `PLANO_DE_TESTES.md` — é o roteiro principal, com todos os casos de teste.
2. Pegue vídeos de amostra em `amostras/README.md`.
3. Rode os testes manuais (instalar a extensão descompactada e testar no Meet/Teams de verdade).
4. Opcionalmente, rode `scripts/run-extension-test.js` para automatizar os testes de fumaça
   (a extensão carrega, não quebra o console, dispara alerta com vídeo deepfake) usando a
   câmera/microfone "falsos" do Chromium — sem precisar de webcam real.

Tudo isso deve rodar **no seu PC** (`C:\Projetos\deepfake-shield-extension`), com Node.js
instalado, porque precisa acessar a pasta real da extensão e abrir um Chrome de verdade.
