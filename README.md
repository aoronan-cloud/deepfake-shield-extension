# 🛡️ Shield: Deepfake & AI Detector

> Proteção preventiva e em tempo real contra deepfakes e clonagem de voz em videoconferências. 100% local, privado e open-source.

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-brightgreen)
![Manifest](https://img.shields.io/badge/Manifest-V3-blue)
![License](https://img.shields.io/badge/License-GPL%20v3-red)
![Platform](https://img.shields.io/badge/Platform-Google%20Meet%20%7C%20MS%20Teams-lightgrey)

## 🎯 O Problema
A proliferação de modelos gerativos e *face-swapping* em tempo real criou um vetor de ataque crítico em ambientes corporativos e reuniões online. Ferramentas de detecção baseadas em nuvem sofrem de latência, custos altos e, o mais importante, ferem a privacidade ao enviar fluxos de vídeo confidenciais para servidores de terceiros.

## 💡 A Solução
O **Shield** é uma extensão de navegador de baixo nível que intercepta fluxos WebRTC diretamente no DOM. Ele utiliza Modelos Neurais Convolucionais (MobileNet/ONNX) rodando inteiramente na máquina do usuário via WebAssembly (WASM), garantindo **Zero-Trust, Zero-Latency e 100% de Privacidade**.

---

## 🏗️ Arquitetura Técnica

Para garantir que a extensão não consuma recursos excessivos da máquina durante uma chamada de vídeo, o projeto foi arquitetado com separação estrita de responsabilidades:

*   **Interceptador do DOM (`MutationObserver`):** Monitora a injeção de novas tags `<video>` nas plataformas (Meet/Teams) em tempo real, sem depender de APIs restritas.
*   **Motor de IA (ONNX Runtime Web):** O "cérebro" do sistema. Opera extração de tensores NCHW Float32 diretamente de um `<canvas>` fantasma. A inferência matemática roda em **WebAssembly (WASM)**, isolando a carga da CPU.
*   **Isolamento Visual (Shadow DOM):** A Interface de Usuário (o HUD de detecção e bounding boxes) é injetada via Shadow DOM, garantindo que o CSS nativo do Google/Microsoft não interfira nos alertas de segurança, e vice-versa.
*   **Empacotador:** Construído com `esbuild` para compilação em milissegundos e minificação agressiva, resultando em um único `content_script.js` altamente otimizado.

---

## 🚀 Como Testar Localmente (Modo Desenvolvedor)

### Pré-requisitos
* Node.js e npm instalados.
* Firefox, Google Chrome ou Microsoft Edge.

### Instalação
1. Clone o repositório:
```bash
   git clone [https://github.com/SEU-USUARIO/deepfake-shield-extension.git](https://github.com/SEU-USUARIO/deepfake-shield-extension.git)
   cd deepfake-shield-extension
