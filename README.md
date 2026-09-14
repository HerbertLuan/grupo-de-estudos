# Grupo de Estudos — Backend Firebase

Backend completo para a plataforma privada de estudos competitivos **"Grupo de Estudos"**, construído exclusivamente sobre o ecossistema Google Firebase (Firebase Authentication, Cloud Firestore, Cloud Functions v2, Firebase Storage e Firebase Local Emulator Suite).

---

## 🎯 Regra Fundamental de Gamificação

- **60 minutos de estudo em um dia = 1 ponto**.
- **Limite absoluto**: Máximo de **1 ponto por usuário por dia**.
- Estudar 2 horas, 5 horas ou 10 horas continua concedendo exatamente 1 ponto diário.
- O tempo excedente é acumulado e computado para estatísticas, histórico, níveis de horas e ranking de horas.

---

## 📁 Estrutura do Projeto

```
c:\dev\grupo-de-estudos/
├── firebase.json              # Configuração do Firebase e portas dos Emuladores
├── firestore.rules            # Regras de segurança estritas do Cloud Firestore
├── storage.rules              # Regras de segurança do Firebase Storage
├── storage.cors.json          # Origens autorizadas a baixar arquivos no navegador
├── firestore.indexes.json     # Índices compostos para rankings e consultas
├── .env.example               # Template de variáveis de ambiente
├── .gitignore                 # Arquivos e pastas ignorados no versionamento
├── package.json               # Scripts raiz para execução, testes e emuladores
├── BACKEND_SPEC.md            # Especificação técnica completa (22 tópicos)
└── functions/                 # Código-fonte das Cloud Functions (TypeScript)
    ├── package.json           # Dependências e scripts das Functions
    ├── tsconfig.json          # Configurações do compilador TypeScript
    ├── scripts/
    │   └── seed.ts            # Script de inicialização e dados de demonstração
    ├── tests/
    │   └── backend.test.ts    # Suíte completa com 26 testes automatizados (Vitest)
    └── src/
        ├── index.ts           # Ponto de entrada e exportação das Cloud Functions
        ├── types/             # Interfaces de domínio e DTOs
        ├── config/            # Constantes, catálogo de níveis e badges
        ├── utils/             # Fuso horário (America/Sao_Paulo) e datas ISO
        └── services/
            ├── authService.ts         # Registro com apelido único e Auth
            ├── groupService.ts        # Grupo privado, código de convite e membros
            ├── timerService.ts        # Cronômetro, sessão única, consolidação e pontos
            ├── gamificationService.ts # Níveis, streak, badges idempotentes e feed
            ├── rankingService.ts      # Ranking com desempate por horas (semana/mês/geral)
            ├── statsService.ts        # Estatísticas e séries temporais para gráficos
            ├── socialService.ts       # Feed, curtidas atômicas e comentários
            └── auditService.ts        # Reconstrução e auto-cura dos dados agregados
```

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- **Node.js**: v20 ou v24 LTS instalado.
- **Java**: JRE/JDK 11+ (necessário para executar o emulador do Firestore).
- **Firebase CLI**: `npm install -g firebase-tools`.

### 2. Instalação das Dependências
```bash
cd functions
npm install
```

### 3. Compilar TypeScript
```bash
npm run build
```

### 4. Executar os Testes Automatizados
```bash
npm test
```
> Executa 26 testes cobrindo todas as regras de negócio: 59 min não gera ponto, 60 min gera 1 ponto, 2h/5h gera apenas 1 ponto, sessões fragmentadas, resiliência na queda de conexão, virada da meia-noite, streaks, desempate no ranking, curtidas e badges idempotentes.

### 5. Iniciar os Emuladores do Firebase
```bash
firebase emulators:start
```
- **Firebase Auth Emulator**: `http://localhost:9099`
- **Cloud Firestore Emulator**: `http://localhost:8080`
- **Cloud Functions Emulator**: `http://localhost:5001`
- **Firebase Storage Emulator**: `http://localhost:9199`
- **Emulator UI (Painel Gráfico)**: `http://localhost:4000`

### 6. Executar o Script de Seed
Com os emuladores rodando, em outro terminal:
```bash
cd functions
npm run seed
```
Isso criará:
- Catálogo de 8 níveis de estudo (Iniciante até Lendário)
- Catálogo de 7 badges gamificadas
- Temporada ativa ("Temporada Setembro 2026")
- Grupo privado ("Grupo de Estudos Alfa", código `ESTUDO10`)
- 10 usuários com pontuações e horas para simulação de ranking
- Post inicial no feed com curtidas e comentários

---

## ☁️ Como Fazer Deploy

1. Faça login na sua conta Google:
   ```bash
   firebase login
   ```
2. Associe ao seu projeto Firebase:
   ```bash
   firebase use <SEU_PROJECT_ID>
   ```
3. Realize o deploy completo:
   ```bash
   firebase deploy
   ```

4. Quando a configuração CORS do Storage mudar, aplique-a separadamente:
   ```bash
   gcloud storage buckets update gs://grupo-de-estudos-4b504.firebasestorage.app --cors-file=storage.cors.json
   ```

---

Para a especificação detalhada de cada endpoint, modelo de dados, regras e fluxos, consulte [BACKEND_SPEC.md](file:///c:/dev/grupo-de-estudos/BACKEND_SPEC.md).
