import { Transaction, CustomCategoryRule } from '@/types/finance';

/**
 * Verifica se una transazione corrisponde al pattern e ai criteri di una regola
 */
export function matchRule(tx: Transaction, rule: CustomCategoryRule): boolean {
  if (!rule.isActive) return false;

  // Filtro canale
  if (rule.channel && rule.channel !== 'all' && tx.channel !== rule.channel) {
    return false;
  }

  const rawPattern = (rule.pattern || '').trim();
  if (!rawPattern) return false;

  // Testo su cui effettuare il matching
  let textToMatch = '';
  const desc = tx.description || '';
  const rawDesc = tx.rawDescription || '';

  if (rule.matchField === 'description') {
    textToMatch = desc;
  } else if (rule.matchField === 'rawDescription') {
    textToMatch = rawDesc || desc;
  } else {
    // 'both'
    textToMatch = `${desc} ${rawDesc}`.trim();
  }

  // Supporto Regex (se racchiuso tra /.../ o /.../flags)
  const regexMatch = rawPattern.match(/^\/(.+)\/([gimsuy]*)$/);
  if (regexMatch) {
    try {
      const regex = new RegExp(regexMatch[1], regexMatch[2] || 'i');
      return regex.test(textToMatch);
    } catch {
      // In caso di sintassi regex non valida, fallback su substring
    }
  }

  // Matching standard case-insensitive
  return textToMatch.toUpperCase().includes(rawPattern.toUpperCase());
}

/**
 * Applica una regola specifica a una transazione restituendo il record arricchito
 */
export function applyRuleToTransaction(
  tx: Transaction,
  rule: CustomCategoryRule
): Transaction {
  const mergedTags = Array.from(new Set([...(tx.tags || []), ...(rule.tags || [])]));

  return {
    ...tx,
    macroCategory: rule.macroCategory,
    category: rule.category,
    tags: mergedTags,
    isExtraordinary: rule.isExtraordinary !== undefined ? rule.isExtraordinary : tx.isExtraordinary,
    autoCategorized: true,
  };
}

/**
 * Trova tutte le transazioni che soddisfano i criteri di una data regola (per anteprima live)
 */
export function findMatchingTransactions(
  transactions: Transaction[],
  rule: CustomCategoryRule
): Transaction[] {
  return transactions.filter((tx) => matchRule(tx, rule));
}

/**
 * Applica l'intero set di regole personalizzate (in ordine di definizione)
 * a una singola transazione. La prima regola corrispondente viene applicata.
 */
export function categorizeWithUserRules(
  tx: Transaction,
  rules: CustomCategoryRule[]
): { transaction: Transaction; matchedRule?: CustomCategoryRule } {
  if (!rules || rules.length === 0) return { transaction: tx };

  for (const rule of rules) {
    if (matchRule(tx, rule)) {
      return {
        transaction: applyRuleToTransaction(tx, rule),
        matchedRule: rule,
      };
    }
  }

  return { transaction: tx };
}

/**
 * Applica l'insieme di regole attive all'intero archivio di transazioni
 * Restituisce l'array aggiornato e il numero di transazioni riclassificate
 */
export function applyRulesToTransactions(
  transactions: Transaction[],
  rules: CustomCategoryRule[]
): { updatedTransactions: Transaction[]; modifiedCount: number } {
  const activeRules = (rules || []).filter((r) => r.isActive);
  if (activeRules.length === 0) {
    return { updatedTransactions: transactions, modifiedCount: 0 };
  }

  let modifiedCount = 0;
  const updatedTransactions = transactions.map((tx) => {
    for (const rule of activeRules) {
      if (matchRule(tx, rule)) {
        // Verifica se ci sono state variazioni effettive di categoria o macroCategoria
        const hasChanged =
          tx.category !== rule.category ||
          tx.macroCategory !== rule.macroCategory ||
          (rule.isExtraordinary !== undefined && tx.isExtraordinary !== rule.isExtraordinary);

        if (hasChanged) {
          modifiedCount++;
          return applyRuleToTransaction(tx, rule);
        }
        return tx;
      }
    }
    return tx;
  });

  return { updatedTransactions, modifiedCount };
}

/**
 * Regole suggerite predefinite (starter template nel Vault se l'utente non ne ha ancora create)
 */
export const DEFAULT_STARTER_RULES: CustomCategoryRule[] = [
  {
    id: 'rule-default-farmacia',
    name: 'Farmacie e Sanità Locale',
    pattern: 'FARMACIA',
    matchField: 'both',
    channel: 'all',
    macroCategory: 'Needs',
    category: 'Salute e Farmacia',
    tags: ['#farmacia', '#salute'],
    isActive: true,
    createdAt: '2026-10-30T10:00:00Z',
  },
  {
    id: 'rule-default-supermercato',
    name: 'Spesa Alimentare Supermercato',
    pattern: 'CONAD|ESSELUNGA|COOP|CARREFOUR|LIDL|ALDI',
    matchField: 'both',
    channel: 'all',
    macroCategory: 'Needs',
    category: 'Supermercato & Alimentari',
    tags: ['#spesa', '#cibo'],
    isActive: true,
    createdAt: '2026-10-30T10:00:00Z',
  },
  {
    id: 'rule-default-carburante',
    name: 'Rifornimento Carburante',
    pattern: 'ENI|IP |Q8|ESSO|TAMBOIL|DISTRIBUTORE',
    matchField: 'both',
    channel: 'all',
    macroCategory: 'Needs',
    category: 'Carburante & Trasporti',
    tags: ['#auto', '#carburante'],
    isActive: true,
    createdAt: '2026-10-30T10:00:00Z',
  },
];

