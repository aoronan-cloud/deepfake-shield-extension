// src/main.js
import { VideoInterceptor } from './capture/video_interceptor.js';
import { AIEngine } from './ai/onnx_engine.js';
import { AudioEngine } from './ai/audio_engine.js';
import { SecurityUI } from './ui/shadow_overlay.js';

console.log("[Shield Maestro v1.1] Inicializando sistema Multi-Plataforma...");

let isShieldActive = true;

// NOVO: Memória de Telemetria (Para o Painel Popup)
let currentTelemetry = {
    backend: 'Acelerando Hardware...',
    platform: 'Buscando...',
    videoScore: null,
    audioScore: null
};

// NOVO: Detector Universal de Layout
function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('meet.google')) return 'Google Meet';
    if (host.includes('teams.microsoft') || host.includes('teams.live')) return 'MS Teams';
    if (host.includes('zoom.us')) return 'Zoom Web';
    if (host.includes('discord.com')) return 'Discord';
    if (host.includes('whatsapp.com')) return 'WhatsApp Web';
    return 'Desconhecida';
}

async function bootstrap() {
    currentTelemetry.platform = detectPlatform();

    const storage = await chrome.storage.local.get(['shieldActive']);
    if (storage.shieldActive !== undefined) {
        isShieldActive = storage.shieldActive;
    }

    const ai = new AIEngine();
    const audioAi = new AudioEngine();

    const activeUIs = new Map();

    // Evita rodar a inferência de voz duas vezes na mesma track remota — pode
    // acontecer da plataforma criar seu próprio <audio> para uma track que o
    // webrtc_hook.js (MAIN world) já tinha sintetizado um <audio> oculto pra ela.
    const processedAudioTrackIds = new Set();

    // O VideoInterceptor precisa estar escutando ANTES dos engines de IA
    // terminarem de carregar (~1-2s): o elemento de mídia pode aparecer e disparar
    // 'playing' enquanto os engines ainda carregam, e queremos processá-lo assim
    // que possível em vez de perder a corrida (achado ao vivo em 2026-09-19). Por
    // isso os alvos que chegam cedo ficam numa fila até os engines ficarem prontos.
    let aiReady = false;
    let audioReady = false;
    const pendingVideoTargets = [];
    const pendingAudioStreams = [];

    const startVideoMonitoring = (videoElement, mediaStream, container) => {
        const ui = new SecurityUI(videoElement, container);
        activeUIs.set(videoElement, ui);
        ui.toggleVisibility(isShieldActive);

        ai.processStream(mediaStream, (riskScore) => {
            if (isShieldActive) {
                ui.updateThreatLevel(riskScore);
                currentTelemetry.videoScore = riskScore; // Envia para o painel
            }
        });
    };

    const startVoiceMonitoring = (audioStream) => {
        console.log("[Shield Maestro] Canal de voz detectado. Iniciando monitoramento.");
        audioAi.processStream(audioStream, (spoofRisk) => {
            currentTelemetry.audioScore = spoofRisk;
        });
    };

    const monitorVoice = (audioStream) => {
        const track = audioStream.getAudioTracks()[0];
        if (!track || processedAudioTrackIds.has(track.id)) return;
        processedAudioTrackIds.add(track.id);

        if (audioReady) {
            startVoiceMonitoring(audioStream);
        } else {
            pendingAudioStreams.push(audioStream);
        }
    };

    const handleNewVideo = (videoElement, mediaStream, container) => {
        console.log(`[Shield Maestro] Alvo detectado no ${currentTelemetry.platform}. Acoplando Defesa...`);

        // Overlay visual só existe quando há vídeo de verdade (chamada só de voz não tem o que desenhar)
        const hasVideoTrack = mediaStream.getVideoTracks().length > 0;
        if (hasVideoTrack && container) {
            if (aiReady) {
                startVideoMonitoring(videoElement, mediaStream, container);
            } else {
                pendingVideoTargets.push({ videoElement, mediaStream, container });
            }
        }

        // Extração e Monitoramento de Voz (Áudio) — independe de ter vídeo ou não
        if (mediaStream.getAudioTracks().length > 0) {
            monitorVoice(mediaStream);
        }
    };

    const interceptor = new VideoInterceptor(handleNewVideo);
    interceptor.start();

    await ai.initialize();
    // Se o seu ONNX retornar o backend ativo (WebGPU/WebGL), mapeamos aqui:
    currentTelemetry.backend = ai.backendName || 'GPU (WebGPU/WebGL)';
    aiReady = true;
    pendingVideoTargets.splice(0).forEach(({ videoElement, mediaStream, container }) => {
        startVideoMonitoring(videoElement, mediaStream, container);
    });

    await audioAi.initialize();
    audioReady = true;
    pendingAudioStreams.splice(0).forEach(startVoiceMonitoring);

    // Controle do Liga/Desliga
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.shieldActive !== undefined) {
            isShieldActive = changes.shieldActive.newValue;
            console.log(`[Shield Maestro] IA ${isShieldActive ? 'ATIVA' : 'PAUSADA'}.`);
            
            for (let [video, ui] of activeUIs.entries()) {
                ui.toggleVisibility(isShieldActive);
            }
        }
    });

    // NOVO: Ouvinte do Painel Tático
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "GET_TELEMETRY") {
            sendResponse(currentTelemetry);
        }
    });
}

bootstrap();
