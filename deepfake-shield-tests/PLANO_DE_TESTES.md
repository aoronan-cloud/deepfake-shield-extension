# Plano de Testes — Shield: Deepfake & AI Detector (v1.1.0)

Objetivo: validar que a extensão publicada (Chrome Web Store e Edge Add-ons,
v1.1.0) funciona corretamente com vídeo/áudio real antes de continuar o
desenvolvimento. Cobre 5 blocos: instalação, funcional básico, detecção
(o mais importante), performance/privacidade e compatibilidade.

Marque cada linha como `[ ]`, `[x]` (passou) ou `[!]` (falhou) durante o teste.
Anote observações na coluna certa — isso vira insumo para o próximo ciclo de dev.

---

## Bloco 1 — Instalação e permissões

| # | Caso de teste | Passos | Resultado esperado | Status | Observações |
|---|---|---|---|---|---|
| 1.1 | Instalação via loja (Chrome) | Instalar direto da Chrome Web Store | Instala sem erro, ícone aparece na barra | [ ] | |
| 1.2 | Instalação via loja (Edge) | Instalar direto do Edge Add-ons | Instala sem erro, ícone aparece na barra | [ ] | |
| 1.3 | Instalação modo desenvolvedor | Carregar pasta descompactada em `chrome://extensions` | Instala sem erro (útil para testar build local vs. publicado) | [ ] | |
| 1.4 | Permissão de câmera | Ao abrir uma chamada, extensão pede acesso à câmera | Prompt aparece, extensão funciona após aceitar | [ ] | |
| 1.5 | Permissão de microfone | Ao abrir uma chamada, extensão pede acesso ao microfone | Prompt aparece, extensão funciona após aceitar | [ ] | |
| 1.6 | Permissão negada | Negar permissão de câmera/mic | Extensão informa claramente que não pode funcionar, sem travar a página | [ ] | |

## Bloco 2 — Funcional básico (UI)

| # | Caso de teste | Passos | Resultado esperado | Status | Observações |
|---|---|---|---|---|---|
| 2.1 | Ícone/popup abre | Clicar no ícone da extensão | Popup abre mostrando status (ativo/inativo) | [ ] | |
| 2.2 | Ligar/desligar proteção | Alternar o toggle on/off | Estado muda e persiste ao recarregar a página | [ ] | |
| 2.3 | Indicador visual durante chamada | Entrar numa call com a extensão ativa | Algum indicador (badge, overlay) mostra que está monitorando | [ ] | |
| 2.4 | Sem chamada ativa | Abrir a extensão fora de uma videochamada | Não trava, mostra estado "aguardando" ou similar, sem tentar acessar câmera à toa | [ ] | |
| 2.5 | Múltiplas abas | Abrir Meet em duas abas ao mesmo tempo | Cada aba monitora independentemente, sem conflito | [ ] | |

## Bloco 3 — Detecção (núcleo do produto)

Este bloco depende dos vídeos de amostra (ver `amostras/README.md`). A ideia é
sempre comparar um caso **controle** (vídeo real, não deve disparar alerta) com
um caso **positivo** (deepfake conhecido, deve disparar alerta).

| # | Caso de teste | Entrada | Resultado esperado | Status | Observações |
|---|---|---|---|---|---|
| 3.1 | Vídeo real — controle negativo | Webcam real sua, ou clipe "real" do dataset | Nenhum alerta de deepfake | [ ] | |
| 3.2 | Deepfake de rosto conhecido (dataset) | Clipe do FaceForensics++/Celeb-DF/DFDC | Extensão detecta e alerta dentro de X segundos | [ ] | anotar tempo de reação |
| 3.3 | Áudio real — controle negativo | Sua própria voz, sem alteração | Nenhum alerta de clonagem de voz | [ ] | |
| 3.4 | Áudio com pitch/timbre alterado | Clipe gerado com alteração de tom (ver `amostras/README.md`) | Extensão sinaliza padrão de voz suspeito | [ ] | esse é um teste aproximado, não é clonagem real |
| 3.5 | Falso positivo — iluminação ruim | Webcam real, ambiente escuro/contraluz | Não deve alertar por causa só da má iluminação | [ ] | |
| 3.6 | Falso positivo — baixa qualidade de vídeo | Webcam com resolução baixa / conexão instável | Extensão não deve travar nem alertar incorretamente por causa da qualidade | [ ] | |
| 3.7 | Sem rosto no quadro | Câmera apontada para longe do rosto | Extensão não deve travar, idealmente informa "nenhum rosto detectado" | [ ] | |
| 3.8 | Múltiplos rostos no quadro | Duas pessoas na mesma câmera | Definir/verificar comportamento esperado (analisa todos? só o principal?) | [ ] | comportamento pode não estar definido ainda — documentar o que acontece |
| 3.9 | Tela compartilhada em vez de câmera | Compartilhar tela ao invés de vídeo da webcam | Extensão não deve tentar analisar a tela como se fosse rosto | [ ] | |

## Bloco 4 — Performance e privacidade (promessa central do produto)

| # | Caso de teste | Passos | Resultado esperado | Status | Observações |
|---|---|---|---|---|---|
| 4.1 | Zero chamadas de rede | Abrir DevTools → aba Network, durante uma análise ao vivo | Nenhuma requisição saindo para servidores externos com dados de vídeo/áudio | [ ] | crítico — é a promessa de privacidade do README |
| 4.2 | Uso de CPU/memória | Monitorar Gerenciador de Tarefas durante uma call de 10+ min | Uso de CPU/RAM estável, sem crescimento contínuo (vazamento de memória) | [ ] | |
| 4.3 | WebAssembly/WebGPU carrega | Verificar no console se o motor de IA inicializa sem erro | Sem erros de carregamento do modelo | [ ] | |
| 4.4 | Latência perceptível | Cronometrar do início da chamada até o primeiro veredito | Latência aceitável (definir um teto, ex: <5s) sem travar a UI da chamada | [ ] | |
| 4.5 | Chamada longa (estabilidade) | Deixar rodando por 30-60 min numa call real | Sem crash da extensão, sem crash da aba | [ ] | |

## Bloco 5 — Compatibilidade

| # | Caso de teste | Plataforma | Resultado esperado | Status | Observações |
|---|---|---|---|---|---|
| 5.1 | Google Meet | meet.google.com | Funciona conforme descrito no README | [ ] | |
| 5.2 | Microsoft Teams (web) | teams.microsoft.com | Funciona conforme descrito no README | [ ] | |
| 5.3 | WhatsApp Web | web.whatsapp.com | Funciona (mencionado no README) | [ ] | |
| 5.4 | Discord (web) | discord.com/app | Funciona (mencionado no README) | [ ] | |
| 5.5 | Chrome vs Edge — paridade | Repetir um mesmo teste do Bloco 3 nos dois navegadores | Mesmo comportamento em ambos | [ ] | |
| 5.6 | Versão publicada vs. build local | Repetir um teste do Bloco 3 na versão da loja e na versão local (`C:\Projetos\...`) | Comportamento igual, ou diferenças documentadas | [ ] | importante para saber se o repo está realmente alinhado com o publicado |

---

## Critério de "pronto para avançar"

Sugestão de barra mínima antes de seguir desenvolvendo:
- Blocos 1 e 2: 100% ok (são pré-requisitos básicos)
- Bloco 3: pelo menos 3.1, 3.2 e 3.3 passando (controle negativo + detecção positiva funcionando)
- Bloco 4.1 (zero chamadas de rede) sem falhas — é a promessa central de privacidade do produto
- Bloco 5.1 e 5.2 (Meet e Teams) funcionando, que são as plataformas destacadas no README

## Próximos passos depois do teste

1. Preencher a coluna "Observações" com o que quebrou.
2. Levar as falhas para o Claude Code no terminal (`C:\Projetos\deepfake-shield-extension`) para corrigir no código.
3. Depois de corrigir, gerar novo pacote e comparar de novo com a versão publicada (1.1.0) antes de decidir se sobe uma v1.2.0.
