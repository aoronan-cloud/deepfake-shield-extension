# Vídeos de amostra para o teste de detecção (Bloco 3)

Para testar de verdade se a extensão detecta deepfakes, você precisa de dois
tipos de clipe: **controle** (rosto/voz reais, não deve alertar) e
**positivo** (deepfake conhecido, deve alertar). Não recomendo criar
deepfakes novos de pessoas reais para esse teste — além de ser trabalho
extra, datasets acadêmicos já existem exatamente para isso, com consentimento
e curadoria.

## 1. Clipes de controle (real) — fáceis de conseguir você mesmo

- Grave 30-60s da sua própria webcam em condições normais (Meet/Teams/OBS).
- Grave também 1-2 variações: pouca luz, contraluz, ângulo ruim — servem
  para os testes de falso positivo (3.5, 3.6 do plano de testes).
- Para o controle de voz (3.3), uma gravação normal da sua voz falando basta.

## 2. Clipes deepfake conhecidos — datasets de pesquisa

Estes são os datasets padrão da indústria para treinar e **testar
detectores** de deepfake — construídos justamente para esse fim, com
consentimento dos atores/sujeitos e curadoria acadêmica. Todos pedem um
cadastro simples (uso restrito a pesquisa/teste, não redistribuição):

| Dataset | O que tem | Link para solicitar acesso |
|---|---|---|
| FaceForensics++ | Face-swap e reenactment, vários métodos, boa cobertura de qualidade | https://github.com/ondyari/FaceForensics |
| Celeb-DF (v2) | Deepfakes de alta qualidade, bastante usado como benchmark difícil | https://github.com/yuezunli/celeb-deepfakeforensics |
| DFDC (Deepfake Detection Challenge, Meta/AWS) | Maior dataset público, bem variado | https://ai.meta.com/datasets/dfdc/ |
| DeeperForensics-1.0 | Foco em variações realistas (compressão, ruído, iluminação) | https://github.com/EndlessSora/DeeperForensics-1.0 |

Baixe alguns clipes curtos de cada um (não precisa do dataset inteiro — 5-10
clipes já dá para validar o Bloco 3). Guarde localmente em algo como:

```
amostras/
├── real/       ← seus clipes de controle
└── deepfake/   ← clipes baixados dos datasets acima
```

## 3. Áudio "voz alterada" (teste aproximado, item 3.4)

Isso **não é clonagem de voz real** — é só um jeito rápido e não-invasivo de
gerar um clipe com timbre/pitch diferente do original, para ver se a
extensão pelo menos reage a uma voz "fora do padrão" registrado. Não usa a
voz de nenhuma pessoa real além da sua própria gravação, só um efeito de
pitch/formante em cima dela.

```bash
# usando ffmpeg (já cobre a maioria dos casos)
ffmpeg -i real/minha_voz.wav -af asetrate=44100*0.85,aresample=44100 deepfake/voz_pitch_alterado.wav
```

Isso é suficiente para o teste 3.4 do plano — não tente reproduzir a voz de
outra pessoa específica sem o consentimento dela; para testar clonagem de
voz "de verdade" contra vozes de terceiros, use datasets acadêmicos
equivalentes (ex: ASVspoof — https://www.asvspoof.org/) em vez de gerar você mesmo.

## 4. Convertendo para o formato que o Chrome aceita como "webcam falsa"

Ver `scripts/preparar-video.md` — precisa converter os `.mp4` para `.y4m`
(vídeo) e `.wav` (áudio) para usar no script de automação do Playwright.
