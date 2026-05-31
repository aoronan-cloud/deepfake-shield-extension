# 🛡️ Deepfake Shield Extension

**Detecção em tempo real de Deepfakes e manipulações por IA em videochamadas, rodando 100% localmente no seu navegador.**

[![Licença: GPL Híbrida](https://img.shields.io/badge/License-GPL%20%2B%20Commercial-blue.svg)](LICENSE)
[![Privacidade: 100% Local](https://img.shields.io/badge/Privacy-100%25%20Local-success.svg)](#)
[![Tech: WebAssembly & ONNX](https://img.shields.io/badge/Tech-WASM%20%7C%20ONNX-orange.svg)](#)

O **Deepfake Shield** é uma extensão de navegador focada em segurança corporativa e pessoal. Ele intercepta fluxos de vídeo no Google Meet e utiliza modelos de Inteligência Artificial para analisar micro-padrões e artefatos de renderização, determinando a autenticidade do interlocutor em tempo real.

---

## 🚀 O Diferencial: Privacidade Absoluta (Zero-Cloud)

Diferente de soluções de mercado que enviam frames do seu vídeo para servidores na nuvem (ferindo regras de *Compliance* e LGPD), o Deepfake Shield processa **tudo no seu próprio hardware**. 

Nós convertemos um modelo treinado em **PyTorch** para o formato **ONNX** e o executamos diretamente no navegador utilizando **WebAssembly (WASM)**.
* Nenhuma imagem sai da sua máquina.
* Nenhum dado é armazenado.
* Latência quase zero.

## 🧠 Arquitetura Técnica

A extensão foi construída com foco em isolamento e performance:
* **Motor de Inferência:** `onnxruntime-web` operando via WebAssembly para cálculos matriciais de alta velocidade na CPU.
* **Isolamento de Interface:** Injeção de HUD (Heads-Up Display) sobre o vídeo utilizando **Shadow DOM**, garantindo que o código da extensão não interfira (e nem seja bloqueado) pelos scripts da página da videochamada.
* **Modelo de IA:** Transfer Learning a partir do MobileNetV2, treinado especificamente para identificar anomalias geradas por Redes Adversárias Generativas (GANs) em rostos humanos.

---

## 🛠️ Como Instalar (Modo Desenvolvedor)

Atualmente a extensão está em fase de lançamento técnico e pode ser instalada manualmente:

1. Faça o clone deste repositório:
   ```bash
   git clone [https://github.com/aoronan-cloud/deepfake-shield-extension.git](https://github.com/aoronan-cloud/deepfake-shield-extension.git)
