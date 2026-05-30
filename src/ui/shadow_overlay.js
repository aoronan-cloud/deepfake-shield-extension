// src/ui/shadow_overlay.js

export class SecurityUI {
    constructor(videoElement) {
        this.videoElement = videoElement;
        
        this.overlayContainer = document.createElement('div');
        this.overlayContainer.style.position = 'absolute';
        this.overlayContainer.style.pointerEvents = 'none'; 
        this.overlayContainer.style.zIndex = '2147483647';  

        this.shadow = this.overlayContainer.attachShadow({ mode: 'closed' });
        this._injectHTML();
        document.body.appendChild(this.overlayContainer);

        // NOVO: Flag de controle do usuário
        this.isUserActive = true; 
        
        this.isTracking = true;
        this._trackPosition();
    }

    _injectHTML() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <style>
                .shield-box {
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    border: 3px solid #10b981; 
                    border-radius: 8px;
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                    position: relative;
                }
                .shield-badge {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    background: #10b981;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    transition: background-color 0.3s ease;
                }
                
                .risk-critical {
                    border-color: #ef4444; 
                    box-shadow: inset 0 0 30px rgba(239, 68, 68, 0.4), 0 0 15px rgba(239, 68, 68, 0.6);
                }
                .risk-critical .shield-badge {
                    background: #ef4444;
                    animation: pulse 1s infinite alternate;
                }

                @keyframes pulse {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0.85; transform: scale(1.05); }
                }
            </style>
            <div class="shield-box" id="border-box">
                <div class="shield-badge" id="badge-text">Autêntico</div>
            </div>
        `;
        this.shadow.appendChild(wrapper);
        this.borderBox = this.shadow.getElementById('border-box');
        this.badgeText = this.shadow.getElementById('badge-text');
    }

    // NOVO: Método oficial para ligar/desligar a UI
    toggleVisibility(isActive) {
        this.isUserActive = isActive;
        if (!isActive) {
            this.overlayContainer.style.display = 'none';
        }
    }

    _trackPosition() {
        if (!this.isTracking) return;

        if (!this.videoElement.isConnected) {
            this.destroy();
            return;
        }

        const rect = this.videoElement.getBoundingClientRect();

        // ATUALIZADO: Só mostra se tiver tamanho E se o usuário não tiver desligado
        if (rect.width > 50 && rect.height > 50 && this.isUserActive) {
            this.overlayContainer.style.display = 'block';
            this.overlayContainer.style.top = `${rect.top + window.scrollY}px`;
            this.overlayContainer.style.left = `${rect.left + window.scrollX}px`;
            this.overlayContainer.style.width = `${rect.width}px`;
            this.overlayContainer.style.height = `${rect.height}px`;
        } else {
            this.overlayContainer.style.display = 'none';
        }

        requestAnimationFrame(() => this._trackPosition());
    }

    updateThreatLevel(riskScore) {
        const percentage = (riskScore * 100).toFixed(0);

        if (riskScore > 0.70) {
            this.borderBox.classList.add('risk-critical');
            this.badgeText.innerText = `ALERTA IA: ${percentage}%`;
        } else {
            this.borderBox.classList.remove('risk-critical');
            this.badgeText.innerText = `Autêntico: ${percentage}%`;
        }
    }

    destroy() {
        this.isTracking = false;
        if (this.overlayContainer.parentNode) {
            this.overlayContainer.parentNode.removeChild(this.overlayContainer);
        }
    }
}
