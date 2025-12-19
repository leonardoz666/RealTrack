# Product Requirements Document (PRD)

**Produto:** RealTrack — Módulo de Análise de Apostas

**Data:** 19 de dezembro de 2025

---

## Resumo Executivo

Propósito: especificar e orientar o desenvolvimento de um módulo que permita importar, validar, analisar e reportar apostas (tickets), com dashboards e integrações automáticas, reduzindo o tempo de análise e aumentando a confiabilidade dos dados.

Visão: permitir que analistas e gestores extraiam insights acionáveis sobre desempenho de apostas e tipsters com filtros avançados, relatórios exportáveis e integrações confiáveis com casas de aposta.

Prioridade: alta — impacto direto em tomada de decisão e retenção de clientes.

---

## Objetivos

- Aumentar a velocidade de análise de apostas em X% (meta negociável) em 3 meses.
- Reduzir erros de processamento manual em 90% através de validações automáticas.
- Fornecer métricas chaves (ROI, taxa de acerto, lucro/prejuízo) em dashboards para gestores.

---

## Escopo

Incluído:

- Upload e validação de arquivos CSV com mapeamento de campos.
- Interface de listagem com filtros avançados, paginação e ordenação.
- Dashboard com métricas agregadas por período e por fonte (tipster/casa).
- Exportação de relatórios (CSV, XLSX, PDF).
- Integração com APIs externas para importação automática.
- Autenticação e autorização por roles (analista, gestor, admin).

Excluído (Escopo futuro):

- Suporte offline completo.
- Internacionalização completa (apenas PT inicialmente).

---

## Stakeholders

- Product Owner / PM: priorização e aceitação.
- Engenharia: frontend e backend — implementação.
- Design (UX/UI): protótipos e testes de usabilidade.
- Comercial / PMM: validação de valor de negócio.
- Operações / Segurança / Legal: conformidade e LGPD.

---

## Personas

- Analista (Primária): usa a ferramenta diariamente para identificar padrões e tomar decisões. Precisa de filtros, velocidade e exportações.
- Gestor (Secundária): consome dashboards e relatórios para tomada de decisões estratégicas.
- Admin/Operações (Técnica): configura integrações, monitora logs e corrige erros de ingestão.

---

## Casos de Uso / User Stories (exemplos)

- Como Analista, quero importar um CSV com apostas para analisar padrões e métricas.
- Como Analista, quero filtrar apostas por data, casa, status e tipo para encontrar padrões.
- Como Gestor, quero ver um dashboard com ROI e taxa de acerto por período.
- Como Admin, quero configurar integrações automáticas com casas de aposta.

---

## Requisitos Funcionais (RF)

- RF1: Upload de CSV com validação (colunas esperadas, formatos de data, valores numéricos) e interface de mapeamento.
- RF2: Página de listagem com filtros avançados, busca e paginação eficiente.
- RF3: Dashboard com métricas: total apostas, taxa de acerto, ROI, lucro/prejuízo, número de tickets por fonte.
- RF4: Visualização detalhada de uma aposta (modal) incluindo ticket, histórico e anexos.
- RF5: Exportação de relatórios em CSV/XLSX/PDF com opções de intervalo e filtros aplicados.
- RF6: Autenticação com roles (analista, gestor, admin) e gestão de permissões.
- RF7: Integração com API externa para importação/agregação automática (configurável por admin).
- RF8: Logs detalhados e notificações sobre falhas de importação.

---

## Requisitos Não-Funcionais (RNF)

- RNF1: Performance — consultas paginadas < 300ms para páginas comuns.
- RNF2: Escalabilidade — suportar ingestão de 10k registros/dia sem degradação.
- RNF3: Resiliência — retries com backoff em integrações externas.
- RNF4: Segurança — TLS em trânsito; encriptação em repouso para dados sensíveis.
- RNF5: Conformidade — atender LGPD: consentimento, anonimização e direito de exclusão.
- RNF6: Acessibilidade — WCAG 2.1 AA para telas críticas.

---

## Dados & Integrações

- Entidades principais: `Aposta` (id, data, casa, tipo, stake, odd, resultado, lucro, ticketUrl, fonte), `Usuario`, `ImportJob`.
- Fontes: CSVs enviados pelos usuários, APIs externas (casas de aposta), base interna de usuários.
- Regras ETL: validação de formatos, mapeamento de casas (usar `casasApostas`), deduplicação por hash de ticket.
- Armazenamento: BD relacional para transações + possível OLAP (data-warehouse) para análises históricas.

---

## Segurança & Privacidade

- Autenticação via tokens (JWT) com rotação e expiração curta.
- Controle de acesso por roles; logs de auditoria para ações sensíveis.
- Pseudonimização de dados pessoais por padrão em exports.
- Política de retenção e processo para solicitações de exclusão (LGPD).

---

## Métricas de Sucesso

- Adoção: DAU/MAU do módulo.
- Impacto: redução do tempo médio de análise em X%.
- Confiabilidade: taxa de erro de importação < 2% após melhorias.
- Disponibilidade: SLA alvo 99.9% para APIs críticas.
- Satisfação: NPS >= 30 após 3 meses de uso.

---

## Critérios de Aceitação

- CA1: Uploads de CSV processam 95% dos arquivos reais sem intervenção manual.
- CA2: Dashboard reproduz métricas validadas contra dados históricos.
- CA3: Fluxos críticos cobertos por testes E2E automatizados.
- CA4: Revisão de segurança concluída e sem issues críticas abertas.

---

## Roadmap & Marcos (proposta)

- Fase 0 (2 sem): Spec final e protótipos de alta fidelidade.
- Fase 1 (4 sem): Upload CSV, modelagem de dados, listagem básica.
- Fase 2 (4 sem): Filtros avançados, dashboard básico, auth/roles.
- Fase 3 (2 sem): Integrações automáticas, exportação e QA.
- Beta: validação interna e correção de bugs.

---

## Riscos & Premissas

- Risco: CSVs inconsistentes exigirão interface de correção/manual.
- Premissa: APIs externas estão documentadas e estáveis com limites razoáveis.
- Mitigação: construir etapas de validação, previews de import e ferramentas de reconciliação.

---

## Dependências

- Time de Design para protótipos.
- Time de Infra/DevOps para recursos de armazenamento e backup.
- Acesso às APIs de casas de aposta e chaves de sandbox.
- Revisão legal sobre LGPD.

---

## Entregáveis

- Este PRD (arquivo Markdown).
- Protótipos de tela (Figma).
- Especificação de API e scripts de importação.
- Backlog inicial pronto para implementação (stories/issues).

---

## Próximos Passos Imediatos

1. Validar escopo e stakeholders em reunião de 30–60 minutos.
2. Aprovar prioridades e alocar time de desenvolvimento.
3. Gerar backlog detalhado (user stories) e criar issues no repositório.

---

_Autor: Equipe de Produto_
