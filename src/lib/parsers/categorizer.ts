import { MacroCategory } from '@/types/finance';

export interface CategorizationResult {
  macroCategory: MacroCategory;
  category: string;
  tags: string[];
  isExtraordinary?: boolean;
  autoCategorized: boolean;
}

/**
 * Categorize a transaction description with strict boundaries and granular matching
 * Avoids substring false positives (e.g. "GAS" matching "GASTROMACELLERIA", "ACQUA" matching "ACQUARIO")
 */
export function categorizeDescription(
  rawDesc: string,
  amount: number,
  channel?: string
): CategorizationResult {
  const desc = (rawDesc || '').toUpperCase().trim();

  // ==========================================
  // 1. ENTRATE (amount > 0)
  // ==========================================
  if (amount > 0) {
    // Stipendio e Competenze Lavoro
    if (
      desc.includes('CLOUDFIRE') ||
      desc.includes('STIPENDIO') ||
      desc.includes('EMOLUMENTI') ||
      desc.includes('COMPETENZE')
    ) {
      return {
        macroCategory: 'Savings',
        category: 'Stipendio Ordinario',
        tags: ['#stipendio', '#lavoro', '#ricorrente'],
        autoCategorized: true,
      };
    }

    // Fisco & Rimborsi 730
    if (
      desc.includes('730') ||
      desc.includes('AGENZIA DELLE ENTRATE') ||
      desc.includes('RIMBORSO FISCALE')
    ) {
      return {
        macroCategory: 'Savings',
        category: 'Rimborso 730',
        tags: ['#fisco', '#730', '#rimborso'],
        autoCategorized: true,
      };
    }

    // Regali e Aiuti Familiari
    if (
      desc.includes('BORGHI LUCIO') ||
      desc.includes('PAPI IVETTA') ||
      desc.includes('REGALO PIREDDA') ||
      (desc.includes('REGALO') && amount >= 100)
    ) {
      return {
        macroCategory: 'Savings',
        category: 'Regali e Aiuti Familiari',
        tags: ['#famiglia', '#regalo', '#straordinaria'],
        isExtraordinary: true,
        autoCategorized: true,
      };
    }

    // Vendite Second-Hand (Vinted, Subito, eBay)
    if (desc.includes('VINTED') || desc.includes('MANGOPAY') || desc.includes('SUBITO')) {
      return {
        macroCategory: 'Savings',
        category: 'Vendite Second-Hand',
        tags: ['#vinted', '#secondhand', '#entrate'],
        autoCategorized: true,
      };
    }

    // Interessi e Rendite Bancarie
    if (desc.includes('INTERESSI') || desc.includes('INT. E COMP.')) {
      return {
        macroCategory: 'Savings',
        category: 'Interessi e Rendite',
        tags: ['#interessi', '#banca', '#rendita'],
        autoCategorized: true,
      };
    }

    // Storni e Riaccrediti Tecnici
    if (desc.includes('STORNO') || desc.includes('RIMBORSO COMM')) {
      return {
        macroCategory: 'Savings',
        category: 'Rimborsi e Storni',
        tags: ['#storno', '#rimborso'],
        autoCategorized: true,
      };
    }

    // Rimborsi e quote amici (Cene, Grigliate, Eventi via PayPal/Satispay/Bonifico)
    return {
      macroCategory: 'Savings',
      category: 'Rimborsi e Quote Amici',
      tags: ['#amici', '#quote', '#rimborso', '#spesacomune'],
      autoCategorized: true,
    };
  }

  // ==========================================
  // 2. USCITE (amount < 0)
  // ==========================================

  // --- SPESE STRAORDINARIE (Lavori, Ristrutturazioni, Opere Casa) ---
  if (
    desc.includes('MICHELE MARUCCIA') ||
    desc.includes('DE BIASI AUTOMATISMI') ||
    desc.includes('000053-2025') ||
    desc.includes('003464/25')
  ) {
    return {
      macroCategory: 'Extraordinary',
      category: 'Ristrutturazione e Opere Casa',
      tags: ['#straordinaria', '#casa', '#lavori', '#fattura'],
      isExtraordinary: true,
      autoCategorized: true,
    };
  }

  // --- PREVIDENZA & RISPARMIO (Savings) ---
  if (
    desc.includes('ORIZZONTE PREVIDENZA') ||
    desc.includes('FONDO PENSIONE') ||
    desc.includes('POLIZZA 501.505.442') ||
    desc.includes('FON.TE')
  ) {
    return {
      macroCategory: 'Savings',
      category: 'Previdenza Integrativa',
      tags: ['#previdenza', '#fondo', '#deducibile', '#pensione'],
      autoCategorized: true,
    };
  }

  // --- BISOGNI PRIMARI (Needs) ---

  // Spese Condominiali
  if (
    desc.includes('CONDOMINIAL') ||
    desc.includes('CONDOMINIO') ||
    desc.includes('RATA CONDOMINIALE')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Spese Condominiali',
      tags: ['#condominio', '#casa', '#fisse'],
      autoCategorized: true,
    };
  }

  // Tassa Rifiuti (TARI)
  if (desc.includes('IREN AMBIENTE') || desc.includes('TARI') || desc.includes('TASSA RIFIUTI')) {
    return {
      macroCategory: 'Needs',
      category: 'Tassa Rifiuti (TARI)',
      tags: ['#tari', '#rifiuti', '#casa', '#utenze'],
      autoCategorized: true,
    };
  }

  // Utenze Luce e Gas
  // ATTENZIONE: usare regex con word boundaries per non matchare GASTROMACELLERIA!
  const hasGas = /\b(GAS|METANO)\b/.test(desc) && !desc.includes('GASTRO');
  const hasLuce = /\b(LUCE|ENEL|HERA|ENERGIA ELETTRICA)\b/.test(desc);
  if (desc.includes('IREN MERCATO') || desc.includes('ENEL ENERGIA') || desc.includes('HERA COMM') || hasGas || hasLuce) {
    return {
      macroCategory: 'Needs',
      category: 'Utenze Luce e Gas',
      tags: ['#utenze', '#bolletta', '#lucegas'],
      autoCategorized: true,
    };
  }

  // Acqua (escludere esplicitamente ACQUARIO)
  if (
    (desc.includes('ARCA S.R.L.') || desc.includes('ARCA SRL') || desc.includes('ACQUEDOTTO') || /\bACQUA\b/.test(desc)) &&
    !desc.includes('ACQUARIO')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Acqua',
      tags: ['#utenze', '#acqua', '#casa'],
      autoCategorized: true,
    };
  }

  // Fibra, Connettività e Cellulare
  if (
    desc.includes('TELECOM') ||
    desc.includes('TIM ') ||
    desc.includes('VODAFONE') ||
    desc.includes('FASTWEB') ||
    desc.includes('ILIAD') ||
    desc.includes('WINDTRE')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Fibra e Connettività',
      tags: ['#fibra', '#internet', '#telefono', '#connettivita'],
      autoCategorized: true,
    };
  }

  // Assicurazioni (Auto, Vita, Casa)
  if (
    desc.includes('PRIMA ASSICURAZIONI') ||
    desc.includes('ASSICURAZIONE') ||
    desc.includes('UNIPOL') ||
    desc.includes('ALLIANZ') ||
    desc.includes('GENERTEL')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Assicurazioni',
      tags: ['#assicurazione', '#auto', '#polizza'],
      autoCategorized: true,
    };
  }

  // Manutenzione Auto, Tagliandi, Revisioni e Officina
  if (
    desc.includes('ZATTI') ||
    desc.includes('REVISIONI') ||
    desc.includes('SECUR GLASS') ||
    desc.includes('OFFICINA') ||
    desc.includes('GOMMISTA') ||
    desc.includes('CARROZZERIA')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Manutenzione Auto e Revisioni',
      tags: ['#auto', '#manutenzione', '#tagliando', '#revisione'],
      autoCategorized: true,
    };
  }

  // Carburante e Trasporti (Pedaggi, Metro, Treni, Parcheggi)
  if (
    desc.includes('DISTRIBUTORE') ||
    desc.includes('ELP VILLA CELLA') ||
    desc.includes('VEGA CARBURANTI') ||
    desc.includes('ENI ') ||
    desc.includes('Q8') ||
    desc.includes('IP ') ||
    desc.includes('CARBURANTE') ||
    desc.includes('BENZINA') ||
    desc.includes('AUTOSTRADE') ||
    desc.includes('TELEPASS') ||
    desc.includes('ASPIT') ||
    desc.includes('SAN DONATO M3') ||
    desc.includes('DUOMO M3') ||
    desc.includes('METRO') ||
    desc.includes('TRENITALIA') ||
    desc.includes('PARCHEGGIO') ||
    desc.includes('SERIATE 010') ||
    desc.includes('CASALPUSTERLENGO 016') ||
    desc.includes('REGGIO EMILIA 010') ||
    desc.includes('MODENA SUD 010') ||
    desc.includes('MILANO SUD 010')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Trasporti e Carburante',
      tags: ['#trasporti', '#auto', '#carburante', '#pedaggi'],
      autoCategorized: true,
    };
  }

  // Spesa Alimentare, Supermercato, Gastronomia, Macelleria, Panificio, Vini
  if (
    desc.includes('GASTROMACELLERIA') ||
    desc.includes('CONAD') ||
    desc.includes('ESSELUNGA') ||
    desc.includes('COOP') ||
    desc.includes('LIDL') ||
    desc.includes('CARREFOUR') ||
    desc.includes('PANIFICIO') ||
    desc.includes('SUPERMERCATO') ||
    desc.includes('ALIMENTARI') ||
    desc.includes('MARKET ST. ANTON') ||
    desc.includes('PALADINI') ||
    desc.includes('TOO GOOD TO GO') ||
    desc.includes('TGTG ') ||
    desc.includes('CANTINA DELLA VOLTA') ||
    desc.includes('GLUGULP') ||
    desc.includes('VINATIS') ||
    desc.includes('IPER ORIO') ||
    desc.includes('NESPRESSO') ||
    desc.includes('HARIBO') ||
    desc.includes('M&M') ||
    desc.includes('ERIDANIA') ||
    desc.includes('BAREBELLS') ||
    desc.includes('PREMIER PROTEIN') ||
    desc.includes('KRAKEN') ||
    desc.includes('BBQ CHICKEN RUB') ||
    desc.includes('MIRTILLI LIOFILIZZATI')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Spesa Alimentare',
      tags: ['#spesa', '#cibo', '#supermercato', '#alimentari'],
      autoCategorized: true,
    };
  }

  // Animali Domestici, Veterinario, Cibo Animali
  if (
    desc.includes('VETERINARI') ||
    desc.includes('VETERINARIA') ||
    desc.includes('ZOOPLUS') ||
    desc.includes('ACQUARIO') ||
    desc.includes('ISOLA DEI TESORI') ||
    desc.includes('ARCAPLANET') ||
    desc.includes('SERESTO') ||
    desc.includes('TRASPORTINO GATTI') ||
    desc.includes('TAPPETINO RINFRESCANTE') ||
    desc.includes('LEVA PELUCCHI')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Animali e Veterinario',
      tags: ['#animali', '#veterinario', '#pet'],
      autoCategorized: true,
    };
  }

  // Salute, Farmacia, Dentista, Parafarmacia
  if (
    desc.includes('FARMACIA') ||
    desc.includes('FARMASAVE') ||
    desc.includes('FARSER') ||
    desc.includes('NUTRITIENDA') ||
    desc.includes('MEDICO') ||
    desc.includes('DENTIST') ||
    desc.includes('STUDIO DENTISTICO') ||
    desc.includes('OTTICA') ||
    desc.includes('ANALISI') ||
    desc.includes('VIVIN TOSSE') ||
    desc.includes('MARIAL') ||
    desc.includes('NEUROMAG') ||
    desc.includes('TERMOFORO') ||
    desc.includes('AUTAN')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Salute e Farmacia',
      tags: ['#salute', '#farmacia', '#dentista'],
      autoCategorized: true,
    };
  }

  // Spese Bancarie, Canoni Carta e Bolli
  if (
    desc.includes('IMPOSTA DI BOLLO') ||
    desc.includes('CANONE CARTA') ||
    desc.includes('COMM.SU BONIFICI') ||
    desc.includes('SPESE BANCARIE') ||
    desc.includes('CANONE CONTO') ||
    desc.includes('COSTO DI EMISSIONE') ||
    desc.includes('INT. E COMP.') ||
    desc.includes('QUOTA ANNUA') ||
    desc.includes('SPESE LIQUIDAZIONE')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Spese Bancarie e Bolli',
      tags: ['#banca', '#canone', '#bollo'],
      autoCategorized: true,
    };
  }

  // Prelievi Contanti ATM
  if (
    desc.includes('PREL.BANCOMAT') ||
    desc.includes('PRELIEVO BANCOMAT') ||
    desc.includes('PRELIEVO ATM')
  ) {
    return {
      macroCategory: 'Needs',
      category: 'Prelievi Contanti ATM',
      tags: ['#contanti', '#prelievo', '#atm'],
      autoCategorized: true,
    };
  }

  // Bollettini PagoPA e Servizi Generali
  if (desc.includes('MOONEY')) {
    return {
      macroCategory: 'Needs',
      category: 'Bollettini e Servizi PagoPA',
      tags: ['#servizi', '#pagopa', '#bollettini'],
      autoCategorized: true,
    };
  }

  // --- COMMITMENTS (Rate, Finanziamenti, Donazioni) ---

  // Rate Finanziamenti & Prestiti
  if (
    desc.includes('COMPASS') ||
    desc.includes('COFIDIS') ||
    desc.includes('PRESTITO') ||
    desc.includes('VORWERK') ||
    desc.includes('FINDOMESTIC') ||
    desc.includes('AGOS') ||
    desc.includes('TIMFIN') ||
    desc.includes('RATA LG OLED') ||
    desc.includes('RATA SAMSUNG GALAXY')
  ) {
    return {
      macroCategory: 'Commitments',
      category: 'Rate Finanziamenti',
      tags: ['#rata', '#prestito', '#debito', '#ricorrente'],
      autoCategorized: true,
    };
  }

  // Donazioni e Terzo Settore
  if (
    desc.includes('UNHCR') ||
    desc.includes('LAV LEGA ANTI') ||
    desc.includes('DONAZIONE') ||
    desc.includes('AMNESTY') ||
    desc.includes('MEDICI SENZA FRONTIERE') ||
    desc.includes('TELETHON') ||
    desc.includes('EMERGENCY') ||
    desc.includes('AIRC')
  ) {
    return {
      macroCategory: 'Commitments',
      category: 'Donazioni e Terzo Settore',
      tags: ['#donazioni', '#beneficenza', '#onlus'],
      autoCategorized: true,
    };
  }

  // --- STILE DI VITA & SHOPPING (Wants) ---

  // Palestra, Fitness, Sport
  if (
    desc.includes('EGO CARTESIO') ||
    desc.includes('PALESTRA') ||
    desc.includes('FITNESS') ||
    desc.includes('PISCINA')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Sport e Palestra',
      tags: ['#sport', '#palestra', '#benessere'],
      autoCategorized: true,
    };
  }

  // Cinema, Spettacoli, Concerti, Eventi
  if (
    desc.includes('TICKETONE') ||
    desc.includes('SHOW BEES') ||
    desc.includes('CINEMA') ||
    desc.includes('UCI') ||
    desc.includes('NOTORIOUS') ||
    desc.includes('TEATRO') ||
    desc.includes('LUCCA PLUS') ||
    desc.includes('HAPPYTICKET')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Eventi, Concerti e Cinema',
      tags: ['#eventi', '#concerti', '#cinema'],
      autoCategorized: true,
    };
  }

  // Libri, Fumetti ed Editoria
  if (
    desc.includes('ITOMI') ||
    desc.includes('TOMODACHI PRESS') ||
    desc.includes('TOMODACHI PRES') ||
    desc.includes('PANINI') ||
    desc.includes('FUMETTI') ||
    desc.includes('PANDEMONIO LUCCA') ||
    desc.includes('LIBRERIA') ||
    desc.includes('FELTRINELLI') ||
    desc.includes('MONDADORI')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Libri e Fumetti',
      tags: ['#libri', '#fumetti', '#lettura', '#cultura'],
      autoCategorized: true,
    };
  }

  // Gaming, Crowdfunding e Hobby
  if (
    desc.includes('KICKSTARTER') ||
    desc.includes('GAMEFOUND') ||
    desc.includes('STEAMPOWERED') ||
    desc.includes('VALVE') ||
    desc.includes('G2A.COM') ||
    desc.includes('TWITCH') ||
    desc.includes('PLAYSTATION') ||
    desc.includes('NINTENDO') ||
    desc.includes('KINGUIN') ||
    desc.includes('GAMESPLANET') ||
    desc.includes('EPIC GAMES') ||
    desc.includes('WIZARDS OF THE COAST') ||
    desc.includes('VAULT X')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Gaming e Hobby',
      tags: ['#gaming', '#videogiochi', '#nerd', '#hobby'],
      autoCategorized: true,
    };
  }

  // Abbonamenti Digitali, Software e Cloud
  if (
    desc.includes('MICROSOFT') ||
    desc.includes('LINKEDIN') ||
    desc.includes('ARUBA') ||
    desc.includes('GOOGLE PLAY') ||
    desc.includes('GOOGLE YOUTUBE') ||
    desc.includes('YOUTUBE') ||
    desc.includes('SPOTIFY') ||
    desc.includes('NETFLIX') ||
    desc.includes('AUDIBLE') ||
    desc.includes('DISNEY') ||
    desc.includes('AMAZON PRIME') ||
    desc.includes('APPLE.COM') ||
    desc.includes('GOOGLE PAYMENT') ||
    (desc === 'GOOGLE' && channel === 'PayPal')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Abbonamenti Digitali',
      tags: ['#digitale', '#software', '#streaming', '#cloud'],
      autoCategorized: true,
    };
  }

  // Casa, Arredo, Brico, Elettrodomestici, Smart Home
  if (
    desc.includes('IKEA') ||
    desc.includes('FERRAMENTA') ||
    desc.includes('LEROY MERLIN') ||
    desc.includes('BRICO') ||
    desc.includes('PHILIPS HUE') ||
    desc.includes('WEBER Q2400') ||
    desc.includes('KA-MI-LADESIGN') ||
    desc.includes('MAX FACTORY') ||
    desc.includes('MEDIAWORLD') ||
    desc.includes('UNIEURO') ||
    desc.includes('EURONICS') ||
    desc.includes('EDIL CUCCHI') ||
    desc.includes('OBI MODENA') ||
    desc.includes('A.C. SERVICE')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Casa, Arredo e Brico',
      tags: ['#casa', '#arredo', '#brico', '#faidate'],
      autoCategorized: true,
    };
  }

  // Shopping, Abbigliamento, Streetwear, Marketplace
  if (
    desc.includes('ROUNDTWO') ||
    desc.includes('ROUND TWO') ||
    desc.includes('ZARA') ||
    desc.includes('H&M') ||
    desc.includes('ASOS') ||
    desc.includes('AMAZON') ||
    desc.includes('AMZN') ||
    desc.includes('ZALANDO') ||
    desc.includes('SHEIN') ||
    desc.includes('VINTED') ||
    desc.includes('EBAY')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Shopping e Abbigliamento',
      tags: ['#shopping', '#abbigliamento', '#moda'],
      autoCategorized: true,
    };
  }

  // Ristorazione, Bar, Pasticceria, Cene, Asporto
  if (
    desc.includes('PIODA') ||
    desc.includes('FATTORIA NICOLUCCI') ||
    desc.includes('GALAXY BEER') ||
    desc.includes('GIUSTO SPIRITO') ||
    desc.includes('BURGER KING') ||
    desc.includes('MC DONALD') ||
    desc.includes('MCDONALD') ||
    desc.includes('UMI SUSHI') ||
    desc.includes('ISTANBUL KEBAB') ||
    desc.includes('INVESTFOOD') ||
    desc.includes('ANELLI DI MONACO') ||
    desc.includes('PLOUTOS') ||
    desc.includes('RISTORANTE') ||
    desc.includes('PIZZERIA') ||
    desc.includes('TRATTORIA') ||
    desc.includes('OSTERIA') ||
    desc.includes('BAR ') ||
    desc.includes('CAFFE') ||
    desc.includes('GELATERIA') ||
    desc.includes('JUST EAT') ||
    desc.includes('SOSTA CAF') ||
    desc.includes('LE BISTR') ||
    desc.includes('OOH PASILLO') ||
    desc.includes('KEKO SRL') ||
    desc.includes('IL PIETRANERA') ||
    desc.includes('PIRRU LABORATORIO') ||
    desc.includes('DISPENSA EMILIA') ||
    desc.includes('RAMEN') ||
    desc.includes('LA BRACE') ||
    desc.includes('SUSHI ONE') ||
    desc.includes('QUATTRO MORI') ||
    desc.includes('CRISTALLODUEZERO') ||
    desc.includes('EURORISTORO') ||
    desc.includes('DICO CIBO') ||
    desc.includes('1882 SRL') ||
    desc.includes('BOTTEGA DI HOFMANOVA')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Ristorazione e Bar',
      tags: ['#ristorante', '#bar', '#cena', '#food'],
      autoCategorized: true,
    };
  }

  // Uscite e Cene con Amici (Quote, Cene in compagnia, Rimborsi privati)
  if (
    desc.includes('RICCARDO RUOZZI') ||
    desc.includes('FEDERICO RUOZZI') ||
    desc.includes('GLORIA BETTUZZI') ||
    desc.includes('CRISTIANO MIGLIORINI') ||
    desc.includes('MATTIA PIREDDA') ||
    desc.includes('ANDREA COTTAFAVA') ||
    desc.includes('SILVIO L') ||
    desc.includes('MATTEO O') ||
    desc.includes('MARCO MOTTURA') ||
    desc.includes('ALEX COVIELLO') ||
    desc.includes('DAVIDE COVIELLO') ||
    desc.includes('FABIO M') ||
    desc.includes('FANTUZZI') ||
    desc.includes('LUMEN MILANO')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Uscite e Cene con Amici',
      tags: ['#amici', '#cene', '#uscite', '#social'],
      autoCategorized: true,
    };
  }

  // Cura Personale, Parrucchiere, Fototessere
  if (
    desc.includes('GIUSI FORTUNATA') ||
    desc.includes('PARRUCCHIER') ||
    desc.includes('BARBIERE') ||
    desc.includes('ESTETICA') ||
    desc.includes('DEDEM')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Cura Personale',
      tags: ['#curapersonale', '#benessere', '#parrucchiere'],
      autoCategorized: true,
    };
  }

  // Regali e Ricorrenze
  if (desc.includes('REGALO MATRIMONIO') || desc.includes('REGALO')) {
    return {
      macroCategory: 'Wants',
      category: 'Regali e Ricorrenze',
      tags: ['#regalo', '#ricorrenza'],
      autoCategorized: true,
    };
  }

  // Viaggi e Vacanze
  if (
    desc.includes('HOTEL') ||
    desc.includes('BOOKING') ||
    desc.includes('AIRBNB') ||
    desc.includes('LIVIGNO')
  ) {
    return {
      macroCategory: 'Wants',
      category: 'Viaggi e Vacanze',
      tags: ['#viaggi', '#vacanze', '#hotel'],
      autoCategorized: true,
    };
  }

  // Fallback residuale (se nessun pattern fa match)
  return {
    macroCategory: 'Wants',
    category: 'Altre Spese',
    tags: ['#spesa'],
    autoCategorized: false,
  };
}
