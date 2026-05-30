// src/ai/onnx_engine.js
import * as ort from 'onnxruntime-web';

// --- BLINDAGEM MANIFEST V3 ---
ort.env.wasm.wasmPaths = chrome.runtime.getURL('public/models/');
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = false;

export class AIEngine {
    constructor() {
        this.session = null;
        this.isLoaded = false;
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        this.TARGET_SIZE = 224;
        this.canvas.width = this.TARGET_SIZE;
        this.canvas.height = this.TARGET_SIZE;
    }

    async initialize() {
        if (this.isLoaded) return;

        console.log("[Shield AI] Carregando pesos neurais (ONNX)...");
        
        try {
            const modelPath = chrome.runtime.getURL('public/models/face_detector.onnx');
            
            this.session = await ort.InferenceSession.create(modelPath, {
                executionProviders: ['wasm']
            });
            
            this.isLoaded = true;
            console.log("[Shield AI] Cérebro carregado e pronto para inferência.");
        } catch (error) {
            console.error("[Shield AI] Erro ao inicializar o modelo:", error);
        }
    }

    async processStream(mediaStream, onResultCallback) {
        if (!this.isLoaded) return;

        const videoElement = document.createElement('video');
        videoElement.srcObject = mediaStream;
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.playsInline = true;

        videoElement.addEventListener('playing', () => {
            const intervalMs = 500; 
            
            const analysisLoop = setInterval(async () => {
                if (videoElement.paused || videoElement.ended || !mediaStream.active) {
                    clearInterval(analysisLoop);
                    return;
                }

                const riskScore = await this._extractAndInfer(videoElement);
                if (riskScore !== null) {
                    onResultCallback(riskScore);
                }

            }, intervalMs);
        });
    }

    async _extractAndInfer(videoElement) {
        this.ctx.drawImage(videoElement, 0, 0, this.TARGET_SIZE, this.TARGET_SIZE);
        const imageData = this.ctx.getImageData(0, 0, this.TARGET_SIZE, this.TARGET_SIZE);
        
        const float32Data = new Float32Array(3 * this.TARGET_SIZE * this.TARGET_SIZE);
        const channelSize = this.TARGET_SIZE * this.TARGET_SIZE;

        for (let i = 0; i < channelSize; i++) {
            const rgbaIndex = i * 4;
            float32Data[i] = (imageData.data[rgbaIndex] / 255.0 - 0.485) / 0.229;                 
            float32Data[channelSize + i] = (imageData.data[rgbaIndex + 1] / 255.0 - 0.456) / 0.224; 
            float32Data[channelSize * 2 + i] = (imageData.data[rgbaIndex + 2] / 255.0 - 0.406) / 0.225; 
        }

        try {
            const tensor = new ort.Tensor('float32', float32Data, [1, 3, this.TARGET_SIZE, this.TARGET_SIZE]);
            
            // TÉCNICA AVANÇADA: Pega dinamicamente o nome da porta de entrada do modelo
            const feedName = this.session.inputNames[0];
            const feeds = {};
            feeds[feedName] = tensor;

            // Roda a inferência com o nome exato que o modelo exige
            const results = await this.session.run(feeds); 
            
            // Pega dinamicamente o nome da porta de saída
            const outputName = this.session.outputNames[0];
            const outputArray = results[outputName].data;
            
            let maxVal = Math.max(...outputArray);
            let normalizedRisk = (Math.tanh(maxVal / 10) + 1) / 2;
            
            return normalizedRisk;
            
        } catch (e) {
            console.error("[Shield AI] Erro ao processar tensores:", e);
            return null;
        }
    }
}
