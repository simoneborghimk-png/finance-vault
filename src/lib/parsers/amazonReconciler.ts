import { Transaction, MacroCategory } from '@/types/finance';

export interface AmazonOrderRaw {
  date: string;
  total: string;
  items: string;
}

const ITALIAN_MONTHS: Record<string, string> = {
  gennaio: '01',
  febbraio: '02',
  marzo: '03',
  aprile: '04',
  maggio: '05',
  giugno: '06',
  luglio: '07',
  agosto: '08',
  settembre: '09',
  ottobre: '10',
  novembre: '11',
  dicembre: '12',
};

export function parseItalianDateToIso(dStr: string): string | null {
  if (!dStr) return null;
  const parts = dStr.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = ITALIAN_MONTHS[parts[1].toLowerCase()] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
}

export function parseItalianAmount(totalStr: string): number {
  if (!totalStr) return 0;
  const clean = totalStr.replace(/\./g, '').replace(',', '.').trim();
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

export interface ItemClassification {
  category: string;
  macroCategory: MacroCategory;
  tags: string[];
  cleanTitle: string;
}

/**
 * Granular classification of Amazon item descriptions
 */
export function classifyAmazonItem(rawItems: string): ItemClassification {
  const s = rawItems.toLowerCase();

  // 1. Abbonamenti Digitali
  if (s.includes('audible') || s.includes('prime')) {
    return {
      category: 'Abbonamenti Digitali',
      macroCategory: 'Wants',
      tags: ['#amazon', '#abbonamento', '#digitale'],
      cleanTitle: s.includes('prime') ? 'Amazon Prime (Annuale)' : 'Abbonamento Audible',
    };
  }

  // 2. Libri, Guide e Fumetti
  if (s.includes('divina commedia') || s.includes('character guide') || s.includes('libro') || s.includes('fumett') || s.includes('manga')) {
    let cleanTitle = 'Libro / Fumetto Amazon';
    if (s.includes('divina commedia')) cleanTitle = 'Divina Commedia Ediz. Illustrata';
    else if (s.includes('character guide') || s.includes('pokémon')) cleanTitle = 'Pokémon Deluxe Character Guide';
    return {
      category: 'Libri e Fumetti',
      macroCategory: 'Wants',
      tags: ['#amazon', '#libri', '#cultura'],
      cleanTitle,
    };
  }

  // 3. Animali e Veterinario
  if (s.includes('seresto') || s.includes('trasportino') || s.includes('tappetino rinfrescante') || s.includes('antiparassitario') || s.includes('rullo leva pelucchi') || s.includes('peli animali')) {
    let cleanTitle = 'Articoli Cura Animali';
    if (s.includes('seresto')) cleanTitle = 'Seresto Collare Antiparassitario Gatti';
    else if (s.includes('trasportino')) cleanTitle = 'Morpilot Trasportino Gatti';
    else if (s.includes('tappetino rinfrescante')) cleanTitle = 'Bravpet Tappetino Rinfrescante Gatti';
    else if (s.includes('leva pelucchi')) cleanTitle = 'Tydi Rullo Leva Pelucchi Animali';
    return {
      category: 'Animali e Veterinario',
      macroCategory: 'Needs',
      tags: ['#amazon', '#animali', '#pet'],
      cleanTitle,
    };
  }

  // 4. Salute e Farmacia
  if (s.includes('vivin tosse') || s.includes('marial') || s.includes('neuromag') || s.includes('magnesio') || s.includes('termoforo') || s.includes('autan') || s.includes('antiacido')) {
    let cleanTitle = 'Farmacia e Salute';
    if (s.includes('vivin tosse')) cleanTitle = 'Vivin Tosse Complete 3in1';
    else if (s.includes('marial') || s.includes('neuromag')) cleanTitle = 'Aurora Biofarma Marial + NeuroMAG Magnesio';
    else if (s.includes('termoforo')) cleanTitle = 'Imetec Intellisense Feel Termoforo';
    else if (s.includes('autan')) cleanTitle = 'Autan Active Spray Antizanzare (2x100ml)';
    return {
      category: 'Salute e Farmacia',
      macroCategory: 'Needs',
      tags: ['#amazon', '#salute', '#farmacia'],
      cleanTitle,
    };
  }

  // 5. Cura Personale
  if (s.includes('spazzolino') || s.includes('docciaschiuma') || s.includes('bagnoschiuma') || s.includes('shampoo') || s.includes('collutorio') || s.includes('cerave') || s.includes('rasoio braun') || s.includes('nivea')) {
    let cleanTitle = 'Cura Personale';
    if (s.includes('spazzolino')) cleanTitle = 'Liquidraw Portaspazzolino Roll Up';
    else if (s.includes('docciaschiuma') || s.includes('vidal')) cleanTitle = 'Vidal Docciaschiuma Sport';
    else if (s.includes('collutorio') || s.includes('colgate')) cleanTitle = 'Colgate Collutorio Plax (2x500ml)';
    else if (s.includes('cerave')) cleanTitle = 'CeraVe Lozione Idratante 1L';
    else if (s.includes('rasoio') || s.includes('braun')) cleanTitle = 'Testina Rasoio Braun Series 3';
    else if (s.includes('nivea')) cleanTitle = 'Nivea Men Deodorante Spray';
    return {
      category: 'Cura Personale',
      macroCategory: 'Wants',
      tags: ['#amazon', '#curapersonale', '#benessere'],
      cleanTitle,
    };
  }

  // 6. Spesa Alimentare e BBQ
  if (s.includes('haribo') || s.includes('m&m') || s.includes('capsule nespresso') || s.includes('eridania') || s.includes('barretta proteica') || s.includes('protein bar') || s.includes('barebells') || s.includes('premier protein') || s.includes('mirtilli') || s.includes('kraken') || s.includes('cannamela') || s.includes('bbq chicken rub') || s.includes('rub - miscele')) {
    let cleanTitle = 'Alimentari e Spesa';
    if (s.includes('haribo')) cleanTitle = 'Haribo Rainbow Pixel + Coccodri Frizzi';
    else if (s.includes('m&m')) cleanTitle = "M&M's Confetti Arachidi (24 bustine)";
    else if (s.includes('nespresso')) cleanTitle = 'Capsule Nespresso Ispirazione Italiana (100pz)';
    else if (s.includes('eridania')) cleanTitle = 'Eridania Zero Dolcificante Liquido';
    else if (s.includes('barebells')) cleanTitle = 'Barebells Barrette Proteiche Salty Peanut';
    else if (s.includes('premier protein')) cleanTitle = 'Premier Protein Barrette Deluxe 40%';
    else if (s.includes('mirtilli')) cleanTitle = 'nut&me Mirtilli Liofilizzati 350g';
    else if (s.includes('kraken')) cleanTitle = 'The Kraken Black Spiced Rum 70cl';
    else if (s.includes('cannamela') || s.includes('rub')) cleanTitle = 'Cannamela Aglio + BBQ Chicken Rub';
    return {
      category: 'Spesa Alimentare',
      macroCategory: 'Needs',
      tags: ['#amazon', '#spesa', '#cibo'],
      cleanTitle,
    };
  }

  // 7. Gaming, VR e Hobby
  if (s.includes('switch 2') || s.includes('pokopia') || s.includes('playtrek') || s.includes('bandai') || s.includes('gunpla') || s.includes('sapientino') || s.includes('quest') || s.includes('oculus') || s.includes('vr')) {
    let cleanTitle = 'Gaming e Hobby';
    if (s.includes('sapientino')) cleanTitle = 'Clementoni Sapientino Raccontastorie';
    else if (s.includes('pokopia')) cleanTitle = 'Pokémon Pokopia - Nintendo Switch 2';
    else if (s.includes('switch 2') && s.includes('console')) cleanTitle = 'Nintendo Console Switch 2';
    else if (s.includes('playtrek')) cleanTitle = 'Custodia Turtle Beach PlayTrek Switch 2';
    else if (s.includes('bandai')) cleanTitle = 'Bandai Spirits 30MS Model Kit';
    else if (s.includes('vr') || s.includes('quest')) cleanTitle = 'Accessori Meta Quest VR';
    return {
      category: 'Gaming e Hobby',
      macroCategory: 'Wants',
      tags: ['#amazon', '#gaming', '#hobby'],
      cleanTitle,
    };
  }

  // 8. Abbigliamento e Shopping
  if (s.includes('tuta') || s.includes('felpa') || s.includes('boxer') || s.includes('calvin klein') || s.includes('magliett') || s.includes('navigare') || s.includes('jack & jones') || s.includes('guanti riscaldati')) {
    let cleanTitle = 'Abbigliamento';
    if (s.includes('perseo')) cleanTitle = 'Perseo Sport Tuta Felpata Uomo';
    else if (s.includes('calvin klein')) cleanTitle = 'Calvin Klein Boxer Uomo (3 Pack)';
    else if (s.includes('navigare')) cleanTitle = 'Navigare 512 Magliette Intime (3 Pack)';
    else if (s.includes('jack & jones')) cleanTitle = 'Jack & Jones Felpa Noos + Essentials Magliette';
    else if (s.includes('guanti')) cleanTitle = 'Piashow Guanti Riscaldati Elettrici USB';
    return {
      category: 'Shopping e Abbigliamento',
      macroCategory: 'Wants',
      tags: ['#amazon', '#abbigliamento', '#moda'],
      cleanTitle,
    };
  }

  // 9. Casa, Arredo, Giardino, Fai da te e BBQ
  let homeTitle = 'Articoli Casa e Giardino';
  if (s.includes('zenwifi') || s.includes('mesh')) homeTitle = 'ASUS ZenWiFi BT10 Mesh WiFi 7 (2pz)';
  else if (s.includes('chanteclair')) homeTitle = 'Chanteclair Detersivo Lavatrice Muschio Bianco';
  else if (s.includes('wc net')) homeTitle = 'Wc Net Candeggina Gel Profumata (4x700ml)';
  else if (s.includes('pattex')) homeTitle = 'Pattex Millechiodi Forte & Rapido';
  else if (s.includes('heftman')) homeTitle = 'HEFTMAN Barattoli Fermentazione Kimchi/Kefir (2x2L)';
  else if (s.includes('lagostina')) homeTitle = 'Lagostina Frusta Silicone Cucina';
  else if (s.includes('lenzuola')) homeTitle = 'Completo Lenzuola Matrimoniali Cotone 100%';
  else if (s.includes('spontex')) homeTitle = 'Spontex Panni Spugna Cellulosa';
  else if (s.includes('deleycon')) homeTitle = 'deleyCON Box Cavi Organizer Multipresa';
  else if (s.includes('finish') && s.includes('sale')) homeTitle = 'Finish Sale Lavastoviglie 1kg';
  else if (s.includes('finish') && s.includes('cura')) homeTitle = 'Finish Curalavastoviglie (3x250ml)';
  else if (s.includes('aeratore') || s.includes('scarpe per unghie')) homeTitle = 'Gardena Rastrello + Scarpe Aeratore Prato';
  else if (s.includes('lerava') && s.includes('autunno')) homeTitle = 'LERAVA Concime Prato Autunno 185mq';
  else if (s.includes('lerava') && s.includes('estate')) homeTitle = 'LERAVA Concime Prato Estate 100mq';
  else if (s.includes('rame e zolfo')) homeTitle = 'LERAVA Rame e Zolfo Fungicida Naturale 700ml';
  else if (s.includes('semi per prato') || s.includes('starter')) homeTitle = 'R&R Semi Prato Resistente 5kg + Concime Starter';
  else if (s.includes('stallatico')) homeTitle = 'Lo Stallatico Concime Organico 4kg';
  else if (s.includes('weber') && s.includes('chips')) homeTitle = 'Weber Miscela Chips Affumicatura BBQ';
  else if (s.includes('weber') && s.includes('spray')) homeTitle = 'Weber Spray Protettivo Ghisa Barbecue';
  else if (s.includes('rösle') || s.includes('torcia')) homeTitle = 'RÖSLE Torcia LED Barbecue';
  else if (s.includes('spruzzino olio')) homeTitle = 'PORTENTUM Spruzzino Olio Friggitrice Aria';
  else if (s.includes('piatti fondi')) homeTitle = 'Set Piatti Fondi Silver Night (22cm)';
  else if (s.includes('bicchieri') || s.includes('stölzle')) homeTitle = 'Stölzle Lausitz Bicchieri Champagne Prestige (6pz)';
  else if (s.includes('gardena') && s.includes('manico')) homeTitle = 'Gardena Manico Telescopico Combisystem';
  else if (s.includes('gardena') && s.includes('scopa')) homeTitle = 'Gardena Scopa Regolabile Foglie Combisystem';
  else if (s.includes('gardena') && s.includes('micro-drip')) homeTitle = 'Gardena Micro-Drip Irrigazione + Claber Tubo 50m';
  else if (s.includes('bwintech')) homeTitle = 'Bwintech Gomito Inox 3/4" BSP (3pz)';
  else if (s.includes('staffe a u')) homeTitle = 'Staffe a U Blocco Sicurezza Porta Blindata (2pz)';
  else if (s.includes('virosac')) homeTitle = 'Virosac Sacchetti Rifiuti Biodegradabili';
  else if (s.includes('buste imbottite')) homeTitle = 'Buste Imbottite Spedizioni a Bolle';
  else if (s.includes('telecomando')) homeTitle = 'Telecomando Universale Sony Bravia / Telesystem';

  return {
    category: 'Casa, Arredo e Brico',
    macroCategory: 'Wants',
    tags: ['#amazon', '#casa', '#brico'],
    cleanTitle: homeTitle,
  };
}

/**
 * Known explicit matches for split shipments, installments, and bundled orders
 */
const SPECIAL_AMAZON_MAP: Record<string, { desc: string; category: string; macroCategory: MacroCategory; tags: string[] }> = {
  // Piani rateali Amazon (tasso zero)
  '2026-10-23_-134.92': { desc: 'Amazon: Rata LG OLED evo 65" G5 TV (4/12)', category: 'Rate Finanziamenti', macroCategory: 'Commitments', tags: ['#rata', '#amazon', '#tv', '#lgoled'] },
  '2026-08-24_-134.92': { desc: 'Amazon: Rata LG OLED evo 65" G5 TV (3/12)', category: 'Rate Finanziamenti', macroCategory: 'Commitments', tags: ['#rata', '#amazon', '#tv', '#lgoled'] },
  '2026-07-25_-134.92': { desc: 'Amazon: Rata LG OLED evo 65" G5 TV (2/12)', category: 'Rate Finanziamenti', macroCategory: 'Commitments', tags: ['#rata', '#amazon', '#tv', '#lgoled'] },
  '2026-06-25_-134.92': { desc: 'Amazon: Rata LG OLED evo 65" G5 TV (1/12)', category: 'Rate Finanziamenti', macroCategory: 'Commitments', tags: ['#rata', '#amazon', '#tv', '#lgoled'] },

  '2026-10-12_-77.8': { desc: 'Amazon: Rata Samsung Galaxy Watch9 44mm (3/5)', category: 'Rate Finanziamenti', macroCategory: 'Commitments', tags: ['#rata', '#amazon', '#watch', '#samsung'] },
  '2026-09-12_-77.8': { desc: 'Amazon: Rata Samsung Galaxy Watch9 44mm (2/5)', category: 'Rate Finanziamenti', macroCategory: 'Commitments', tags: ['#rata', '#amazon', '#watch', '#samsung'] },
  '2026-08-14_-77.8': { desc: 'Amazon: Rata Samsung Galaxy Watch9 44mm (1/5)', category: 'Rate Finanziamenti', macroCategory: 'Commitments', tags: ['#rata', '#amazon', '#watch', '#samsung'] },

  // Abbonamento Amazon Prime
  '2026-08-30_-49.9': { desc: 'Amazon Prime (Abbonamento Annuale)', category: 'Abbonamenti Digitali', macroCategory: 'Wants', tags: ['#amazon', '#prime', '#abbonamento'] },

  // Spedizioni frazionate o ordini multi-item
  '2026-09-28_-6.26': { desc: 'Amazon: Spugna Barbecue e Pentole IDEA HOME (Spedizione 1)', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa', '#bbq'] },
  '2026-09-28_-67.47': { desc: 'Amazon: Aurora Biofarma Marial + NeuroMAG Magnesio (Spedizione 2)', category: 'Salute e Farmacia', macroCategory: 'Needs', tags: ['#amazon', '#salute', '#farmacia'] },

  '2026-07-17_-271.29': { desc: 'Amazon: Gruppi di Continuità EPYC Nytro 1500VA + Neon 650VA UPS', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#tech', '#ups'] },
  '2026-07-17_-72': { desc: 'Amazon: DeepClean Anticalcare + Capsule Nespresso + Quasar Vetri', category: 'Spesa Alimentare', macroCategory: 'Needs', tags: ['#amazon', '#spesa', '#cibo'] },

  '2026-06-02_-49.98': { desc: 'Amazon: KIWI Design Cinturino Elite Meta Quest 2', category: 'Gaming e Hobby', macroCategory: 'Wants', tags: ['#amazon', '#gaming', '#vr'] },
  '2026-06-02_-12.99': { desc: 'Amazon: Pokémon Deluxe Character Guide', category: 'Libri e Fumetti', macroCategory: 'Wants', tags: ['#amazon', '#libri', '#pokemon'] },

  '2026-05-14_-57.08': { desc: 'Amazon: LERAVA Concime Estate + Caraffa Arcoroc + Cover Switch 2', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa', '#giardino'] },
  '2026-05-04_-101.99': { desc: 'Amazon: Premier Protein Bar + Gardena Micro-Drip + Claber Tubo', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa', '#giardino'] },

  '2026-04-22_-34.34': { desc: 'Amazon: Tydi Rullo Leva Pelucchi Animali 5 Ricariche', category: 'Animali e Veterinario', macroCategory: 'Needs', tags: ['#amazon', '#animali', '#pet'] },
  '2026-04-22_-13.25': { desc: 'Amazon: Gardena Manico Telescopico Combisystem', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa', '#giardino'] },

  '2026-02-19_-75.79': { desc: 'Amazon: R&R Semi Prato Resistente 5kg + Concime Starter + Stallatico', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa', '#giardino', '#prato'] },

  '2026-02-07_-23.37': { desc: 'Amazon: Testina Rasoio Braun Series 3 + Telecomando Sony + Gomma', category: 'Cura Personale', macroCategory: 'Wants', tags: ['#amazon', '#curapersonale', '#braun'] },

  '2026-01-19_-20.09': { desc: 'Amazon: The Kraken Black Spiced Rum 70cl', category: 'Spesa Alimentare', macroCategory: 'Needs', tags: ['#amazon', '#spesa', '#alcolici'] },
  '2026-01-16_-19.8': { desc: 'Amazon: Navigare 512 Magliette Intime Cotone (Pacco da 3)', category: 'Shopping e Abbigliamento', macroCategory: 'Wants', tags: ['#amazon', '#abbigliamento'] },

  '2025-12-30_-22.9': { desc: 'Amazon: Amazon Essentials Magliette Intime Girocollo (Pacco da 6)', category: 'Shopping e Abbigliamento', macroCategory: 'Wants', tags: ['#amazon', '#abbigliamento'] },
  '2025-12-30_-24.7': { desc: 'Amazon: Jack & Jones Felpa Noos + Weber Detergente Grill', category: 'Shopping e Abbigliamento', macroCategory: 'Wants', tags: ['#amazon', '#abbigliamento'] },

  '2025-12-13_-36.35': { desc: 'Amazon: Bandai Gunpla 30MS + Vidal + Shampoo L\'Angelica + Nivea', category: 'Gaming e Hobby', macroCategory: 'Wants', tags: ['#amazon', '#gaming', '#hobby'] },

  '2025-11-21_-72.47': { desc: 'Amazon: Tuta Perseo Sport + Spazzola Velluto + Seresto Collare Gatti', category: 'Shopping e Abbigliamento', macroCategory: 'Wants', tags: ['#amazon', '#abbigliamento'] },

  '2025-11-07_-28.4': { desc: 'Amazon: Articoli per la Cura e Pulizia della Casa', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa'] },
  '2025-11-05_-23.33': { desc: 'Amazon: Articoli Ferramenta e Manutenzione Casa', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa'] },
  '2025-11-05_-68': { desc: 'Amazon: Divina Commedia Edizione Illustrata', category: 'Libri e Fumetti', macroCategory: 'Wants', tags: ['#amazon', '#libri', '#cultura'] },
  '2025-11-03_-44.8': { desc: 'Amazon: Accessori e Forniture Casa', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa'] },
  '2025-11-03_-12.9': { desc: 'Amazon: Cura e Pulizia Superfici Casa', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa'] },
  '2025-10-25_-15.99': { desc: 'Amazon: Forniture e Utilità Domestiche', category: 'Casa, Arredo e Brico', macroCategory: 'Wants', tags: ['#amazon', '#casa'] }
};

/**
 * Main Reconciler: Reconcile all bank/card Amazon transactions with extracted Amazon orders
 */
export function reconcileAmazonTransactions(
  transactions: Transaction[],
  ordersRaw: AmazonOrderRaw[]
): Transaction[] {
  // Pre-parse orders
  const parsedOrders = ordersRaw.map((o) => ({
    dateStr: parseItalianDateToIso(o.date),
    amount: parseItalianAmount(o.total),
    items: o.items,
    classification: classifyAmazonItem(o.items),
  }));

  const usedOrderIndices = new Set<number>();

  return transactions.map((t) => {
    // Only reconcile transactions related to Amazon
    const isAmazon = /amzn|amazon/i.test(t.description) || /amzn|amazon/i.test(t.rawDescription || '');
    if (!isAmazon) return t;

    // Check special explicit maps first (handles installments, Prime, split shipments)
    const specialKey = `${t.date}_${t.amount}`;
    if (SPECIAL_AMAZON_MAP[specialKey]) {
      const match = SPECIAL_AMAZON_MAP[specialKey];
      return {
        ...t,
        description: match.desc,
        category: match.category,
        macroCategory: match.macroCategory,
        tags: match.tags,
        autoCategorized: true,
      };
    }

    // Try finding direct match in parsed orders by amount and date tolerance (within 10 days)
    const tAmt = Math.abs(t.amount);
    const tTime = new Date(t.date).getTime();
    let bestIdx = -1;
    let minDaysDiff = Infinity;

    for (let i = 0; i < parsedOrders.length; i++) {
      if (usedOrderIndices.has(i)) continue;
      const order = parsedOrders[i];
      if (Math.abs(order.amount - tAmt) < 0.01 && order.dateStr) {
        const orderTime = new Date(order.dateStr).getTime();
        const daysDiff = Math.abs(tTime - orderTime) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 10 && daysDiff < minDaysDiff) {
          minDaysDiff = daysDiff;
          bestIdx = i;
        }
      }
    }

    if (bestIdx !== -1) {
      usedOrderIndices.add(bestIdx);
      const matchedOrder = parsedOrders[bestIdx];
      const cls = matchedOrder.classification;
      return {
        ...t,
        description: `Amazon: ${cls.cleanTitle}`,
        category: cls.category,
        macroCategory: cls.macroCategory,
        tags: cls.tags,
        autoCategorized: true,
      };
    }

    // Fallback if not matched: keep as Shopping Amazon or classify based on description
    return {
      ...t,
      description: t.description.startsWith('Amazon:') ? t.description : `Amazon: ${t.description.replace(/^(amazon eu s\.a r\.l\.|amazon payments europe s\.c\.a\.|amazon\.it\*?|amzn mktp it\*?|www\.amazon\.\*?)\s*/i, '').trim() || 'Acquisto Online'}`,
      autoCategorized: true,
    };
  });
}
