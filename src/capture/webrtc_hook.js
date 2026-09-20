// src/capture/webrtc_hook.js
//
// Roda no MAIN world (mesmo contexto JS da página), configurado via manifest.json.
// Um content script isolado nunca veria as instâncias de RTCPeerConnection que o
// próprio Meet/Teams/Zoom cria — sobrescrever window.RTCPeerConnection lá não teria
// efeito nenhum sobre o código da página.
//
// Motivação: algumas variantes do Meet tocam o áudio remoto direto via Web Audio
// API/AudioWorklet, sem nunca criar um elemento <audio> no DOM — o que deixa o
// MutationObserver do video_interceptor.js cego para essas chamadas (ver bug
// documentado em 2026-09-17). Aqui pegamos a MediaStreamTrack de áudio direto da
// conexão WebRTC, antes de qualquer decisão de renderização da plataforma.
//
// Tentativa inicial: repassar a track pro mundo isolado via CustomEvent (evento
// dispatchado em window, ouvido pelo content script). Não funcionou — o `detail`
// do evento chega vazio/stripped do outro lado (testado ao vivo em 2026-09-19), o
// que sugere que o Chrome não deixa um objeto JS complexo como MediaStreamTrack
// atravessar a fronteira entre os dois mundos por esse canal.
//
// Solução que funciona: criar aqui mesmo, no MAIN world, um <audio> oculto com
// `srcObject` apontando pra essa track e inserir no DOM real. Elementos do DOM
// (ao contrário de propriedades JS soltas) SÃO compartilhados entre os mundos, e
// o MutationObserver que video_interceptor.js já usa detecta esse elemento
// exatamente como detectaria um <audio> criado pela própria página.
(function () {
    const NativeRTCPeerConnection = window.RTCPeerConnection;
    if (!NativeRTCPeerConnection) return;

    class ShieldRTCPeerConnection extends NativeRTCPeerConnection {
        constructor(...args) {
            super(...args);
            this.addEventListener('track', (event) => {
                if (event.track.kind !== 'audio') return;

                const hiddenAudio = document.createElement('audio');
                hiddenAudio.muted = true; // a própria página já toca o áudio de verdade; não queremos duplicar o som
                hiddenAudio.style.display = 'none';
                hiddenAudio.srcObject = new MediaStream([event.track]);
                document.documentElement.appendChild(hiddenAudio);
                hiddenAudio.play().catch(() => {});
            });
        }
    }

    window.RTCPeerConnection = ShieldRTCPeerConnection;
})();
