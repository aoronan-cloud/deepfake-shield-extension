// src/capture/video_interceptor.js

export class VideoInterceptor {
    /**
     * @param {Function} onNewStreamCallback - Função chamada quando um novo vídeo começa a tocar.
     */
    constructor(onNewStreamCallback) {
        this.onNewStream = onNewStreamCallback;
        // O WeakSet impede vazamento de memória quando o Meet apaga vídeos antigos
        this.monitoredVideos = new WeakSet();
        this.domObserver = null;
    }

    // Inicia o Vigilante na página
    start() {
        console.log("[Shield Capture] Iniciando Vigilante do DOM...");

        this.domObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        // Verifica se o próprio nó é um vídeo
                        if (node.tagName === 'VIDEO') {
                            this._attach(node);
                        } 
                        // Verifica se há vídeos dentro do contêiner adicionado
                        else if (node.nodeType === Node.ELEMENT_NODE) {
                            const hiddenVideos = node.querySelectorAll('video');
                            hiddenVideos.forEach(v => this._attach(v));
                        }
                    });
                }
            }
        });

        // Monitora o site inteiro
        this.domObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        // Varredura de segurança para vídeos que já estavam na tela
        document.querySelectorAll('video').forEach(v => this._attach(v));
    }

    // Método privado para ancorar os eventos
    _attach(videoElement) {
        if (this.monitoredVideos.has(videoElement)) return;
        this.monitoredVideos.add(videoElement);

        console.log("[Shield Capture] Novo elemento <video> detectado na matriz.");

        // O evento 'playing' garante que os metadados (resolução, fluxo) já existem
        videoElement.addEventListener('playing', () => {
            const stream = videoElement.srcObject;
            
            if (stream && stream.getVideoTracks().length > 0) {
                console.log("[Shield Capture] Fluxo de mídia ativo. Notificando o núcleo principal...");
                
                // Dispara o callback passando os DOIS elementos cruciais:
                // 1. O elemento HTML (para o módulo de UI desenhar a borda em cima)
                // 2. O MediaStream (para o módulo de IA extrair os pixels)
                this.onNewStream(videoElement, stream);
            }
        });
    }
}
