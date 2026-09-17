# Preparando os arquivos para a "webcam falsa" do Chrome

O Chromium tem flags que fazem ele usar um arquivo de vídeo/áudio como se
fosse a câmera e o microfone de verdade. Isso permite testar a extensão em
chamadas reais (Meet/Teams) sem precisar segurar a câmera na frente de um
monitor. É exatamente o que o `run-extension-test.js` usa.

## Requisitos

- [ffmpeg](https://ffmpeg.org/download.html) instalado no Windows (`winget install ffmpeg` ou baixar o build e adicionar ao PATH)

## Converter vídeo (.mp4 → .y4m)

O Chromium só aceita vídeo bruto no formato Y4M para essa flag:

```powershell
ffmpeg -i amostras\real\meu_video.mp4 -pix_fmt yuv420p amostras\real\meu_video.y4m
ffmpeg -i amostras\deepfake\clipe_dataset.mp4 -pix_fmt yuv420p amostras\deepfake\clipe_dataset.y4m
```

Recomenda-se manter os clipes curtos (15-30s) e em resolução 640x480 ou
720p — arquivos y4m sem compressão ficam grandes rápido:

```powershell
ffmpeg -i entrada.mp4 -vf scale=1280:720 -pix_fmt yuv420p -t 20 saida.y4m
```

## Converter áudio (qualquer formato → .wav)

```powershell
ffmpeg -i amostras\real\minha_voz.mp3 -ar 48000 -ac 1 amostras\real\minha_voz.wav
```

## Resultado esperado

```
amostras/
├── real/
│   ├── meu_video.y4m
│   └── minha_voz.wav
└── deepfake/
    ├── clipe_dataset.y4m
    └── voz_pitch_alterado.wav
```

Esses são os caminhos que o `run-extension-test.js` espera (ajustáveis no
topo do script).
