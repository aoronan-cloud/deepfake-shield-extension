// src/main.js
import { VideoInterceptor } from './capture/video_interceptor.js';
import { AIEngine } from './ai/onnx_engine.js';
import { SecurityUI } from './ui/shadow_overlay.js';

console.log("[Shield Extension] Inicializando sistema de defesa open-source...");

let isShieldActive = true;

async function bootstrap() {
    const storage = await chrome.storage.local.get(['shieldActive']);
    if (storage.shieldActive !== undefined) {
        isShieldActive = storage.shieldActive;
    }

    const ai = new AIEngine();
    await ai.initialize();

    const activeUIs = new Map();

    const handleNewVideo = (videoElement, mediaStream) => {
        console.log("[Shield Maestro] Alvo detectado. Acoplando HUD e IA...");
        
        const ui = new SecurityUI(videoElement);
        activeUIs.set(videoElement, ui);

        // Usa a nova função de controle
        ui.toggleVisibility(isShieldActive);

        ai.processStream(mediaStream, (riskScore) => {
            if (isShieldActive) {
                ui.updateThreatLevel(riskScore);
            }
        });
    };

    const interceptor = new VideoInterceptor(handleNewVideo);
    interceptor.start();

    // Ouvinte do Botão Popup
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.shieldActive !== undefined) {
            isShieldActive = changes.shieldActive.newValue;
            console.log(`[Shield Maestro] Sistema de IA ${isShieldActive ? 'ATIVADO' : 'DESATIVADO'} pelo usuário.`);
            
            for (let [video, ui] of activeUIs.entries()) {
                // Atualiza a visibilidade corretamente através do método
                ui.toggleVisibility(isShieldActive);
            }
        }
    });
}

bootstrap();
