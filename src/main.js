// src/main.js
import { VideoInterceptor } from './capture/video_interceptor.js';
import { AIEngine } from './ai/onnx_engine.js';
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
    await ai.initialize();
    
    // Se o seu ONNX retornar o backend ativo (WebGPU/WebGL), mapeamos aqui:
    currentTelemetry.backend = ai.backendName || 'GPU (WebGPU/WebGL)'; 

    const activeUIs = new Map();

    const handleNewVideo = (videoElement, mediaStream, container) => {
        console.log(`[Shield Maestro] Alvo detectado no ${currentTelemetry.platform}. Acoplando Defesa...`);
        
        const ui = new SecurityUI(videoElement, container);
        activeUIs.set(videoElement, ui);
        ui.toggleVisibility(isShieldActive);

        // NOVO: Extração e Monitoramento de Voz (Áudio)
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
            console.log("[Shield Maestro] Canal de voz detectado. Iniciando monitoramento.");
            // Exemplo de como você vai repassar isso pro motor de IA no futuro:
            // ai.processAudio(mediaStream, (audioRisk) => { currentTelemetry.audioScore = audioRisk; });
            
            // Simulação de segurança de áudio para o painel tático:
            setInterval(() => { currentTelemetry.audioScore = (Math.random() * (99.9 - 95.0) + 95.0).toFixed(1); }, 3000);
        }

        // Processamento de Vídeo
        ai.processStream(mediaStream, (riskScore) => {
            if (isShieldActive) {
                ui.updateThreatLevel(riskScore);
                currentTelemetry.videoScore = riskScore; // Envia para o painel
            }
        });
    };

    const interceptor = new VideoInterceptor(handleNewVideo);
    interceptor.start();

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
