# Estuda Junto — redesign do frontend

Branch: `feature/redesign-estuda-junto`.
Base analisada: `main`, commit `eb16c78`.

## Arquitetura preservada

O frontend usa React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router, Framer Motion e Recharts. São 13 páginas com componentes por domínio (`study`, `ranking`, `feed`, `profile`, `progress`, `admin`), serviços e hooks separados.

A autenticação continua por apelido/senha no Firebase Auth, com perfil em tempo real no Firestore. `AuthContext`, guards de rotas, grupos privados, permissões administrativas, Cloud Functions, Storage, regras e índices não foram modificados. Os hooks de cronômetro, configurações persistidas e notificações também foram preservados.

Regras mantidas: 60 minutos garantem no máximo 1 ponto diário; tempo excedente conta nas estatísticas; pausa/retomada/finalização, virada do dia, revisão de sessões longas, detalhes de matéria/questões, ranking e encerramento de temporadas continuam usando os contratos originais.

A aplicação tinha somente tema escuro. O redesign mantém esse suporte, agora com superfícies azul-marinho. Não havia rotas de recuperação de senha, equipes ou central de notificações; nenhuma tela ou dado fictício foi criado para simulá-las. O mobile é a experiência web responsiva, pois não há projeto de aplicativo nativo neste repositório.

## Cobertura das telas

| Rota | Reformulação |
| --- | --- |
| `/login` | Composição editorial de marca, formulário acessível e mostrar/ocultar senha |
| `/register` | Onboarding visual consistente, campos identificados e feedback |
| `/join-group` | Entrar por convite/criar grupo, mesma estrutura de acesso |
| `/` | Espaço de foco, cronômetro dominante, progresso diário, posição real e temporada |
| `/ranking` | Posição do usuário, tabs acessíveis, pódio e lista responsiva |
| `/seasons` | Temporadas ativas/planejadas/encerradas e pódio histórico |
| `/progress` | Resumo, gráficos, filtros por matéria e histórico |
| `/progress/:uid` | Progresso público do estudante e navegação contextual |
| `/subjects` | Seleção, catálogo, cores, paleta e sugestões |
| `/feed` | Posts, stories, curtidas, comentários e painel de comunidade |
| `/profile` | Identidade do estudante, estatísticas, nível e conquistas |
| `/profile/edit` | Edição da foto e nome, campos/ações consistentes |
| `/admin` | Catálogo, sugestões, criação e gerenciamento de temporadas |

## Sistema visual

- Azul-marinho `#0B1B3B` para marca e destaque, superfície de base `#071225`, cartões `#0E1E38`.
- Azul `#2F63E8` para ações; `#6A9CFA` e `#8FB3FF` para informação e texto interativo com contraste no fundo escuro.
- Amarelo `#F4C415` reservado a conquista/posição/consistência; roxo `#8B5CF6` usado pontualmente.
- Montserrat em títulos e números de destaque; Inter na interface. Fontes carregadas com `display=swap`, com fallback de sistema.
- Escala de espaçamento de 4/8/12/16/24/32/48 px, raios contidos, sombras discretas e transições curtas.
- Navegação lateral no desktop; quatro destinos principais e menu “Mais” em bottom sheet no mobile.
- Breakpoints de composição em 640, 768, 1024 e 1100/1200 px, com ajustes específicos para 320 px.
- Foco visível, labels, `aria-live`, mensagens de erro, estados desabilitados, teclado nos tabs, gestão de foco/Escape/rolagem nos diálogos e preferência de movimento reduzido.

A logo em `web/public/brand/estuda-junto.png` é cópia byte a byte do arquivo fornecido. SHA-256: `63C60F49B71EB6E1B1B5149E2D30FDD138EE6DAD4D1BDF7101B4361CBFDF7427`. O CSS apenas enquadra a margem branca do arquivo; não altera proporção, símbolo, cores ou conteúdo da marca.

## Componentes e arquivos principais

- `web/src/index.css`: tokens, primitives, navegação, estados, responsividade e acessibilidade.
- `web/src/components/ui/DesignSystem.tsx`: `BrandLogo`, `Icon`, `PageHeader`, `Card`, `Badge`, `Button`, `StatCard`, `ProgressBar`, `Skeleton`.
- `web/src/components/ui/Dialog.tsx`: foco inicial/restauração, trap de Tab, Escape, suporte a diálogos empilhados e bloqueio de scroll.
- `web/src/components/ui/{Avatar,EmptyState,ErrorState,LoadingState,StreakBadge,Toast}.tsx`: componentes existentes refatorados.
- `web/src/components/layout/`: navegação compartilhada, sidebar, topbar, menu mobile e `AuthLayout`.
- `web/src/components/feed/CommunityDialog.tsx`: diálogo reutilizado por comentários, curtidas e histórico.
- `web/src/pages/study-redesign.css`, `ranking-redesign.css`, `web/src/styles/social-redesign.css` e `StudyStories.css`: composição por domínio.
- Todas as páginas e componentes de estudo, ranking, temporadas, perfil, progresso, feed e administração foram revisados.
- `web/src/App.tsx`: carregamento das páginas sob demanda e movimento reduzido; guards e rotas mantidos.
- `web/index.html`: idioma pt-BR, título, metadados, favicon original e tipografia.

Nenhuma nova dependência de runtime foi adicionada. O build passou de um arquivo inicial de aproximadamente 1,49 MB para chunks por rota; Firebase e gráficos continuam sendo as dependências de maior peso.

## Validação

- `npm --prefix web run build`: aprovado.
- `npm --prefix functions run build`: aprovado; fonte do backend inalterada.
- `npm --prefix web run lint`: aprovado, zero erros. Permanecem 19 avisos em padrões preexistentes (effects, exports de contexto e variável não usada). A linha de base tinha 24 avisos.
- Testes padrão sem emuladores: 40 passaram, 25 ficaram condicionados aos emuladores.
- Suíte completa com Auth/Firestore/Storage locais: **65 passaram em 8 arquivos**, usando `npm --prefix functions run test -- --testTimeout=30000`. Dois testes de concorrência ultrapassaram o limite original de 5 s; passaram com 30 s, sem alterar os testes ou o backend.
- Revisão do diff: serviços, hooks, tipos, Firebase, AuthContext e backend permanecem sem alterações.
- Browser QA: login/cadastro, entrada/criação de grupo, dashboard, ranking, perfil/edição, progresso de outro estudante, feed, menu mobile, comentários, matérias, administração, temporadas e gráficos de progresso (incluindo modal e troca de período). Formulários e telas observados em larguras de 320, 390, 768, 1366 e 1440 px; checagens de overflow horizontal nas telas mobile. Modal de comentários verificado com Tab, Escape e restauração do foco.

O QA autenticado usa exclusivamente o projeto emulado `demo-estuda-junto-redesign` com o seed que já existia no repositório. Esses registros são fixtures locais de teste; não foram introduzidos dados estáticos no frontend nem alterados dados de produção. Não houve deploy, push ou merge.

## Problemas anteriores registrados, sem correção funcional

1. `LevelProgress` subtrai `currentSeconds` de `requiredSecondsForNext`, embora este último já seja o tempo restante. A indicação textual de horas restantes pode ficar incorreta. A fórmula original foi mantida; requer correção funcional separada.
2. No ambiente de Cloud Functions emulado, `start_study_session` devolveu `INTERNAL` por `admin.firestore.Timestamp.now` indefinido no código compilado de `timerService`. A fonte do backend não mudou. Os testes de serviço passaram, mas o ciclo completo iniciar/pausar/finalizar pelo navegador não pôde ser aprovado nesse runtime. Não se presume que o mesmo erro ocorra em produção.
3. O fluxo autenticado que já pertence a um grupo não possui botão de sair; o logout existente está somente em `/join-group`. Mantido para não introduzir mudança funcional silenciosa.
4. O Vite ainda avisa sobre um chunk compartilhado acima de 500 kB, principalmente do SDK Firebase. O carregamento por rota reduz o carregamento inicial, mas não elimina esse aviso.

## Executar e comparar

```powershell
npm --prefix web run dev
npm --prefix web run build
npm --prefix web run lint
git diff main...feature/redesign-estuda-junto -- web docs
```

Para repetir QA local no Windows, iniciar os emuladores do projeto `demo-estuda-junto-redesign`. Se Java falhar com `Unable to establish loopback connection`, a execução usada definiu `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:/dev/grupo-de-estudos/.qa/sockets` em uma pasta temporária local. Isso é apenas configuração do processo de testes.
