// popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
    const powerSwitch = document.getElementById('power-switch');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const githubLink = document.getElementById('github-link');

    // Link para o seu repositório (atualize depois com a sua URL real)
    githubLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/SEU-USUARIO/deepfake-shield-extension' });
    });

    // Função para atualizar o visual baseado no estado
    const updateUI = (isActive) => {
        if (isActive) {
            statusDot.classList.remove('disabled');
            statusText.innerText = 'Motor IA Ativo';
            statusText.style.color = '#f8fafc';
        } else {
            statusDot.classList.add('disabled');
            statusText.innerText = 'Sistema Pausado';
            statusText.style.color = '#94a3b8';
        }
    };

    // 1. Ao abrir o popup, lê o estado salvo (Padrão: Ativo)
    chrome.storage.local.get(['shieldActive'], (result) => {
        const isActive = result.shieldActive !== false; // Se for undefined, consideramos true
        powerSwitch.checked = isActive;
        updateUI(isActive);
    });

    // 2. Escuta o clique no botão
    powerSwitch.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        
        // Salva na memória da extensão
        chrome.storage.local.set({ shieldActive: isActive }, () => {
            updateUI(isActive);
        });
    });
});
