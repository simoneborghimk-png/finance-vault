import { MacroCategory } from '@/types/finance';

export interface CategorizationResult {
  macroCategory: MacroCategory;
  category: string;
  tags: string[];
  isExtraordinary?: boolean;
  autoCategorized: boolean;
}

export function categorizeDescription(rawDesc: string, amount: number): CategorizationResult {
  const desc = (rawDesc || '').toUpperCase();

  // Entrate
  if (amount > 0) {
    if (desc.includes('CLOUDFIRE') || desc.includes('STIPENDIO') || desc.includes('EMOLUMENTI')) {
      return {
        macroCategory: 'Savings', // Income source, usually categorized as Entrate
        category: 'Stipendio Ordinario',
        tags: ['#stipendio', '#lavoro', '#ricorrente'],
        autoCategorized: true,
      };
    }
    if (desc.includes('730') || desc.includes('AGENZIA DELLE ENTRATE') || desc.includes('RIMBORSO FISCALE')) {
      return {
        macroCategory: 'Savings',
        category: 'Rimborso 730',
        tags: ['#fisco', '#730', '#rimborso'],
        autoCategorized: true,
      };
    }
    return {
      macroCategory: 'Savings',
      category: 'Altre Entrate',
      tags: ['#entrata'],
      autoCategorized: false,
    };
  }

  // Uscite: Utenze & Casa (Needs)
  if (desc.includes('IREN MERCATO') || desc.includes('ENEL') || desc.includes('HERA') || desc.includes('LUCE') || desc.includes('GAS')) {
    return {
      macroCategory: 'Needs',
      category: 'Utenze Luce e Gas',
      tags: ['#utenze', '#bolletta', '#casa'],
      autoCategorized: true,
    };
  }

  if (desc.includes('ARCA S.R.L.') || desc.includes('ARCA SRL') || desc.includes('ACQUEDOTTO') || desc.includes('ACQUA')) {
    return {
      macroCategory: 'Needs',
      category: 'Acqua',
      tags: ['#utenze', '#acqua', '#casa'],
      autoCategorized: true,
    };
  }

  if (desc.includes('TELECOM ITALIA') || desc.includes('TIM') || desc.includes('VODAFONE') || desc.includes('FASTWEB') || desc.includes('ILIAD')) {
    return {
      macroCategory: 'Needs',
      category: 'Fibra e Connettività',
      tags: ['#fibra', '#internet', '#telefono'],
      autoCategorized: true,
    };
  }

  if (desc.includes('GESTIONE CARTE CONAD') || desc.includes('CONAD') || desc.includes('ESSELUNGA') || desc.includes('COOP') || desc.includes('LIDL') || desc.includes('CARREFOUR')) {
    return {
      macroCategory: 'Needs',
      category: 'Spesa Alimentare',
      tags: ['#supermercato', '#cibo', '#spesa'],
      autoCategorized: true,
    };
  }

  if (desc.includes('CONDOMINIO BETULLA') || desc.includes('CONDOMINIO')) {
    return {
      macroCategory: 'Needs',
      category: 'Spese Condominiali',
      tags: ['#condominio', '#casa', '#fisse'],
      autoCategorized: true,
    };
  }

  if (desc.includes('FARMACIA') || desc.includes('MEDICO') || desc.includes('ANALISI CLINICHE') || desc.includes('DENTISTA')) {
    return {
      macroCategory: 'Needs',
      category: 'Salute e Farmacia',
      tags: ['#salute', '#farmacia'],
      autoCategorized: true,
    };
  }

  // Commitments: Finanziamenti, Prestiti, Donazioni
  if (desc.includes('COFIDIS') || desc.includes('COMPASS BANCA') || desc.includes('COMPASS') || desc.includes('VORWERK ITALIA') || desc.includes('VORWERK') || desc.includes('BIMBY') || desc.includes('TIMFIN') || desc.includes('FINDOMESTIC') || desc.includes('SANTANDER')) {
    return {
      macroCategory: 'Commitments',
      category: 'Rate Finanziamenti',
      tags: ['#finanziamento', '#rate', '#impegno'],
      autoCategorized: true,
    };
  }

  if (desc.includes('UNHCR') || desc.includes('LAV LEGA ANTI VIVISEZIONE') || desc.includes('LAV') || desc.includes('MEDICI SENZA FRONTIERE') || desc.includes('EMERGENCY')) {
    return {
      macroCategory: 'Commitments',
      category: 'Donazioni & Volontariato',
      tags: ['#donazione', '#onlus'],
      autoCategorized: true,
    };
  }

  // Transito / Carte
  if (desc.includes('PAYPAL EUROPE') || desc.includes('PAYPAL')) {
    return {
      macroCategory: 'Wants',
      category: 'Shopping PayPal',
      tags: ['#paypal', '#shopping', '#online'],
      autoCategorized: true,
    };
  }

  if (desc.includes('NEXI PAYMENTS') || desc.includes('NUMIA') || desc.includes('ADDEBITO CARTA')) {
    return {
      macroCategory: 'Commitments',
      category: 'Transito Carta di Credito',
      tags: ['#cartadicredito', '#transito'],
      autoCategorized: true,
    };
  }

  // Spese e Costi bancari / Carta
  if (desc.includes('COSTO EMISSIONE') || desc.includes('IMPOSTA DI BOLLO') || desc.includes('CANONE CONTO') || desc.includes('BOLLO')) {
    return {
      macroCategory: 'Needs',
      category: 'Spese Bancarie e Bolli',
      tags: ['#banca', '#costotenuta'],
      autoCategorized: true,
    };
  }

  // Wants: Shopping, Hobby, Ristorazione, Mobilità
  if (desc.includes('AMAZON') || desc.includes('AMZN')) {
    return {
      macroCategory: 'Wants',
      category: 'Shopping Amazon',
      tags: ['#amazon', '#shopping'],
      autoCategorized: true,
    };
  }

  if (desc.includes('GOOGLE PLAY') || desc.includes('APPLE.COM') || desc.includes('NETFLIX') || desc.includes('SPOTIFY') || desc.includes('PRIME VIDEO')) {
    return {
      macroCategory: 'Wants',
      category: 'Abbonamenti Digitali',
      tags: ['#abbonamento', '#streaming', '#digitale'],
      autoCategorized: true,
    };
  }

  if (desc.includes('RISTORANTE') || desc.includes('PIZZERIA') || desc.includes('BAR') || desc.includes('CAFFE') || desc.includes('MCDONALD') || desc.includes('BURGER KING') || desc.includes('JUST EAT') || desc.includes('DELIVEROO')) {
    return {
      macroCategory: 'Wants',
      category: 'Ristorazione e Bar',
      tags: ['#ristorante', '#svago'],
      autoCategorized: true,
    };
  }

  if (desc.includes('CINEMA') || desc.includes('TEATRO') || desc.includes('TICKETONE') || desc.includes('CONCERTO')) {
    return {
      macroCategory: 'Wants',
      category: 'Tempo Libero e Cinema',
      tags: ['#cinema', '#cultura', '#svago'],
      autoCategorized: true,
    };
  }

  if (desc.includes('AUTOSTRADE') || desc.includes('ASPIT') || desc.includes('TELEPASS') || desc.includes('ENI STATION') || desc.includes('Q8') || desc.includes('IP ') || desc.includes('CARBURANTE')) {
    return {
      macroCategory: 'Needs',
      category: 'Trasporti e Carburante',
      tags: ['#trasporti', '#auto', '#pedaggi'],
      autoCategorized: true,
    };
  }

  // Extraordinary
  if (desc.includes('RISTRUTTURAZIONE') || desc.includes('INFISSI') || desc.includes('BONIFICO PARLANTE') || desc.includes('LAVORI STRAORDINARI')) {
    return {
      macroCategory: 'Extraordinary',
      category: 'Lavori Straordinari Casa',
      tags: ['#straordinaria', '#casa', '#ristrutturazione'],
      isExtraordinary: true,
      autoCategorized: true,
    };
  }

  // Default fallback
  return {
    macroCategory: 'Wants',
    category: 'Varie ed Eventuali',
    tags: ['#generico'],
    autoCategorized: false,
  };
}
