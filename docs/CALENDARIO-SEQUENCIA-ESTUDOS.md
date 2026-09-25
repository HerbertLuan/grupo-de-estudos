# Calendário “Sua sequência de estudos”

## Contrato preservado

- Um dia só aparece como concluído quando o respectivo `DailyStudy.pointEarned` é `true`. Tempo parcial nunca é promovido visualmente a conclusão.
- A sequência atual e a maior sequência são as estatísticas efetivas retornadas por `get_user_stats`; o frontend não recalcula a regra de sequência.
- O histórico usa as datas `YYYY-MM-DD` já registradas em `DailyStudy`. O calendário não converte nem desloca essas datas.
- A abertura automática ocorre uma vez por projeto Firebase, UID e dia, depois da inicialização autenticada. Login, cadastro e entrada/criação de grupo não montam o calendário.
- Sessão ativa e diálogos prioritários adiam a abertura. Quando disponível, Web Locks evita a apresentação simultânea em várias abas; sem Web Locks, permanece o controle por storage/memória.
- A confirmação de uma sessão invalida o cache do calendário. A abertura seguinte busca novamente histórico e estatísticas.

## Observação de fuso horário

As datas das sessões e de `DailyStudy` são gravadas pelo backend no fuso configurado no grupo. Já `get_user_stats` calcula a sequência efetiva com o fuso padrão da aplicação (`America/Sao_Paulo`), e o frontend também usa esse padrão para determinar “hoje” e controlar a apresentação diária.

Para grupos cujo fuso difere de `America/Sao_Paulo`, pode existir uma janela próxima à meia-noite em que a data registrada pelo grupo e o “hoje” das estatísticas/interface não coincidem. Esta publicação preserva as datas e as regras existentes; alinhar as estatísticas e o frontend ao fuso de cada grupo é uma correção funcional separada.

## Validação local de consolidação — 25/09/2026

- Build de produção aprovado, 12 testes de frontend aprovados, lint sem erros e com os 19 avisos preexistentes.
- Login em `demo-estuda-junto-redesign`, abertura automática após a inicialização autenticada, persistência após recarga e recarga direta de rota interna aprovados.
- Ciclo completo validado no ambiente emulado: início pela interface, recuperação após recarga, finalização de sessão acima de 60 minutos, gravação do ponto, detalhes pós-sessão, celebração, atualização da sequência e invalidação do cache na abertura manual seguinte.
- O runtime local do Functions Emulator reproduziu a incompatibilidade conhecida de `admin.firestore.Timestamp.now()`. Para o ensaio foi usado um shim somente nos artefatos compilados e ignorados de `functions/lib`, semanticamente equivalente ao timestamp do Admin SDK. O shim foi removido por recompilação ao final; nenhuma fonte de backend, regra ou configuração de produção foi alterada.
- Os registros usados foram exclusivamente fixtures dos emuladores. Nenhum registro artificial foi criado em produção.
