// src/ai/audio_engine.js
import * as ort from 'onnxruntime-web';

// Modelo AASIST (NAVER Corp, MIT) exportado para ONNX — ver
// public/models/NOTICE_voice_detector.md para detalhes/atribuição.
const SAMPLE_RATE = 16000;
const NB_SAMP = 64600; // ~4.04s a 16kHz, tamanho fixo esperado pelo modelo

export class AudioEngine {
    constructor() {
        this.session = null;
        this.isLoaded = false;
    }

    async initialize() {
        if (this.isLoaded) return;

        console.log("[Shield Audio] Carregando motor de detecção de voz clonada...");

        try {
            const modelPath = chrome.runtime.getURL('public/models/voice_detector.onnx');
            this.session = await ort.InferenceSession.create(modelPath, {
                executionProviders: ['wasm']
            });
            this.isLoaded = true;
            console.log("[Shield Audio] Motor de voz carregado com sucesso.");
        } catch (error) {
            console.error("[Shield Audio] Erro ao inicializar o motor de voz:", error);
        }
    }

    // Acopla no canal de áudio do mediaStream e chama onResultCallback(spoofRiskPercent)
    // a cada janela de ~4s de fala capturada.
    processStream(mediaStream, onResultCallback) {
        if (!this.isLoaded) return;

        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length === 0) return;

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));

        // ScriptProcessorNode precisa estar conectado até o destino para
        // 'onaudioprocess' disparar de forma confiável. Roteamos através de
        // um GainNode mudo para não reproduzir o áudio da chamada de novo.
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0;

        const resampleRatio = SAMPLE_RATE / audioContext.sampleRate;
        let pending = new Float32Array(0);
        let isInferring = false;

        processor.onaudioprocess = (event) => {
            const input = event.inputBuffer.getChannelData(0);
            const resampled = this._resampleLinear(input, resampleRatio);

            const merged = new Float32Array(pending.length + resampled.length);
            merged.set(pending, 0);
            merged.set(resampled, pending.length);
            pending = merged;

            if (pending.length >= NB_SAMP && !isInferring) {
                const chunk = pending.slice(0, NB_SAMP);
                pending = pending.slice(NB_SAMP);

                isInferring = true;
                this._infer(chunk)
                    .then((spoofRisk) => {
                        if (spoofRisk !== null) onResultCallback(spoofRisk);
                    })
                    .finally(() => { isInferring = false; });
            }
        };

        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(audioContext.destination);
    }

    _resampleLinear(input, ratio) {
        const outLength = Math.max(1, Math.round(input.length * ratio));
        const output = new Float32Array(outLength);
        for (let i = 0; i < outLength; i++) {
            const srcIndex = i / ratio;
            const i0 = Math.floor(srcIndex);
            const i1 = Math.min(i0 + 1, input.length - 1);
            const frac = srcIndex - i0;
            output[i] = input[i0] * (1 - frac) + input[i1] * frac;
        }
        return output;
    }

    async _infer(waveformChunk) {
        try {
            const tensor = new ort.Tensor('float32', waveformChunk, [1, NB_SAMP]);
            const feeds = { waveform: tensor };

            const results = await this.session.run(feeds);
            const logits = results.output.data; // [spoof_logit, bonafide_logit]

            // Softmax para converter logits em probabilidade de "spoof" (voz clonada)
            const maxLogit = Math.max(logits[0], logits[1]);
            const expSpoof = Math.exp(logits[0] - maxLogit);
            const expBonafide = Math.exp(logits[1] - maxLogit);
            const spoofProbability = expSpoof / (expSpoof + expBonafide);

            return (spoofProbability * 100).toFixed(1);
        } catch (e) {
            console.error("[Shield Audio] Erro ao processar áudio:", e);
            return null;
        }
    }
}
