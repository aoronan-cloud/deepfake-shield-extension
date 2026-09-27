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
//
// Limitação achada em 2026-09-27: o Meet chama `receiver.createEncodedStreams()`
// nas tracks de áudio e decodifica o Opus ele mesmo, num AudioWorklet próprio
// ('neteq-processor'). A track WebRTC fica então eternamente em silêncio (RMS 0) —
// por isso também espelhamos a SAÍDA desse worklet (ver hook de AudioWorkletNode
// abaixo). O áudio chega misturado (todos os participantes remotos juntos).
(function () {
    // Cria um <audio> oculto e mudo com o stream, para o MutationObserver do
    // content script (mundo isolado) enxergá-lo.
    const exposeToContentScript = (stream) => {
        const hiddenAudio = document.createElement('audio');
        hiddenAudio.muted = true; // a própria página já toca o áudio de verdade; não queremos duplicar o som
        hiddenAudio.style.display = 'none';
        hiddenAudio.srcObject = stream;
        document.documentElement.appendChild(hiddenAudio);
        hiddenAudio.play().catch(() => {});
        return hiddenAudio;
    };

    // Receivers cujo áudio a página desviou via encoded streams: a track deles
    // nunca terá som (o Meet decodifica por conta própria), então não vale gastar
    // um AudioContext monitorando-a no content script.
    const divertedReceivers = new WeakSet();
    const receiverProto = window.RTCRtpReceiver && RTCRtpReceiver.prototype;
    if (receiverProto && receiverProto.createEncodedStreams) {
        const nativeCreateEncodedStreams = receiverProto.createEncodedStreams;
        receiverProto.createEncodedStreams = function (...args) {
            divertedReceivers.add(this);
            return nativeCreateEncodedStreams.apply(this, args);
        };
    }

    const NativeRTCPeerConnection = window.RTCPeerConnection;
    if (NativeRTCPeerConnection) {
        class ShieldRTCPeerConnection extends NativeRTCPeerConnection {
            constructor(...args) {
                super(...args);
                this.addEventListener('track', (event) => {
                    if (event.track.kind !== 'audio') return;

                    // setTimeout: nosso listener é registrado antes do da página, então
                    // esperamos o dispatch terminar para ela ter chance de chamar
                    // createEncodedStreams() no próprio handler de 'track'.
                    setTimeout(() => {
                        if (divertedReceivers.has(event.receiver) || event.track.readyState === 'ended') return;
                        watchTrack(event.track);
                    }, 0);
                });
            }
        }

        const watchTrack = (track) => {
            const hiddenAudio = exposeToContentScript(new MediaStream([track]));

            // Retries de negociação WebRTC (ex.: Meet tentando estabilizar a
            // conexão) descartam essa track e criam outra em uma nova
            // RTCPeerConnection — sem isso o <audio> oculto órfão ficava pra
            // sempre no DOM (achado em 2026-09-19).
            track.addEventListener('ended', () => hiddenAudio.remove(), { once: true });
        };

        window.RTCPeerConnection = ShieldRTCPeerConnection;
    }

    // Worklets que decodificam o áudio remoto por conta própria, por nome de processor.
    const REMOTE_AUDIO_WORKLETS = new Set(['neteq-processor']); // Google Meet

    const NativeAudioWorkletNode = window.AudioWorkletNode;
    if (NativeAudioWorkletNode) {
        window.AudioWorkletNode = new Proxy(NativeAudioWorkletNode, {
            construct(target, args, newTarget) {
                const node = Reflect.construct(target, args, newTarget);
                const [context, processorName] = args;
                if (REMOTE_AUDIO_WORKLETS.has(processorName)) {
                    try {
                        // Fan-out extra: não interfere no caminho que o Meet monta até os alto-falantes.
                        const tap = context.createMediaStreamDestination();
                        for (let i = 0; i < node.numberOfOutputs; i++) node.connect(tap, i);
                        exposeToContentScript(tap.stream);
                    } catch (e) {
                        console.warn('[Shield Hook] Falha ao espelhar saída de áudio:', e);
                    }
                }
                return node;
            }
        });
    }
})();
