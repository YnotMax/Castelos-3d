# CASTLE ABOVE CLOUDS ☁️🏰
> **A DREAM IN THE SKY · REBUILT** — Experiência 3D PBR autônoma e em tempo real desenvolvida com Three.js, React 19 e Tailwind CSS.

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![Three.js](https://img.shields.io/badge/Three.js-0.186-black?style=flat&logo=three.js)](https://threejs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple?style=flat&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Visão Geral

**CASTLE ABOVE CLOUDS** é uma apresentação de produto e diorama interativo em tempo real de uma cidadela mágica no topo das nuvens. O projeto recria a estética de um sonho reconstruído: materiais PBR verossímeis em escala de diorama, iluminação lunar fria com sombras suaves, dezenas de janelas e lanternas incandescentes a 2.400 K com cintilação de velas e um arquipélago flutuante dinâmico.

---

## ✨ Destaques & Funcionalidades

### 🏰 Arquitetura do Castelo Central
- **Torre de Menagem Principal**: Mais de 35 metros de altitude, alvenaria em cantaria de pedra, reboco branco texturizado, espira cônica em terracota carmim e flâmula dourada ondulando ao vento.
- **Torre Redonda Anexa**: Torre cilíndrica com seteiras estreitas aquecidas e mirante panorâmico.
- **Ala Residencial dos Terraços**: Telhado em cobre oxidado verde (*patina*), varanda com floreiras e chaminé com fumaça aquecida.
- **Passarelas & Cordões de Luz**: Decks de madeira contornando o penhasco com dezenas de lâmpadas incandescentes (*fairy lights*) suspensas nos corrimãos.
- **Janelas Sólidas 3D**: Dezenas de janelas com molduras salientes e vidro emissivo cintilante, eliminando qualquer colisão ou *Z-fighting*.

### 🏝️ Arquipélago de 7 Ilhas Satélites Desobstruídas
Todas distribuídas em setores angulares exclusivos ao redor da ilha principal:
1. **Chalé do Vento Leste**: Casa de campo acolhedora com chaminé ativa e jardim suspenso.
2. **Aldeia Flutuante do Cais**: Povoado com casas gêmeas e píer projetado sobre o mar de nuvens.
3. **Atalaia do Sul**: Posto de vigia avançado com flâmula dourada.
4. **Pedra do Farol Solitário**: Monólito escarpado com uma única lanterna balançando sobre o vazio.
5. **Observatório das Estrelas**: Domo astronômico com anel giroscópico celestial dourado giratório.
6. **Residência do Mirante Ocidental**: Casa com alpendre e lampião acolhedor.
7. **Rochedo de Transição**: Ilhota escarpada com raízes pendentes e ancoradouro.

### ☁️ Nuvens Volumétricas 3D
- Substituição de planos 2D translúcidos por aglomerados esféricos volumétricos 3D com sombreamento suave PBR.
- Zero corte ou fatiamento de geometria em qualquer ângulo de visualização.

### 🎥 Sistema de Câmeras & Tour Cinematográfico
- **8 Ângulos de Câmera Pré-Configurados**: Acesso direto via menu lateral com enquadramentos sem nenhuma ilha bloqueando a visão.
- **Tour Cinematográfico Automático (72s)**: Voo panorâmico contínuo por todas as 7 ilhas com transições suaves e retorno à vista geral.
- **Interrupção Natural**: Arrasto do mouse para orbitar livremente e roda do mouse para zoom com amortecimento suave.

### 🎶 Áudio Ambiente Procedural (Web Audio API)
- Sintetizador sonoro integrado e 100% autônomo (sem dependência de arquivos externos).
- Simulação de brisa noturna de alta altitude e sinos etéreos pentatônicos.

### 📸 Modo Apresentação & Captura
- Botão para ocultar a interface para gravação limpa de vídeo.
- Captura instantânea de fotografias em alta resolução (download automático em PNG).

---

## 🛠️ Tecnologias Utilizadas

- **[Three.js](https://threejs.org/)**: Renderização 3D WebGL com materiais PBR (`MeshStandardMaterial`), sombras suaves (`PCFSoftShadowMap`), mapeamento de tons `ACESFilmicToneMapping` e iluminação em três pontos.
- **[React 19](https://react.dev/)**: Interface editorial e reativa.
- **[Vite 8](https://vitejs.dev/)**: Ferramenta de build rápida e leve.
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Estilização moderna com vidro escuro (*glassmorphism*).
- **[Lucide React](https://lucide.dev/)**: Ícones vetoriais.
- **Web Audio API**: Geração sonora processual em tempo real.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes `npm` ou `pnpm`

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/castle-above-clouds.git
cd castle-above-clouds

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Abra seu navegador em `http://localhost:3000`.

### Construção para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

---

## ☁️ Como Fazer Deploy na Vercel

O projeto já inclui o arquivo `vercel.json` configurado para deploy automático sem complicações.

### Opção 1: Via Painel da Vercel (Recomendado)
1. Suba o código para o seu repositório no **GitHub**.
2. Acesse [vercel.com](https://vercel.com) e faça login.
3. Clique em **Add New...** ➔ **Project**.
4. Importe o repositório `castle-above-clouds`.
5. As configurações de build são detectadas automaticamente:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Clique em **Deploy**.

### Opção 2: Via Vercel CLI

```bash
# Instale a CLI da Vercel globalmente
npm i -g vercel

# Execute o deploy
vercel
```

---

## 🎮 Controles Interativos

| Ação | Controle |
| :--- | :--- |
| **Orbitar Câmera** | Clicar e arrastar com o botão esquerdo do mouse / toque na tela |
| **Zoom** | Roda do mouse (*scroll*) / pinça no touch / botões `+` e `-` |
| **Redefinir Visão** | Botão de reset no canto inferior esquerdo |
| **Pausar/Retomar Tour** | Botão `Orbitar` no menu inferior |
| **Trocar Ângulo** | Menu suspenso de **Ângulos de Câmera** no canto superior direito |
| **Som Ambiente** | Botão de alto-falante (liga/desliga brisa noturna e sinos) |
| **Capturar Foto** | Ícone de câmera fotográfica (baixa arquivo PNG em alta resolução) |
| **Ocultar Interface** | Ícone de olho no canto superior direito (ideal para gravação de vídeo) |

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.
