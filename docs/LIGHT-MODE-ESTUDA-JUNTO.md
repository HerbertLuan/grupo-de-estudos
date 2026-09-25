# Estuda Junto — temas claro e escuro

Branch: `codex/light-mode-estuda-junto`, baseada em `feature/redesign-estuda-junto`, commit `dcdb73911fbaa5824e3be31e36f7aa511626be03`.

## Contrato de implementação

- Tema efetivo em `html[data-theme="light"]` ou `html[data-theme="dark"]`.
- Preferência `system | light | dark`, persistida em `localStorage["estuda-junto-theme"]`; ausência ou valor inválido segue o sistema. Bootstrap síncrono em `web/public/theme.js`, antes do React e das folhas de estilo. Alterações do sistema e de outras abas são observadas.
- Tokens centralizados em `web/src/styles/themes.css`; os nomes Tailwind existentes continuam disponíveis via `@theme` em `index.css`. CSS por domínio consome tokens, sem criar folhas duplicadas para o modo claro.
- Superfícies: `--color-bg-primary` (página), `--color-bg-secondary` (card/modal), `--color-bg-tertiary` (controle/hover), `--color-bg-quaternary` (pressionado).
- Textos: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`; links usam `--ej-text-link` / `--ej-text-link-hover`. Texto sobre ação preenchida: `--ej-on-action`.
- Ações: `--color-accent-primary`, `--color-accent-primary-hover`, `--ej-action-active`; bordas `--color-border`, `--ej-border-strong`, `--ej-border-input`; foco `--ej-focus`.
- Estados: `--color-accent-success`, `--color-accent-warning`, `--color-accent-danger` são cores legíveis de texto/ícone. Fundos: `--ej-success-soft`, `--ej-warning-soft`, `--ej-danger-soft`; bordas: `--ej-success-border`, `--ej-warning-border`, `--ej-danger-border`.
- Tons: `--ej-blue`, `--ej-blue-soft`, `--ej-purple`, `--ej-purple-soft`, `--ej-neutral-soft`, `--ej-like`; amarelo decorativo continua `--color-brand-yellow` (#F4C415), não usar amarelo puro como texto sobre branco.
- Suporte: `--ej-overlay`, `--ej-progress-track`, `--ej-skeleton`, `--ej-placeholder`, `--ej-scrollbar`; gráficos `--ej-chart-blue`, `--ej-chart-error`, `--ej-chart-award`, `--ej-chart-grid`.
- Conquistas: `--ej-award-surface` e `--ej-award-border` destacam o primeiro colocado e a temporada ativa; creme claro no tema claro e azul-marinho no escuro.
- Painéis de marca usam `--ej-hero-bg`, `--ej-hero-text`, `--ej-hero-muted`, `--ej-hero-border`, `--ej-hero-decoration`, `--ej-hero-accent` (marinho no escuro, azul muito suave no claro). A logo permaneceu intacta na implementação inicial do tema; a substituição posterior está registrada abaixo.
- Novas necessidades de tokens devem ser comunicadas ao principal para inclusão centralizada. Cores de matérias/dados do usuário são preservadas.

## Responsabilidade de arquivos

- Principal: `index.css`, `styles/themes.css`, `components/ui/*`, navegação/layout (exceto `auth.css`), bootstrap e preferência visual, integração, testes e este relatório.
- Estudo/acesso: páginas Login/Register/JoinGroup/Study/Subjects/Admin, `pages/study-redesign.css`, `components/study/*`, `components/admin/*`, `components/layout/auth.css`.
- Progresso/competição: páginas Ranking/Seasons/Progress/UserProgress, `pages/ranking-redesign.css`, `components/ranking/*`, `components/progress/*`.
- Comunidade/perfil: páginas Feed/Profile/EditProfile, `components/feed/*`, `components/profile/*`, `styles/social-redesign.css` (também contém composição de progresso; coordenar mudanças com o agente de progresso).

## Preservação

Não alterar autenticação, serviços, hooks de negócio/cronômetro, tipos, Firebase, backend, regras ou pontuação. Não criar dados ou páginas fictícias. Os problemas anteriores continuam registrados em `REDESIGN-ESTUDA-JUNTO.md`. Sem merge; a publicação posterior ficou restrita ao Hosting de homologação.

## Entrega integrada

O principal definiu o contrato antes de delegar a três subagentes nas áreas acima. A integração manteve uma única estrutura de componentes e CSS por domínio, com valores de cor centralizados. O tema claro utiliza página #F4F6FA, cards #FFFFFF, texto principal #0B1B3B e ações #2F63E8. Painéis de foco/marca recebem azul muito suave; pódio e conquistas usam amarelo com moderação. O escuro mantém a composição azul-marinho. Montserrat e Inter foram preservadas.

O controle nativo “Tema” oferece Sistema, Claro e Escuro na sidebar, no menu mobile “Mais” e nas telas de acesso. Possui label, teclado nativo e altura mínima de 44 px. Retornar a Sistema remove a preferência explícita. O bootstrap tolera falhas de armazenamento, aplica `color-scheme` aos controles nativos e atualiza a cor da barra do navegador. A escolha é local ao navegador, sem gravação no perfil ou Firebase.

Tokens de texto interativo são distintos da ação preenchida. Estados de sucesso, atenção, erro, curtida e conquista usam texto legível em ambos os temas. Foram adaptados controles, focos, hover/active/disabled, inputs, cronômetro, toasts, skeletons, diálogos, sheets, cards, pódios, séries de gráficos, tooltips e legendas. Cores pessoais de matérias continuam sendo dados do usuário; tooltips usam texto semântico e marcadores de cor.

## Arquivos alterados

| Área | Arquivos (relativos à raiz) |
| --- | --- |
| Tokens e preferência | `web/src/styles/themes.css`, `web/src/index.css`, `web/public/theme.js`, `web/index.html`, `web/src/components/ui/ThemeSelect.tsx` |
| Compartilhados e navegação | `web/src/components/ui/ErrorState.tsx`, `web/src/components/layout/AuthLayout.tsx`, `DesktopSidebar.tsx`, `BottomNavigation.tsx`, `auth.css` |
| Estudo e acesso | `web/src/pages/study-redesign.css`, `SubjectsPage.tsx`, `AdminPage.tsx`; `web/src/components/study/TimerModeSelector.tsx`, `SessionDetailsModal.tsx`, `LongStudySessionModal.tsx`, `PointCelebration.tsx`; `web/src/components/admin/SeasonManagement.tsx` |
| Progresso e competição | `web/src/pages/ranking-redesign.css`, `SeasonsPage.tsx`; `web/src/components/progress/progress.css`, `ProgressCharts.tsx`, `StudyChart.tsx`, `SubjectProgress.tsx`, `HistoryList.tsx`, `HistorySection.tsx` |
| Comunidade e perfil | `web/src/styles/social-redesign.css`; `web/src/components/feed/StudyStories.css`, `StudyStories.tsx`, `CommentSheet.tsx`, `LikesModal.tsx`; `web/src/pages/EditProfilePage.tsx` |
| Testes e documentação | `web/package.json`, `web/tests/theme.test.mjs`, `web/tests/theme-contrast.test.mjs`, este relatório |

Páginas sem alteração direta em TSX, como login, cadastro, dashboard, ranking, feed e perfil, recebem os temas pelos layouts, componentes e estilos compartilhados. `DesignSystem.tsx` mantém sua API; suas primitives foram adaptadas por `index.css`.

## Validação final — 24/09/2026

- `npm --prefix web run build`: aprovado; permanece o aviso anterior de chunk acima de 500 kB (Firebase).
- `npm --prefix web run lint`: zero erros; os mesmos 19 avisos preexistentes.
- `npm --prefix web run test`: **8 testes aprovados**. Seis verificam preferência inicial, precedência da escolha, recarga, alterações do sistema, storage indisponível/inválido, sincronização entre abas e inscrições do React. Dois grupos verificam **78 pares de contraste**: textos ≥4,5:1; foco, borda dos campos e cores informativas dos gráficos ≥3:1.
- `npm --prefix functions run build`: aprovado, sem mudanças na fonte do backend.
- Suíte existente com Auth/Firestore/Storage emulados: **65 testes aprovados em 8 arquivos**, com timeout de 30 s. A primeira execução não informou o bucket ao processo de testes e teve 7 falhas de configuração; a execução com `FIREBASE_CONFIG` completo passou sem alterar testes existentes ou backend.
- `git diff --check`: aprovado. Nenhuma alteração em serviços, hooks, autenticação, tipos, configuração Firebase, regras ou Cloud Functions. Nenhuma dependência adicionada.
- Na implementação inicial do tema, a logo foi preservada byte a byte, SHA-256 `63C60F49B71EB6E1B1B5149E2D30FDD138EE6DAD4D1BDF7101B4361CBFDF7427`. Ela foi substituída posteriormente a pedido do usuário.

### Matriz responsiva

As 13 rotas foram carregadas nos temas claro e escuro em cada dimensão abaixo: **130 combinações de rota/tema/tamanho, sem overflow horizontal do documento**. As rotas autenticadas utilizaram contas e registros já existentes no projeto local `demo-estuda-junto-redesign`. Não foi executado seed nem criada página, conteúdo fictício ou série estática para simular a interface. A suíte de regressão utiliza suas próprias fixtures locais de teste.

| Formato | Viewport |
| --- | --- |
| Celular pequeno | 320 × 740 |
| Celular grande | 430 × 932 |
| Tablet | 768 × 1024 |
| Notebook | 1366 × 768 |
| Desktop | 1920 × 1080 |

Rotas: `/login`, `/register`, `/join-group`, `/`, `/ranking`, `/seasons`, `/progress`, `/progress/user-maria` (rota `/progress/:uid`), `/subjects`, `/feed`, `/profile`, `/profile/edit`, `/admin`.

### Interações verificadas

- Login real da conta local existente, guard e logout; apresentação de cadastro e formulários de entrada/criação de grupo, com ações vazias desabilitadas quando previsto. Não foram criadas contas ou grupos.
- Troca imediata do tema no desktop/mobile, persistência de Claro e Escuro após reload, sincronização em duas abas e retorno a Sistema. Teste automatizado do bootstrap verifica a aplicação antes do React; não houve medição por filmagem da primeira pintura.
- Menu “Mais”, navegação, Escape e restauração de foco. Seletor nativo com label e alvo de 44 px; link de avatar da topbar ampliado para 44 px.
- Ranking geral/temporada, setas de teclado nos tabs, pódio e abertura do progresso de Maria pelo segundo colocado.
- Gráficos próprio/público, abertura de modal, períodos e intervalo personalizado; sheet em 320 px, Tab/Shift+Tab, Escape e retorno ao acionador.
- Feed existente, abertura de comentários e curtidas; comentários claro/mobile e escuro/desktop, campo vazio com envio desabilitado e foco contido no diálogo. Nenhuma mensagem enviada.
- Perfil, conquistas, edição e campo de apelido desabilitado; sem salvar alterações ou enviar foto.
- Matérias e administração com catálogo vazio; formulário de temporada e confirmação de encerramento aberta e cancelada, sem encerrar a temporada.
- Cronômetro/temporizador, presets, configuração personalizada em 320 px e tentativa de início. O erro do emulador abaixo impediu o ciclo completo.

## Limitações e achados separados

1. `start_study_session` retornou `INTERNAL [500]` no navegador local, mesmo sintoma do relatório anterior. Pausar/retomar/finalizar, revisão longa e celebração de ponto não puderam ser validados de ponta a ponta nesta execução; o código visual desses estados foi revisado e os testes de serviço passaram. Não foi alterado backend ou hook para contornar o problema.
2. Os registros disponíveis não contêm matérias cadastradas, séries por matéria, stories ativos/fotos ou temporadas encerradas. Paleta de matérias, barras/tooltips com séries reais, viewer/composer/reactions de stories e celebração de pódio histórico receberam revisão de código/tokens, mas não homologação visual com conteúdo pelo navegador. Não foram fabricados registros para preencher esses estados.
3. A fórmula anterior de `LevelProgress` foi preservada; o perfil local exibiu “Faltam -64h”. O fluxo de logout continua disponível somente em `/join-group`, conforme o relatório anterior.
4. **Achado por inspeção, separado desta implementação:** `CommentSheet` não captura rejeições de envio/exclusão e `useFeed` propaga essas falhas; pode faltar feedback local de erro. Nenhuma correção funcional foi aplicada e não foi provocada falha com envio de comentário.
5. A validação responsiva foi feita no navegador Chromium do aplicativo, com viewports simuladas. Não houve teste em dispositivos físicos, Safari/iOS ou leitor de tela. A matriz de 130 combinações foi executada localmente; o smoke test após o deploy foi mais restrito.

## Deploy em homologação — 24/09/2026

Publicação da branch `codex/light-mode-estuda-junto` em [Firebase Hosting de homologação](https://grupo-de-estudos-homologacao.web.app/), com `node node_modules/firebase-tools/lib/bin/firebase.js deploy --only hosting -P homologacao --non-interactive`. O projeto configurado em `.firebaserc` e `VITE_FIREBASE_PROJECT_ID` do build é `grupo-de-estudos-homologacao`; `VITE_USE_FIREBASE_EMULATOR=false`. O deploy de 40 arquivos foi concluído pelo Firebase. Cloud Functions, regras, índices, Storage e produção não foram publicados; sem merge ou push.

Antes da primeira publicação, `npm --prefix web run build:homolog` e os 8 testes de tema passaram; lint concluiu sem erros, com os mesmos 19 avisos. O pacote contém `theme.js`; naquela publicação, a logo ainda tinha o mesmo SHA-256 do original.

No endereço publicado, a sessão de homologação existente abriu estudo, progresso, comunidade e perfil. O seletor mobile aplicou Claro e Escuro imediatamente e preservou cada escolha após recarregar; foi restaurado a Sistema ao final. Não houve rolagem horizontal nas páginas verificadas. Essa checagem não substitui a matriz responsiva local nem cobre novamente o fluxo completo do cronômetro ou interações que gravam dados.

## Substituição da logo e nova publicação — 24/09/2026

Após o primeiro deploy, o usuário forneceu uma nova logo em PNG com transparência já presente (alfa zero fora da arte). `web/public/brand/estuda-junto.png` foi substituído pelos mesmos bytes do anexo, SHA-256 `05CCE5A6F40DFAD03E5DAFF686159188829E3B25FDD62017C34E3B4C990B07AC`. O componente passou a informar as dimensões intrínsecas corretas, 1672 × 941. O CSS removeu o fundo branco e o recorte da logo anterior; a arte mantém a proporção original. O URL da imagem e do favicon recebeu uma versão curta baseada no hash para evitar cache da logo antiga.

O layout foi inspecionado localmente no tema claro em desktop e celular de 320 px, sem rolagem horizontal. `npm --prefix web run build:homolog` e os 8 testes de tema passaram; lint concluiu sem erros, mantendo os 19 avisos anteriores. O segundo deploy também se limita ao Firebase Hosting de homologação.

## Reproduzir

```powershell
npm --prefix web run test
npm --prefix web run lint
npm --prefix web run build

$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
$env:FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
$env:FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199'
$env:GCLOUD_PROJECT = 'demo-estuda-junto-redesign'
$env:FIREBASE_CONFIG = '{"projectId":"demo-estuda-junto-redesign","storageBucket":"demo-estuda-junto-redesign.appspot.com"}'
npm --prefix functions run test -- --testTimeout=30000
```

O último comando pressupõe os emuladores locais ativos. Nenhum merge ou push foi realizado.
