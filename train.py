# train.py
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
import torch.onnx
import os

# 1. Configurações da Forja
DATA_DIR = 'dataset'
EPOCHS = 3 # 3 épocas são suficientes para um protótipo rápido
BATCH_SIZE = 16

print("[Shield ML] Iniciando pipeline de Transfer Learning...")

# 2. Preparação Matemática das Imagens (Tensores)
# Transformamos as fotos em matrizes exatas de 224x224 pixels e normalizamos as cores
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# O PyTorch lê as pastas 'fake' e 'real' e já entende as classes
dataset = datasets.ImageFolder(root=DATA_DIR, transform=transform)
dataloader = torch.utils.data.DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

print(f"[Shield ML] Classes detectadas nas pastas: {dataset.classes}")

# 3. O Cérebro Base (MobileNetV2)
print("[Shield ML] Baixando cérebro genérico (MobileNetV2)...")
# Usamos weights='DEFAULT' para pegar a versão mais inteligente disponível
model = models.mobilenet_v2(weights='DEFAULT')

# Congelar as camadas antigas (não queremos desaprender o que é luz e sombra)
for param in model.parameters():
    param.requires_grad = False

# Cirurgia: Trocar a última camada (que tinha 1000 saídas) por apenas 2 (Fake e Real)
model.classifier[1] = nn.Linear(model.last_channel, 2)

# 4. O Treinamento (Motor de Otimização)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)

print("[Shield ML] Iniciando treinamento na CPU. O forno está ligado...")
for epoch in range(EPOCHS):
    total_loss = 0
    for i, (images, labels) in enumerate(dataloader):
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        
        # Mostra o progresso a cada 10 lotes processados
        if i % 10 == 0:
            print(f"   Lote {i}/{len(dataloader)} processado...")

    print(f"[Shield ML] Época {epoch+1}/{EPOCHS} concluída - Margem de Erro (Loss): {total_loss/len(dataloader):.4f}")

# 5. Exportação (O Nascimento do ONNX)
print("\n[Shield ML] Empacotando o modelo treinado para a extensão web...")
model.eval() # Trava o modelo em modo de leitura

# Criamos uma imagem falsa de ruído estático apenas para o exportador entender o formato
dummy_input = torch.randn(1, 3, 224, 224)

output_path = "face_detector_custom.onnx"
torch.onnx.export(
    model, 
    dummy_input, 
    output_path, 
    export_params=True, 
    input_names=['data'],   # Nome da porta que já configuramos no JavaScript
    output_names=['output']
)

print(f"[Shield ML] SUCESSO ABSOLUTO! Arquivo '{output_path}' gerado e pronto para uso.")
