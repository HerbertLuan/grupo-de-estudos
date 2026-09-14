**Relatório técnico de custos — produção e homologação**

Atualizado em 12/09/2026 após consulta autenticada ao Firebase, Google Cloud Billing e Cloud Scheduler. Este parecer substitui as hipóteses financeiras da análise inicial. Não foram alterados recursos, permissões, jobs ou código da aplicação.

**Conclusão confirmada**

Os R$ 0,67 mostrados no Firebase de produção correspondem ao consumo bruto de CPU e memória das Cloud Run Functions. No Google Cloud Billing, esse consumo aparece compensado por descontos/créditos: o total líquido exibido para produção é **R$ 0,00**. Homologação também apresenta **R$ 0,00 líquidos**, com aproximadamente R$ 0,20 compensados.

O relatório financeiro disponível cobre **1 a 11 de setembro de 2026**, consultado no dia 12. Os valores são arredondados a centavos. Portanto, R$ 0,00 exibido não comprova ausência de frações de centavo, não representa uma fatura mensal fechada e não inclui necessariamente todo o uso recente. A imagem do Firebase avisa sobre atraso de até 24 horas.

Minha conclusão anterior de que faltava identificar a origem foi resolvida: **a origem dos R$ 0,67 é computação das funções, principalmente CPU; não há R$ 0,67 líquidos a pagar nesse recorte**. Os agendamentos continuam sendo oportunidade de eficiência, especialmente em homologação, mas não são uma cobrança líquida comprovada de R$ 0,67.

**Valores observados no faturamento**

Os dois projetos estão na mesma conta de faturamento, denominada Firebase Payment. Foi aplicado filtro individual de projeto antes da apuração; o projeto selecionado na barra do Google Cloud, sozinho, não filtrava o relatório, que inicialmente abrangia seis projetos.

| Ambiente | Projeto | Consumo/descontos agregados observados | Total líquido exibido |
|---|---|---|---:|
| Produção | grupo-de-estudos-4b504 | R$ 0,67 de CPU/memória; -R$ 0,67 em savings | R$ 0,00 |
| Homologação | grupo-de-estudos-homologacao | Aproximadamente R$ 0,20; -R$ 0,20 em savings | R$ 0,00 |

| SKU | Produção: quantidade / bruto / desconto / líquido | Homologação: quantidade / bruto / desconto / líquido |
|---|---|---|
| CPU de Functions, cobrança por requisição, São Paulo — 8D16-6275-A010 | 3.359,34 segundos / R$ 0,66 / -R$ 0,66 / R$ 0,00 | 974,32 segundos / R$ 0,19 / -R$ 0,19 / R$ 0,00 |
| Memória de Functions, cobrança por requisição, São Paulo — 8778-3432-3852 | 480,15 GiB-segundos / R$ 0,01 / -R$ 0,01 / R$ 0,00 | 180,95 GiB-segundos / R$ 0,00 / R$ 0,00 / R$ 0,00 |
| Invocações — 92DF-0F0E-630F | 2.953 / R$ 0,00 | 2.446 / R$ 0,00 |
| Build e2-standard-2 — A464-9020-6404 | 11,53 minutos / R$ 0,00 | 4,03 minutos / R$ 0,00 |
| Artifact Registry Storage — 8502-299A-ABAF | 0,02 GiB-mês / R$ 0,00 | 0,01 GiB-mês / R$ 0,00 |
| Firestore leituras — AE12-E510-3283 | 11.685 / R$ 0,00 | 6.278 / R$ 0,00 |
| Firestore gravações — 1585-F985-0AC0 | 366 / R$ 0,00 | 1.844 / R$ 0,00 |
| Firestore exclusões — DC20-BA5E-46FC | 24 / R$ 0,00 | 14 / R$ 0,00 |

Em homologação, o resumo mostra -R$ 0,20, enquanto as linhas individualmente arredondadas mostram CPU de R$ 0,19 e memória de R$ 0,00. Não forçar a soma de valores arredondados para explicar o centavo de diferença; os valores subjacentes têm mais casas decimais.

As linhas de rede, Storage, Logging, Hosting e Scheduler consultadas também aparecem com R$ 0,00 líquidos nos dois projetos. A linha Jobs informa usage de 5 count em produção e 4 count em homologação; esse agregado faturável do período **não é inventário de jobs simultâneos**. O inventário real foi consultado separadamente e contém dois jobs por ambiente.

O R$ 0,01 líquido observado inicialmente no conjunto da conta pertence a armazenamento de outro projeto, print3d-manager, e não deve ser atribuído ao Grupo de Estudos. Não foi realizada investigação adicional desse outro aplicativo.

**Por que há consumo no Firebase e total zero no Billing?**

Nesta consulta, o Firebase mostra o valor de uso que corresponde ao bruto de CPU/memória. O Google Cloud Billing mostra separadamente o consumo e os valores negativos em Other savings, chegando ao líquido de zero.

A documentação do Cloud Run explica que a franquia gratuita é aplicada como desconto, compartilhada entre projetos da conta e renovada mensalmente. Isso é compatível com o que foi observado. A página Issued Credits mostrou “No credits to display”; não foi encontrada evidência de um crédito promocional de teste nessa página. Contudo, o relatório consultado classificou o abatimento apenas como Other savings: **a identificação específica como Free Tier é uma inferência compatível com a documentação, e não uma etiqueta detalhada exibida na tabela**. A tabela de faturas fechadas ainda só oferecia agosto como mês mais recente, impedindo confirmar o Credit type de setembro por essa tela.

Não há necessidade de comprar créditos ou alterar o plano para obter os R$ 0,00 já exibidos. O Blaze permite franquias gratuitas e cobrança de excedentes. [Preços e aplicação da franquia do Cloud Run](https://cloud.google.com/run/pricing).

**Agendamentos efetivamente publicados**

| Ambiente | Job | Frequência atual confirmada | Estado e última execução observada |
|---|---|---|---|
| Produção | close_expired_seasons | A cada hora | Enabled / Success |
| Produção | expire_study_stories | A cada hora | Enabled / Success |
| Homologação | close_expired_seasons | A cada 5 minutos | Enabled / Success |
| Homologação | expire_study_stories | A cada minuto | Enabled / Success |

Os quatro estão em southamerica-east1. A verificação comprova apenas o status da última execução exibida, não ausência histórica de erros. Produção já recebeu a redução de frequência, contrariando a hipótese inicial de que a alteração poderia estar somente local. Homologação continua com a frequência antiga.

| Projeção operacional, 30 dias completos | Produção atual | Homologação atual | Homologação com ambos por hora |
|---|---:|---:|---:|
| Execuções agendadas, sem retries | 1.440 | 51.840 | 1.440 |

Reduzir homologação para execução horária evita aproximadamente **50.400 execuções por mês, ou 97,2% desse trabalho agendado**. Não equivale a economizar 97,2% de dinheiro, porque o líquido atual é zero e há franquias. Esses números são projeções das frequências atuais, não contagens históricas: não devem ser comparados diretamente com as invocações faturadas de 1–11/09, pois os jobs foram criados/alterados durante o período.

As rotinas consultam Firestore mesmo sem usuários no aplicativo. A limpeza de stories pode ainda apagar arquivos e subcoleções; a verificação de temporadas percorre temporadas ativas e executa transações. Isso explica por que homologação mantém atividade em segundo plano. A fatura identifica CPU/memória no nível de SKU/projeto, mas não foi obtida atribuição histórica dos segundos de CPU a cada função. Não afirmo que os jobs expliquem sozinhos todo o consumo bruto.

**Contornos recomendados, em ordem**

1. **Manter produção no Blaze e acompanhar o líquido.** O custo observado já está zerado na precisão do relatório. Não recomendo migração de região, provedor ou plano apenas para eliminar um valor bruto compensado.
2. **Alinhar os dois schedules de homologação para uma hora.** A alteração já existe no arquivo local functions/src/index.ts. Validar e publicar seletivamente somente em homologação. O fechamento de temporadas e a limpeza física podem atrasar aproximadamente uma hora; validar expiração visual, regras de acesso e acúmulo de itens. Nenhum deploy foi realizado nesta investigação.
3. **Considerar um único job de manutenção por ambiente.** Dois jobs por projeto resultam em quatro na mesma conta. A franquia do Scheduler é de três jobs por conta; há potencial de cobrança futura de cerca de US$ 0,10 por job excedente por 31 dias, proporcional ao tempo. Ainda não apareceu cobrança líquida desse SKU no recorte. Consolidar as duas rotinas reduz o inventário a dois, desde que os jobs antigos sejam removidos e não existam outros jobs consumindo a franquia. Tratar falhas das tarefas independentemente. Apenas pausar ou diminuir frequência não elimina tarifa por job. [Preços do Scheduler](https://cloud.google.com/scheduler/pricing).
4. **Usar emuladores na rotina de desenvolvimento/homologação.** O código só conecta emuladores em modo DEV com VITE_USE_FIREBASE_EMULATOR=true. Sem isso, localhost acessa serviços reais, e o proxy Vite possui fallback para produção. Configurar projeto demo-* e Auth, Firestore, Functions e Storage emulados. Isso elimina consumo Google dessas sessões isoladas; os recursos remanescentes na nuvem continuam existindo. Testar manutenção explicitamente, pois emulação não substitui integralmente Scheduler/IAM reais.
5. **Proteger o seed de homologação.** No código, seed_homolog_database é público e verifica somente o projeto, sem autenticação administrativa. Substituir por execução administrativa ou exigir identidade e autorização. Se publicado assim, permite carga repetida e alterações de dados. Não invoquei esse endpoint nem confirmei abuso.
6. **Otimizar artefatos somente se as métricas justificarem.** Artifact Registry está a R$ 0,00 neste período: não é a origem dos R$ 0,67. Avaliar retenção de 1 dia em homologação e 7 dias em produção se houver acúmulo. A franquia de 0,5 GiB-mês é compartilhada pela conta; usar políticas específicas do repositório gerenciado de Functions, preservando necessidades de reprodução e inspeção. [Artifact Registry](https://cloud.google.com/artifact-registry/pricing), [políticas de artefatos Firebase](https://firebase.google.com/docs/functions/manage-functions).

O maxInstances: 10 do código limita escala por função; não reserva dez instâncias e não define teto de fatura. A configuração implantada de mínimos e limites de cada função não foi auditada nesta continuação. O SKU observado indica cobrança de CPU/memória por requisição. Alterações globais de CPU ou memória exigem medição de latência e carga antes de serem recomendadas.

**Melhorias adicionais identificadas no código**

- initialize_story_presence consulta os membros a cada montagem do componente, mesmo após a migração inicial; registrar a versão da migração por grupo evita trabalho repetido.
- Publicação e remoção de fotos disparam limpeza global de stories; limitar a limpeza imediata aos itens relacionados reduz duração dessas operações.
- Ranking, comentários e curtidas podem se beneficiar de paginação e limites no servidor; preservar autorização e cache por usuário/grupo.
- Fotos já são reduzidas a até 2.048 pixels, JPEG 0,88 no cliente; avaliar resolução/qualidade menor e reutilização de blobs se tráfego crescer.
- O timer de um segundo inspecionado atualiza estado local. Não há evidência de uma invocação de Function a cada segundo nesse trecho.

Esses pontos são oportunidades de eficiência/prevenção, não cobranças líquidas comprovadas. O seed e as demais constatações de código ainda precisam ser comparados à revisão efetivamente implantada antes de afirmar exposição pública real.

**O que significa zerar neste cenário**

| Objetivo | Parecer |
|---|---|
| Zerar o valor líquido atual dos dois projetos | Já aparece R$ 0,00 em ambos no recorte disponível, com arredondamento |
| Reduzir consumo bruto e preservar franquia | Ajustar principalmente homologação; manter otimizações proporcionais ao uso |
| Garantir cobrança zero para sempre no Blaze | Não há essa garantia: franquias, volume, outros projetos da conta e serviços auxiliares interferem |
| Homologar sem consumir nuvem | Emuladores corretamente isolados; revisar separadamente recursos já mantidos na nuvem |
| Trocar diretamente para Spark mantendo tudo | Incompatível com Functions e com o requisito atual de Blaze do Storage; exigiria redesign |

Manter cálculo confiável de pontuação no backend. Não enfraquecer autorização nem mover regras críticas ao cliente apenas para reduzir consumo bruto. [Planos Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [requisitos do Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024?hl=en).

**Validação futura e fontes da auditoria**

Após eventual alteração de homologação, comparar por sete dias: invocações agendadas, erros, duração, custo bruto, descontos e líquido, normalizando volume e respeitando atraso de atualização. Confirmar timer, cadastro, ranking, fechamento de temporadas e expiração/limpeza das fotos. Para a conciliação final, verificar a fatura de setembro quando estiver fechada e o tipo detalhado de crédito, se disponível.

Alertas por projeto ajudam a detectar variações, mas orçamento apenas de alerta não bloqueia consumo. Avaliar cobertura de spend caps antes de considerá-los proteção para esta arquitetura. [Orçamentos](https://docs.cloud.google.com/billing/docs/how-to/budgets), [spend caps](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps).

Fontes privadas autenticadas, consultadas em 12/09/2026:

- [Relatório de produção, agrupado por SKU](https://console.cloud.google.com/billing/01568C-B6DD06-6BD263/reports;grouping=GROUP_BY_SKU;projects=736212648794?project=grupo-de-estudos-4b504).
- O mesmo relatório foi filtrado individualmente por grupo-de-estudos-homologacao para apurar homologação. Período observado: 1–11/09/2026; savings habilitados.
- [Scheduler de produção](https://console.cloud.google.com/cloudscheduler?project=grupo-de-estudos-4b504).
- [Scheduler de homologação](https://console.cloud.google.com/cloudscheduler?project=grupo-de-estudos-homologacao).
- [Créditos emitidos da conta](https://console.cloud.google.com/billing/01568C-B6DD06-6BD263/credits/all).
- Código local: .firebaserc, firebase.json, functions/src/index.ts, serviços de temporadas/stories/seed/ranking/social e configuração Firebase/Vite do frontend.

Limites: sem exportação financeira não arredondada de setembro; sem inspeção histórica de logs por função; sem inventário completo dos demais projetos da conta; sem auditoria de políticas de todos os buckets/repositórios. Nenhuma dessas limitações muda a evidência principal de CPU/memória compensadas e líquido exibido zero para os dois projetos neste recorte. Nenhuma configuração externa foi alterada.
