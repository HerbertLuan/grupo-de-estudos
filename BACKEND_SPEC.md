# Especificação Técnica do Backend — "Grupo de Estudos"

Este documento é o guia definitivo de arquitetura, contratos de API, modelos de dados, regras de segurança e operação para o backend da plataforma gamificada privada "Grupo de Estudos", construída inteiramente sobre o ecossistema Google Firebase.

---

## 1. Arquitetura Geral

O backend adota o modelo Serverless desacoplado, seguro e reativo do Firebase:

```
[ Frontend: React + Vite ] (desenvolvimento futuro)
           │
           ├───────────────────────────────┐
           │ (HTTPS Callable via SDK)      │ (Firebase SDK Direto com Security Rules)
           ▼                               ▼
[ Cloud Functions v2 (Node.js/TS) ]   [ Firebase Authentication ]
    │ (Regras Críticas & Transações)       │ (Tokens JWT, UIDs, Password Hash)
    ├───────────────────┬──────────────────┘
    ▼                   ▼
[ Cloud Firestore ]  [ Firebase Storage ]
(Banco NoSQL)        (Fotos de Perfil / Avatares)
```

- **Frontend**: Consome Cloud Functions para operações transacionais críticas e o Firebase SDK direto com Firestore Security Rules para leituras reativas (`onSnapshot`).
- **Autenticação**: Firebase Authentication com senhas gerenciadas pelo Google (nunca armazenadas no Firestore).
- **Lógica de Negócio Privilegiada**: Cloud Functions v2 (TypeScript) usando transações ACID do Firestore e Admin SDK.
- **Armazenamento de Arquivos**: Firebase Storage para fotos de perfil em `avatars/{uid}/{fileName}`.

---

## 2. Modelo Completo do Firestore

O banco utiliza uma arquitetura híbrida de coleções raiz para entidades compartilhadas e subcoleções para dados particionados por usuário e post:

```
nicknames/{nicknameLower}                    [Doc: trava de unicidade de apelido]
users/{uid}                                  [Doc: perfil e agregados do usuário]
  ├── studySessions/{sessionId}              [Subcoleção: sessões individuais de estudo]
  ├── dailyStudy/{YYYY-MM-DD}                [Subcoleção: consolidado oficial diário]
  └── badges/{badgeId}                       [Subcoleção: badges conquistadas pelo usuário]
groups/{groupId}                             [Doc: configurações do grupo privado]
  └── members/{uid}                          [Subcoleção: participantes e agregados para ranking]
seasons/{seasonId}                           [Doc: temporadas competitivas]
levels/{levelId}                             [Doc: catálogo de níveis de horas]
badges/{badgeId}                             [Doc: catálogo de badges disponíveis]
feed/{postId}                                [Doc: publicações e conquistas no feed social]
  ├── likes/{uid}                            [Subcoleção: registro único de curtidas]
  └── comments/{commentId}                   [Subcoleção: comentários na publicação]
```

---

## 3. Relacionamentos

- **Usuário -> Grupo**: 1:N no modelo de dados conceitual, inicialmente 1:1 via `users/{uid}.groupId` e `groups/{groupId}/members/{uid}`.
- **Usuário -> Sessões**: 1:N em `users/{uid}/studySessions/{sessionId}`.
- **Usuário -> Estudo Diário**: 1:1 por dia em `users/{uid}/dailyStudy/{YYYY-MM-DD}`.
- **Usuário -> Badges Conquistadas**: 1:N em `users/{uid}/badges/{badgeId}` referenciando o catálogo raiz `badges/{badgeId}`.
- **Grupo -> Temporada**: 1:N via `groups/{groupId}.activeSeasonId`.
- **Feed -> Curtidas**: 1:N em `feed/{postId}/likes/{uid}` (chave primária é o UID, garantindo unicidade).
- **Feed -> Comentários**: 1:N em `feed/{postId}/comments/{commentId}`.

---

## 4. Estrutura das Coleções e Campos

### `nicknames/{nicknameLower}`
- `uid`: string (ID do proprietário do apelido)
- `nickname`: string (apelido com capitalização original)
- `createdAt`: Timestamp

### `users/{uid}`
- `uid`: string
- `name`: string
- `nickname`: string
- `avatarUrl`: string | null
- `groupId`: string | null
- `active`: boolean
- `activeSessionId`: string | null (aponta para a sessão em andamento ou pausada)
- `totalPoints`: number (pontos acumulados gerais)
- `totalStudySeconds`: number (segundos acumulados gerais)
- `currentStreak`: number (sequência atual de dias)
- `longestStreak`: number (recorde de sequência de dias)
- `lastCompletedDate`: string | null (formato `YYYY-MM-DD`)
- `levelId`: string ("iniciante", "aprendiz", etc.)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### `users/{uid}/studySessions/{sessionId}`
- `id`: string
- `userId`: string
- `groupId`: string
- `studyDate`: string (`YYYY-MM-DD` referente ao dia de início)
- `status`: `"active"` | `"paused"` | `"completed"` | `"discarded"`
- `startedAt`: Timestamp
- `lastResumedAt`: Timestamp | null
- `pausedAt`: Timestamp | null
- `endedAt`: Timestamp | null
- `accumulatedSeconds`: number
- `totalSeconds`: number
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### `users/{uid}/dailyStudy/{YYYY-MM-DD}`
- `id`: string (`YYYY-MM-DD`)
- `userId`: string
- `groupId`: string
- `date`: string (`YYYY-MM-DD`)
- `totalSeconds`: number (soma de todas as sessões do dia)
- `totalSessions`: number
- `pointEarned`: boolean (true se `totalSeconds >= 3600`)
- `pointEarnedAt`: Timestamp | null
- `updatedAt`: Timestamp

### `groups/{groupId}`
- `id`: string
- `name`: string
- `inviteCode`: string (código alfanumérico para entrada)
- `timezone`: string (`"America/Sao_Paulo"`)
- `ownerId`: string
- `memberCount`: number
- `activeSeasonId`: string | null
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### `groups/{groupId}/members/{uid}`
- `uid`: string
- `groupId`: string
- `name`: string
- `nickname`: string
- `avatarUrl`: string | null
- `role`: `"admin"` | `"member"`
- `joinedAt`: Timestamp
- `totalPoints`: number
- `totalStudySeconds`: number
- `weekPoints`: number
- `weekStudySeconds`: number
- `weekId`: string (`YYYY-Www`)
- `monthPoints`: number
- `monthStudySeconds`: number
- `monthId`: string (`YYYY-MM`)
- `seasonPoints`: number
- `seasonStudySeconds`: number
- `seasonId`: string | null
- `updatedAt`: Timestamp

### `seasons/{seasonId}`
- `id`: string
- `groupId`: string
- `name`: string
- `startDate`: string (`YYYY-MM-DD`)
- `endDate`: string (`YYYY-MM-DD`)
- `active`: boolean
- `createdAt`: Timestamp

### `levels/{levelId}`
- `id`: string
- `name`: string
- `requiredSeconds`: number
- `order`: number
- `icon`: string

### `badges/{badgeId}`
- `id`: string
- `name`: string
- `description`: string
- `icon`: string
- `ruleType`: `"first_point"` | `"streak"` | `"total_hours"` | `"total_points"` | `"rank_first"`
- `requirement`: number
- `active`: boolean

### `feed/{postId}`
- `id`: string
- `groupId`: string
- `userId`: string
- `userNickname`: string
- `userAvatarUrl`: string | null
- `type`: `"point_earned"` | `"streak_milestone"` | `"badge_unlocked"` | `"hours_milestone"` | `"manual_post"`
- `title`: string
- `message`: string
- `metadata`: map
- `likeCount`: number
- `commentCount`: number
- `createdAt`: Timestamp

---

## 5. Índices do Firestore (`firestore.indexes.json`)

Identificados e configurados para garantir consultas $O(\log N)$ sem leitura excessiva:
1. `groups/{groupId}/members`:
   - `totalPoints DESC`, `totalStudySeconds DESC` (Ranking Geral)
   - `weekPoints DESC`, `weekStudySeconds DESC` (Ranking Semanal)
   - `monthPoints DESC`, `monthStudySeconds DESC` (Ranking Mensal)
   - `seasonPoints DESC`, `seasonStudySeconds DESC` (Ranking Temporada)
2. `feed`:
   - `groupId ASC`, `createdAt DESC` (Linha do tempo do grupo)
3. `dailyStudy`:
   - `groupId ASC`, `date DESC` (Histórico de estudos por grupo)
4. `studySessions`:
   - `studyDate DESC`, `startedAt DESC` (Histórico cronológico de sessões)

---

## 6. Firestore Security Rules

Configuradas em `firestore.rules`:
- **Isolamento de privilégios**: Clientes autenticados não podem alterar `totalPoints`, `totalStudySeconds`, `currentStreak`, `longestStreak`, `levelId`, `activeSessionId` ou `pointEarned`.
- **Perfil do Usuário**: Atualizações diretas pelo cliente são limitadas exclusivamente aos campos `name`, `avatarUrl` e `updatedAt`.
- **Sessões e Registro Diário**: Leitura permitida para membros do grupo; escrita bloqueada para clientes (manipuladas exclusivamente via Cloud Functions com Admin SDK).
- **Feed Social**:
  - Leitura: membros autenticados.
  - Curtidas: o usuário só pode criar/deletar o documento com o seu próprio UID (`isOwner(likeUid)`).
  - Comentários: criação com validação de tamanho (1 a 500 caracteres) e autor; exclusão permitida apenas pelo autor.

---

## 7. Storage Security Rules

Configuradas em `storage.rules`:
- Caminho: `avatars/{uid}/{fileName}`
- **Leitura**: Usuários autenticados podem ler avatares de participantes do grupo.
- **Escrita e Exclusão**: Apenas o dono do perfil (`request.auth.uid == uid`).
- **Validação de Arquivo**: Tamanho máximo de 5MB e MIME type `image/*`.

---

## 8. Cloud Functions Implementadas

| Função | Tipo | Descrição |
|---|---|---|
| `register_user` | Callable | Validação de apelido único, criação no Auth e no Firestore |
| `create_group` | Callable | Criação de grupo com código de convite |
| `join_group_with_code` | Callable | Associação do usuário ao grupo via código |
| `get_group_members` | Callable | Lista membros do grupo ordenados |
| `start_study_session` | Callable | Inicia cronômetro com trava atômica de sessão única |
| `pause_study_session` | Callable | Pausa cronômetro e acumula segundos líquidos |
| `resume_study_session` | Callable | Retoma sessão pausada |
| `finish_study_session` | Callable | Finaliza sessão, processa ponto, streak, ranking, badges e feed |
| `discard_study_session` | Callable | Descarta sessão acidental sem contabilizar |
| `get_current_session` | Callable | Retorna estado preciso e reconstruído da sessão |
| `get_leaderboard` | Callable | Retorna ranking com filtros (semana, mês, geral, temporada, horas) e desempates |
| `get_user_stats` | Callable | Retorna métricas do usuário e séries temporais para gráficos |
| `get_user_history` | Callable | Retorna histórico de dias e pontos |
| `get_group_feed` | Callable | Retorna publicações do feed do grupo |
| `toggle_like_post` | Callable | Alterna curtida no post (máx. 1 por usuário) |
| `add_comment` | Callable | Adiciona comentário em postagem |
| `delete_comment` | Callable | Remove comentário (apenas autor) |
| `get_post_comments` | Callable | Lista comentários de uma postagem |
| `recalculate_user_stats` | Callable | Auditoria e auto-cura dos dados agregados a partir do histórico diário |

---

## 9. Regras de Negócio

1. **60 minutos = 1 ponto**: Atingir $\ge 3.600$ segundos acumulados no dia concede 1 ponto.
2. **Limite Absoluto**: Máximo de 1 ponto por usuário por dia. 2h, 5h ou 10h concedem exatamente 1 ponto. O tempo excedente continua acumulado para estatísticas, níveis e ranking de horas.
3. **Sessão Única**: É estritamente proibido possuir mais de uma sessão ativa ou pausada simultaneamente.
4. **Desempate do Ranking**:
   - 1º Critério: Total de Pontos (`DESC`)
   - 2º Critério: Total de Horas/Segundos Estudados (`DESC`)
   - 3º Critério: Ordem cronológica de entrada (`ASC`)
5. **Curtida Única**: Cada usuário só pode curtir uma postagem uma vez. Uma segunda chamada descurte.

---

## 10. Fluxo do Cronômetro

```
[ Frontend: Clica Iniciar ]
           │
           ▼
[ start_study_session ] ──(Verifica activeSessionId == null)──> [ Cria studySessions/{id} ]
                                                                [ user.activeSessionId = id ]
           │
   ┌───────┴────────┐
   ▼                ▼
[ Pausar ]     [ Continuar ]
   │                │
   ▼                ▼
[ Acumula tempo ] [ Define lastResumedAt ]
   │
   ▼
[ finish_study_session ] ──> [ Calcula tempo final ] ──> [ Atualiza dailyStudy ]
                             [ Libera activeSessionId ]
```

---

## 11. Fluxo de Conquista do Ponto

1. Ao chamar `finish_study_session`, a transação busca `users/{uid}/dailyStudy/{studyDate}`.
2. $\text{novoTotal} = \text{totalAnterior} + \text{segundosDaSessão}$.
3. Se $\text{novoTotal} \ge 3.600$ e $\text{pointEarned} == \text{false}$:
   - Marca `pointEarned = true` e `pointEarnedAt = serverTimestamp()`.
   - Incrementa `user.totalPoints += 1`.
   - Incrementa contadores periódicos do membro no grupo.
   - Avalia streak e badges.
   - Emite publicação comemorativa no feed.

---

## 12. Fluxo do Streak

- Um dia é considerado concluído quando $\text{totalSeconds} \ge 3.600$ (`pointEarned == true`).
- Ao completar no dia $D$:
  - Se $D == \text{lastCompletedDate}$: já completou hoje; mantém o valor.
  - Se $D$ for o dia seguinte a $\text{lastCompletedDate}$: $\text{currentStreak} += 1$.
  - Se houver intervalo de $\ge 2$ dias: $\text{currentStreak} = 1$.
  - $\text{longestStreak} = \max(\text{longestStreak}, \text{currentStreak})$.
- Em tempo real: se o usuário não completou ontem nem hoje, o streak efetivo é reportado como `0`.

---

## 13. Fluxo de Badges

Badges são avaliadas de forma estritamente idempotente dentro da transação de encerramento da sessão:
- Verifica se `users/{uid}/badges/{badgeId}` já existe.
- Se não existir e o critério for atingido (ex: 7 dias de streak, 50 horas, 100 pontos), cria o documento na subcoleção do usuário e publica automaticamente um evento comemorativo no feed.

---

## 14. Estrutura das Temporadas

- Representadas por `seasons/{seasonId}`.
- Contêm `startDate` e `endDate` no formato `YYYY-MM-DD`.
- Os membros possuem contadores `seasonPoints` e `seasonStudySeconds` associados ao `seasonId` ativo do grupo.
- A pontuação histórica geral nunca é apagada ao término ou mudança de temporada.
- Ciclo: `status: draft | active | closed`, com `active` mantido para compatibilidade. Criação e transições exigem `role: admin` na associação do grupo.
- Callables: `create_season({groupId, name, startDate, endDate})`, `start_season({seasonId})`, `close_season({seasonId})`.
- O início é manual, dentro do intervalo previsto, e exige ausência de outra temporada ativa. Uma transação atualiza o grupo, a temporada e zera `seasonPoints`/`seasonStudySeconds` de todos os membros, associando o novo `seasonId`. `totalPoints` e `totalStudySeconds` permanecem intactos.
- A data final é inclusiva no fuso do grupo. `close_expired_seasons` verifica a cada cinco minutos, com retentativas. O cronômetro bloqueia créditos de temporada fora das datas mesmo se o agendador atrasar.
- São elegíveis sessões iniciadas depois de `startedAt` e finalizadas enquanto a temporada está ativa e dentro das datas. Sessões que atravessam o início ou o encerramento contam apenas no histórico geral. O registro diário guarda `seasonId`, `seasonSeconds` e `seasonPointEarned` para conceder no máximo um ponto por dia/temporada, sem aproveitar minutos de ciclos anteriores.
- Encerramento transacional e idempotente: salva `closedAt` e `podium` (snapshot dos três melhores participantes com tempo positivo), limpa `activeSeasonId`, concede `users/{uid}/badges/season_{seasonId}` e cria `feed/season_{seasonId}` com tipo `season_closed`. Desempate: pontos DESC, segundos DESC, entrada no grupo ASC, UID ASC. Grupos com menos de três participantes recebem apenas as posições disponíveis.
- O pódio arquivado é imutável pelas APIs; novas temporadas não o recalculam. Apenas membros do grupo leem suas temporadas nas regras Firestore.
- Interface: `/seasons`, acessível pelo ranking, com administração, arquivo, pódio e confetes (respeitando preferência de movimento reduzido). Troféus aparecem no perfil.
- Testes de integração: com Firestore Emulator ativo, executar `npm --prefix functions test -- --testTimeout=30000`, definindo `FIRESTORE_EMULATOR_HOST` e `GCLOUD_PROJECT` para um projeto local `demo-*`. Sem emulador, esses testes são ignorados; testes unitários continuam executando.

---

## 15. Operações Disponíveis para o Frontend

O frontend em React/Vite consumirá o backend das seguintes formas:

### Chamadas de Função (Cloud Functions):
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app, 'southamerica-east1');

// Exemplo: Iniciar Sessão
const startSession = httpsCallable(functions, 'start_study_session');
const result = await startSession();

// Exemplo: Finalizar Sessão
const finishSession = httpsCallable(functions, 'finish_study_session');
const finishResult = await finishSession();

// Exemplo: Obter Leaderboard
const getLeaderboard = httpsCallable(functions, 'get_leaderboard');
const ranking = await getLeaderboard({ groupId: 'demo-group', period: 'week' });
```

---

## 16. Exemplos de Chamadas e Retornos

### Iniciar Sessão (`start_study_session`)
**Entrada:** Nenhuma (usa token do usuário autenticado).
**Retorno:**
```json
{
  "id": "session-xyz",
  "userId": "user-123",
  "groupId": "demo-group",
  "studyDate": "2026-09-08",
  "status": "active",
  "startedAt": { "_seconds": 1788899000, "_nanoseconds": 0 },
  "accumulatedSeconds": 0,
  "totalSeconds": 0
}
```

### Finalizar Sessão (`finish_study_session`)
**Retorno:**
```json
{
  "sessionId": "session-xyz",
  "studyDate": "2026-09-08",
  "sessionSeconds": 3600,
  "dailyTotalSeconds": 3600,
  "pointEarnedNow": true,
  "totalPoints": 15,
  "currentStreak": 4,
  "newBadgesCount": 1
}
```

### Obter Leaderboard (`get_leaderboard`)
**Entrada:** `{ "groupId": "demo-group", "period": "week" }`
**Retorno:**
```json
{
  "period": "week",
  "groupId": "demo-group",
  "totalMembers": 10,
  "entries": [
    {
      "rank": 1,
      "uid": "user-joao",
      "name": "João Silva",
      "nickname": "joao_estudos",
      "avatarUrl": null,
      "points": 5,
      "studySeconds": 59040,
      "studyHours": 16.4,
      "levelName": "Disciplinado",
      "currentStreak": 12
    }
  ]
}
```

---

## 17. Variáveis de Ambiente

Arquivo `.env.example`:
```ini
FIREBASE_PROJECT_ID=grupo-de-estudos-dev
FIREBASE_STORAGE_BUCKET=grupo-de-estudos-dev.appspot.com
DEFAULT_TIMEZONE=America/Sao_Paulo
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

---

## 18. Configuração do Firebase e Emuladores

O arquivo `firebase.json` está configurado para o Local Emulator Suite:
- **Auth**: porta `9099`
- **Firestore**: porta `8080`
- **Functions**: porta `5001`
- **Storage**: porta `9199`
- **Emulator UI**: porta `4000`

---

## 19. Como Executar Localmente

1. **Instalar dependências**:
   ```bash
   cd c:\dev\grupo-de-estudos\functions
   npm install
   ```
2. **Compilar TypeScript**:
   ```bash
   npm run build
   ```
3. **Executar a suíte de testes**:
   ```bash
   npm test
   ```
4. **Iniciar os Emuladores do Firebase**:
   ```bash
   firebase emulators:start
   ```
5. **Executar o script de seed no banco local**:
   ```bash
   npm run seed
   ```

---

## 20. Como Fazer Deploy para Produção

1. Faça login no Firebase CLI:
   ```bash
   firebase login
   ```
2. Selecione o projeto criado no console do Firebase:
   ```bash
   firebase use seu-projeto-firebase
   ```
3. Realize o deploy completo de regras, índices e Cloud Functions:
   ```bash
   firebase deploy
   ```
   Ou por serviço:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   firebase deploy --only storage:rules
   firebase deploy --only functions
   ```
