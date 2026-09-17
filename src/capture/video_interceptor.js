// src/capture/video_interceptor.js

export class VideoInterceptor {
    /**
     * @param {Function} onNewStreamCallback - Função chamada quando um novo vídeo começa a tocar.
     */
    constructor(onNewStreamCallback) {
        this.onNewStream = onNewStreamCallback;
        // O WeakSet impede vazamento de memória quando as plataformas apagam vídeos antigos
        this.monitoredVideos = new WeakSet();
        this.domObserver = null;

        // Detecta o ambiente uma única vez na inicialização da classe
        this.isTeams = window.location.hostname.includes('teams');
        this.isMeet = window.location.hostname.includes('meet.google');
    }

    // Inicia o Vigilante na página
    start() {
        console.log("[Shield Capture] Iniciando Vigilante do DOM...");

        this.domObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        // Verifica se o próprio nó é um vídeo ou áudio
                        if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                            this._attach(node);
                        }
                        // Verifica se há vídeos/áudios dentro do contêiner adicionado
                        else if (node.nodeType === Node.ELEMENT_NODE) {
                            const hiddenMedia = node.querySelectorAll('video, audio');
                            hiddenMedia.forEach(v => this._attach(v));
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

        // Varredura de segurança para vídeos/áudios que já estavam na tela
        // (chamadas somente-voz, sem câmera, usam <audio> para o participante remoto)
        document.querySelectorAll('video, audio').forEach(v => this._attach(v));
    }

    // Método privado para ancorar os eventos
    _attach(mediaElement) {
        if (this.monitoredVideos.has(mediaElement)) return;
        this.monitoredVideos.add(mediaElement);

        const isVideoTag = mediaElement.tagName === 'VIDEO';
        console.log(`[Shield Capture] Novo elemento <${mediaElement.tagName.toLowerCase()}> detectado na matriz. Plataforma: ${this.isTeams ? 'Teams' : 'Meet'}`);

        let notified = false;
        const notify = () => {
            if (notified) return;

            const stream = mediaElement.srcObject;
            if (!stream) return;

            const hasVideo = stream.getVideoTracks().length > 0;
            const hasAudio = stream.getAudioTracks().length > 0;

            // Antes só disparava com track de vídeo — isso deixava chamadas
            // somente-voz (sem câmera) sem nenhuma análise de clonagem de áudio.
            if (!hasVideo && !hasAudio) return;

            notified = true;
            console.log("[Shield Capture] Fluxo de mídia ativo. Notificando o núcleo principal...");

            // Determina o contêiner ideal para ancorar a HUD (Shadow DOM).
            // Só faz sentido para vídeo — áudio-só não tem overlay visual.
            let container = null;
            if (isVideoTag) {
                container = mediaElement.parentElement;

                if (this.isTeams) {
                    // O Teams aninha o vídeo profundamente em várias divs, precisamos subir na árvore
                    container = mediaElement.closest('[data-tid="video-renderer"]') || mediaElement.parentElement.parentElement || mediaElement.parentElement;
                }
            }

            // Dispara o callback passando os TRÊS elementos cruciais:
            // 1. O elemento HTML de mídia (vídeo ou áudio)
            // 2. O MediaStream (para a IA extrair pixels e/ou samples de áudio)
            // 3. O Container ideal (para a UI desenhar a caixa verde por cima, se houver vídeo)
            this.onNewStream(mediaElement, stream, container);
        };

        // Algumas plataformas montam o elemento na árvore só depois que a mídia
        // já começou a tocar (ex.: preparam o stream fora da tela e só inserem
        // o <audio>/<video> quando está pronto) — nesse caso o 'playing' original
        // já disparou antes do MutationObserver nos avisar da inserção, e nunca
        // dispararia de novo sozinho. Por isso checamos o estado atual na hora
        // de ancorar, além de continuar ouvindo 'playing' para o caso comum.
        if (!mediaElement.paused && mediaElement.readyState >= 2) {
            notify();
        }

        mediaElement.addEventListener('playing', notify);
    }
}
