# BioFlow — Histórico e Roadmap

> Sistema de monitoramento e controle de biorreatores industriais e piloto.

---

## ✅ O que foi feito

### 1. Migração da plataforma proprietária para projeto independente

O projeto foi originalmente desenvolvido numa plataforma no-code/low-code que gerava acoplamento total com SDK, plugin de build e sistema de autenticação proprietários. A migração removeu 100% dessas dependências, deixando o projeto autônomo e pronto para rodar em qualquer ambiente.

**Dependências removidas:**
- `@base44/sdk`
- `@base44/vite-plugin`
- `src/lib/app-params.js` (configuração proprietária de app_id/token)

---

### 2. Camada de dados local (`src/api/client.js`)

Criado um adapter de localStorage com interface idêntica à original, garantindo que nenhum componente de UI precisou ser alterado.

**Métodos implementados:**
| Método | Descrição |
|---|---|
| `entities.X.list(orderBy?, limit?)` | Listagem com ordenação e limite |
| `entities.X.filter(filters, orderBy?, limit?)` | Filtragem por campos + ordenação |
| `entities.X.create(data)` | Criação com `id`, `created_date`, `updated_date` automáticos |
| `entities.X.bulkCreate(items[])` | Criação em lote |
| `entities.X.update(id, data)` | Atualização com `updated_date` automático |
| `entities.X.delete(id)` | Remoção |
| `auth.me()` | Retorna usuário local (sem autenticação) |

**Entidades suportadas:** `Bioreactor`, `BatchHistory`, `ActivityLog`

**Preparado para Supabase:** cada método tem comentário `SUPABASE:` com a implementação equivalente pronta para substituição.

---

### 3. Arquivos de suporte criados

Arquivos que existiam na plataforma original como serviços internos e precisaram ser recriados localmente:

| Arquivo | Função |
|---|---|
| `src/lib/AuthContext.jsx` | Stub de autenticação (sem bloqueio de acesso) |
| `src/lib/query-client.js` | Instância do TanStack React Query |
| `src/lib/PageNotFound.jsx` | Página 404 |
| `src/components/UserNotRegisteredError.jsx` | Fallback de erro de autenticação |

---

### 4. Configuração do Vite (`vite.config.js`)

Removido o plugin proprietário e configurado o alias `@/` manualmente com `fileURLToPath` (compatível com `"type": "module"` do `package.json`).

```js
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
}
```

---

### 5. Limpeza de nomenclatura

- Arquivo renomeado: `base44Client.js` → `client.js`
- Export renomeado: `base44` → `api`
- Todos os imports atualizados em `Dashboard.jsx`, `History.jsx`, `ReactorDrawer.jsx`, `ActivityTable.jsx`
- Comentários de migração removidos dos arquivos

---

### 6. Correção de bug: resquício de atividade após reinício

**Problema:** ao reiniciar um reator, o drawer continuava exibindo fases e operadores da sessão anterior (ex: "Em Processo · joao" com checkmark).

**Causa:** `usedStatuses` e `statusOperatorMap` no `ReactorDrawer` usavam todos os logs históricos do reator, sem filtrar por sessão.

**Solução:** o log de `idle` mais recente passou a ser o marco de início de sessão. Apenas logs criados **após** esse evento são usados para renderizar o estado atual do drawer.

```js
const lastIdleLog = logs.find(l => l.new_status === 'idle');
const sessionLogs = lastIdleLog
  ? logs.filter(l => l.created_date > lastIdleLog.created_date)
  : logs;
```

---

### 7. Infraestrutura do projeto

| Item | Detalhe |
|---|---|
| `package.json` | Nome atualizado para `bioflow`, deps proprietárias removidas |
| `.env.example` | Template com `VITE_OPERATOR_NAME` e vars Supabase comentadas |
| `.gitignore` | Padrão React/Vite com `.env` protegido |
| `README.md` | Documentação com setup, funcionalidades e guia de migração Supabase |
| Node.js | Instalado portátil em `AppData\Local\nodejs`, adicionado ao PATH do usuário |
| GitHub | Repositório público em https://github.com/JeanDiias/bioflow |

---

## 🚧 Roadmap — Melhorias Futuras

Análise realizada por especialista em operações com biorreatores industriais. Itens ordenados por impacto operacional.

---

### 🔴 Crítico — bloqueadores para produção

#### 1. Migrar para backend com persistência real (Supabase)

**Por que é urgente:** com localStorage, dois operadores em dispositivos diferentes enxergam estados diferentes do sistema. Dados somem ao trocar de aba ou máquina. O sistema atual é um protótipo de demonstração, não um sistema de produção.

**O que fazer:**
- Criar projeto no Supabase
- Criar tabelas `Bioreactor`, `BatchHistory`, `ActivityLog` com as mesmas colunas atuais
- Substituir `createEntityStore` em `src/api/client.js` seguindo os comentários `SUPABASE:` já presentes
- Adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env`

---

#### 2. Salvar lote ao histórico independente da fase anterior

**Problema atual:** `BatchHistory` só é criado quando `reactor.status === 'in_process'` ao ir para `idle`. Um reinício de emergência no meio do CIP ou da esterilização não gera registro — o lote some silenciosamente.

**O que fazer:**
- Sempre que `newStatus === 'idle'` e `batch_id !== ''`, criar o registro em `BatchHistory`
- Adicionar campo `completed` (boolean ou enum `'completo' | 'interrompido'`) para diferenciar lotes concluídos de interrompidos
- Exibir badge visual no histórico para lotes interrompidos

---

#### 3. Capturar timestamp individual de cada fase

**Problema atual:** ao trocar de fase, o tempo gasto na fase anterior é perdido para sempre. `total_duration_minutes` mede apenas a duração do `in_process`, não o ciclo completo.

**O que fazer:**
- Criar entidade `PhaseLog` com: `reactor_id`, `batch_id`, `phase`, `started_at`, `ended_at`, `duration_minutes`, `operator_name`
- Preencher ao final de cada fase (quando o operador troca)
- Usar esses dados no PDF e no histórico

---

### 🟠 Alta prioridade — impacto direto na operação

#### 4. Validação (soft) de sequência de fases

**Problema atual:** é possível ir de `idle` direto para `in_process` sem registrar nenhuma etapa de preparação. O sistema não avisa nem bloqueia.

**O que fazer:**
- Definir uma sequência mínima recomendada por tipo de reator
- Ao tentar avançar para `in_process` sem as etapas anteriores no `sessionLogs`, exibir modal de aviso: *"Esterilização de meio não registrada nesta sessão. Confirma mesmo assim?"*
- Se o operador confirmar, logar o evento com flag `skipped: true` no `ActivityLog`

---

#### 5. Seleção de operador via lista cadastrada

**Problema atual:** o campo `Nome do Operador` é texto livre. O mesmo operador aparece como "joao", "João", "João Silva" no histórico — rastreabilidade comprometida desde o dia 1.

**O que fazer:**
- Criar entidade `Operator` com nome, matrícula e turno
- Substituir o `<Input>` de operador por um `<Select>` com lista cadastrada
- Manter campo livre como fallback para emergências, com aviso visual

---

#### 6. Enriquecer o PDF de lote com log completo

**Problema atual:** o PDF atual contém apenas os campos do `BatchHistory` (reator, operador, início, fim, duração). Não inclui a sequência de fases, quem executou cada uma nem os timestamps por etapa. Não seria aceito numa inspeção de qualidade.

**O que fazer:**
- Passar os logs do lote para a função `exportBatchPdf`
- Adicionar segunda seção no PDF: tabela com Fase | Início | Fim | Duração | Operador
- Incluir flag de fases puladas, se houver

---

#### 7. Filtros na página de Histórico

**Problema atual:** a tabela carrega os 50 lotes mais recentes sem nenhum filtro. Em 2 meses com 6 reatores, se torna inutilizável.

**O que fazer:**
- Filtro por `reactor_id` (dropdown)
- Busca por `batch_id` (texto)
- Filtro por período (data início / data fim)
- Filtro por status do lote (completo / interrompido)

---

### 🟡 Média prioridade — qualidade operacional

#### 8. Alertas de tempo excessivo por fase

O cronômetro conta silenciosamente — um reator em CIP há 8h não emite nenhum sinal visual além do número na tela.

**O que fazer:**
- Configurar threshold por fase (ex: CIP > 4h, esterilização > 2h)
- Destacar o card no dashboard com borda pulsante ou badge vermelho quando ultrapassado
- Opcional: notificação via browser (`Notification API`)

---

#### 9. Campo de observações por fase

Atualmente o operador registra ocorrências num caderno de papel ao lado do computador.

**O que fazer:**
- Adicionar campo `observações` (textarea) no drawer, salvo junto ao `ActivityLog`
- Exibir observações no histórico expandido do lote e no PDF

---

#### 10. Controle de acesso por perfil

**Problema:** qualquer pessoa com acesso à tela pode reiniciar um reator em processo.

**O que fazer:**
- Criar perfis: `operador` e `supervisor`
- Ações destrutivas (Reiniciar Reator) e críticas (ir para `in_process`) exigem perfil de supervisor ou segundo fator de confirmação
- Logar quem autorizou, além de quem executou

---

### 🟢 Melhorias de produto

#### 11. Capacidade volumétrica nos cards

O card mostra `R-01 Industrial` mas não diz se é 2.000 L ou 10.000 L — informação relevante para priorização de operações.

**O que fazer:**
- Adicionar campo `volume_liters` na entidade `Bioreactor`
- Exibir no card e no drawer

---

#### 12. Exportação do histórico em CSV/Excel

Não há como extrair os dados para análise externa. Todo mês alguém vai pedir um relatório de produção.

**O que fazer:**
- Botão "Exportar CSV" na página de Histórico
- Exportar todos os lotes filtrados (respeitando os filtros ativos)

---

#### 13. Timeline / Gantt dos reatores

O sistema mostra o estado presente, mas sem projeção de quando cada reator vai estar disponível. Impossível planejar próximas bateladas.

**O que fazer:**
- Tela de planejamento com visão horizontal dos 6 reatores ao longo do tempo
- Baseada no histórico de duração por fase para estimar próximas disponibilidades

---

#### 14. Integração com SCADA/MES (longo prazo)

Para uso em planta industrial com requisitos GMP, o sistema precisaria capturar parâmetros de processo (temperatura de esterilização, pressão, agitação) via integração com sistema de supervisão.

---

## Stack atual

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite 6 |
| Estilo | Tailwind CSS + shadcn/ui (Radix UI) |
| Estado | TanStack React Query v5 |
| Rotas | React Router v6 |
| Dados | localStorage (migração Supabase planejada) |
| PDF | jsPDF |
| Ícones | lucide-react |
| Datas | date-fns |
| Repositório | https://github.com/JeanDiias/bioflow |
