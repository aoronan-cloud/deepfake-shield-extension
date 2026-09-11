# voice_detector.onnx — atribuição

Este modelo é uma conversão para ONNX (opset 18, pesos idênticos, sem
alterações de arquitetura) do checkpoint pré-treinado **AASIST**
("AASIST.pth"), publicado pela NAVER Corp.

- Projeto original: https://github.com/clovaai/aasist
- Paper: "AASIST: Audio Anti-Spoofing using Integrated Spectro-Temporal
  Graph Attention Networks" (Jung et al., 2021)
- Licença: MIT — Copyright (c) 2021-present NAVER Corp.
- Treinado no dataset ASVspoof2019 LA.

Convenção de saída do modelo: `output` é um tensor `[batch, 2]` de
logits, onde o índice `1` corresponde à classe "bonafide" (voz real) e
o índice `0` à classe "spoof" (voz sintética/clonada) — confirmado em
`evaluation.py` do repositório original (`batch_score = batch_out[:, 1]`
usado como score de voz genuína).

Entrada esperada: forma de onda bruta em mono, 16kHz, `nb_samp = 64600`
amostras (~4.04s) por inferência.
