// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE ADAPTER  —  substitui @base44/sdk
//
// Interface idêntica ao cliente Base44 original: nenhum outro arquivo precisa
// mudar. Todos os métodos retornam Promises para manter compatibilidade com
// os padrões async/await usados no frontend.
//
// FUTURA MIGRAÇÃO PARA SUPABASE:
//   Substitua `createEntityStore` por uma implementação que chame
//   `supabase.from(tableName)`. A assinatura pública (list / filter /
//   create / update / bulkCreate / delete) permanece idêntica — os
//   componentes não precisarão mudar. Veja os comentários "SUPABASE:" abaixo.
// ─────────────────────────────────────────────────────────────────────────────

function generateId() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function applySort(records, orderBy) {
  if (!orderBy) return records;
  const desc = orderBy.startsWith('-');
  const field = desc ? orderBy.slice(1) : orderBy;
  return [...records].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

/**
 * Cria um store CRUD genérico usando localStorage como backend.
 * @param {string} entityName – nome da entidade (vira chave no localStorage)
 */
function createEntityStore(entityName) {
  const STORAGE_KEY = `bioflow_${entityName}`;

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveAll(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  return {
    /**
     * list(orderBy?, limit?)
     *   orderBy: "-campo" para DESC, "campo" para ASC
     *   Exemplo: BatchHistory.list('-created_date', 50)
     *
     * SUPABASE:
     *   const desc = orderBy?.startsWith('-');
     *   const field = desc ? orderBy?.slice(1) : orderBy;
     *   let q = supabase.from(entityName).select('*');
     *   if (orderBy) q = q.order(field, { ascending: !desc });
     *   if (limit)   q = q.limit(limit);
     *   const { data, error } = await q;
     *   if (error) throw error;
     *   return data;
     */
    async list(orderBy, limit) {
      let records = applySort(getAll(), orderBy);
      if (limit) records = records.slice(0, limit);
      return records;
    },

    /**
     * filter(filters, orderBy?, limit?)
     *   filters: objeto com pares campo:valor (todos devem coincidir)
     *   Exemplo: ActivityLog.filter({ reactor_id: 'R-01' }, '-created_date', 50)
     *
     * SUPABASE:
     *   let q = supabase.from(entityName).select('*');
     *   Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
     *   if (orderBy) { const desc = orderBy.startsWith('-'); q = q.order(desc ? orderBy.slice(1) : orderBy, { ascending: !desc }); }
     *   if (limit) q = q.limit(limit);
     *   const { data, error } = await q;
     *   if (error) throw error;
     *   return data;
     */
    async filter(filters, orderBy, limit) {
      let records = getAll().filter(record =>
        Object.entries(filters).every(([key, val]) => record[key] === val)
      );
      records = applySort(records, orderBy);
      if (limit) records = records.slice(0, limit);
      return records;
    },

    /**
     * SUPABASE:
     *   const { data, error } = await supabase
     *     .from(entityName)
     *     .insert({ ...data, created_date: nowIso(), updated_date: nowIso() })
     *     .select().single();
     *   if (error) throw error;
     *   return data;
     */
    async create(data) {
      const records = getAll();
      const record = {
        ...data,
        id: generateId(),
        created_date: nowIso(),
        updated_date: nowIso(),
      };
      records.push(record);
      saveAll(records);
      return record;
    },

    /**
     * SUPABASE:
     *   const rows = items.map(i => ({ ...i, created_date: nowIso(), updated_date: nowIso() }));
     *   const { data, error } = await supabase.from(entityName).insert(rows).select();
     *   if (error) throw error;
     *   return data;
     */
    async bulkCreate(items) {
      const records = getAll();
      const created = items.map(item => ({
        ...item,
        id: generateId(),
        created_date: nowIso(),
        updated_date: nowIso(),
      }));
      saveAll([...records, ...created]);
      return created;
    },

    /**
     * SUPABASE:
     *   const { data, error } = await supabase
     *     .from(entityName)
     *     .update({ ...data, updated_date: nowIso() })
     *     .eq('id', id).select().single();
     *   if (error) throw error;
     *   return data;
     */
    async update(id, data) {
      const records = getAll();
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) throw new Error(`${entityName}[${id}] não encontrado`);
      records[idx] = { ...records[idx], ...data, updated_date: nowIso() };
      saveAll(records);
      return records[idx];
    },

    /**
     * SUPABASE:
     *   const { error } = await supabase.from(entityName).delete().eq('id', id);
     *   if (error) throw error;
     */
    async delete(id) {
      saveAll(getAll().filter(r => r.id !== id));
    },
  };
}

export const base44 = {
  entities: {
    Bioreactor:   createEntityStore('Bioreactor'),
    BatchHistory: createEntityStore('BatchHistory'),
    ActivityLog:  createEntityStore('ActivityLog'),
  },

  auth: {
    /**
     * Retorna usuário local. Sem autenticação real neste modo.
     *
     * SUPABASE:
     *   const { data: { user }, error } = await supabase.auth.getUser();
     *   if (error) throw error;
     *   return { id: user.id, full_name: user.user_metadata?.full_name, email: user.email };
     */
    async me() {
      return {
        id: 'local-user',
        full_name: import.meta.env.VITE_OPERATOR_NAME || 'Operador Local',
        email: 'local@bioflow.local',
      };
    },
  },
};
