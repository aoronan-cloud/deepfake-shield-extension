// popup/popup.js
document.addEventListener('DOMContentLoaded', () => {
    const githubLink = document.getElementById('github-link');
    const donateLink = document.getElementById('donate-link');

    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const tacticalPanel = document.getElementById('tactical-panel');
    const powerSwitch = document.getElementById('power-switch');
    const activePlatform = document.getElementById('active-platform');
    const engineBackend = document.getElementById('engine-backend');
    const videoScore = document.getElementById('video-score');
    const audioScore = document.getElementById('audio-score');

    // Link do GitHub
    githubLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/aoronan-cloud/deepfake-shield' });
    });

    // Link de Doação (Apoiar Projeto)
    donateLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Substitua pelo seu link real do PayPal, BuyMeACoffee, Stripe, etc.
        chrome.tabs.create({ url: 'https://www.paypal.com/donate/?business=LE69LGH4RB7RA&no_recurring=0&item_name=Criando+ferramentas+de+seguran%C3%A7a+digital+e+Intelig%C3%AAncia+Artificial+open-source%2C+locais+e+focadas+em+privacidade.&currency_code=BRL' }); 
    });

    const updateUI = (isActive) => {
        if (isActive) {
            statusDot.classList.remove('disabled');
            statusText.innerText = 'Motor IA Ativo';
            statusText.style.color = '#f8fafc';
            tacticalPanel.style.opacity = '1';
        } else {
            statusDot.classList.add('disabled');
            statusText.innerText = 'Sistema Pausado';
            statusText.style.color = '#94a3b8';
            tacticalPanel.style.opacity = '0.4';
            videoScore.innerText = '--%';
            audioScore.innerText = '--%';
        }
    };

    chrome.storage.local.get(['shieldActive'], (result) => {
        const isActive = result.shieldActive !== false;
        powerSwitch.checked = isActive;
        updateUI(isActive);
    });

    powerSwitch.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        chrome.storage.local.set({ shieldActive: isActive }, () => {
            updateUI(isActive);
        });
    });

    // NOVO: Coletor de Telemetria (Roda a cada 1 segundo)
    setInterval(() => {
        if (!powerSwitch.checked) return;
        
        // Pergunta para a aba atual quais são os status da IA
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "GET_TELEMETRY" }, (response) => {
                    if (chrome.runtime.lastError) return; // Se a aba não for suportada, ignora
                    if (response) {
                        activePlatform.innerText = response.platform || 'Nenhuma detectada';
                        engineBackend.innerText = response.backend || 'CPU (WASM)';
                        videoScore.innerText = response.videoScore ? response.videoScore + '%' : 'Analisando...';
                        audioScore.innerText = response.audioScore ? response.audioScore + '%' : 'Aguardando Voz...';
                    }
                });
            }
        });
    }, 1000);
});
