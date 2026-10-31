# Workflow di Reverse Engineering & Onboarding Tracciati Bancari (`data/exports/`)

Questo documento definisce la procedura standardizzata e vincolante (conforme ad **ADR-013**) per analizzare, profilare e collaudare nuovi estratti conto bancari prima della loro implementazione nell'interfaccia utente.

---

## 1. Fase 1: Profiling Automatizzato con `inspect-export.mjs`

Prima di scrivere codice TypeScript o React, esegui il profiler CLI sul file grezzo salvato in questa cartella:

```bash
# Esempio su file Excel (es. Nexi, Numia, Satispay, BPM)
node scripts/inspect-export.mjs data/exports/Nexi.xlsx 10

# Esempio su file CSV (es. PayPal, Revolut)
node scripts/inspect-export.mjs data/exports/Paypal.CSV 10
```

Lo script analizza ed emette automaticamente:
1. **Delimitatore & Struttura:** Rilevamento automatico per CSV (`,`, `;`, `\t`) o foglio attivo Excel.
2. **Offset Intestazione:** Rileva la riga esatta dell'header scartando eventuali righe di intestazione/metadati iniziali (es. Nexi ha ~9 righe di anagrafica).
3. **Tipizzazione Colonne:** Rilevamento date (italiane `DD/MM/YYYY`, ISO `YYYY-MM-DD`, seriali Excel) e formati numerici (virgola italiana `-1.250,50` vs punto decimale `-1250.50`).
4. **Convenzione del Segno:** Avviso automatico se le spese sono positive (es. estratti carta di credito).
5. **Scaffold Tipizzato:** Genera la bozza dell'interfaccia `RawRow` e la funzione di mapping.

---

## 2. Fase 2: Checklist di Analisi del Tracciato

Compila mentalmente o in nota operativa la seguente matrice prima di creare il parser:

| Parametro | Verifica | Azione / Convenzione |
| :--- | :--- | :--- |
| **Offset Header** | Quante righe di metadati precedono le colonne reali? | Impostare `startRow = N` o `{ header: 1 }` in SheetJS. |
| **Formato Data** | È `DD/MM/YYYY`, `YYYY-MM-DD` o un numero seriale? | Usare `normalizeDate(rawDate)` da `src/lib/parsers/bankParsers.ts`. |
| **Formato Importo** | Usa virgola `,` per decimali e punto `.` per migliaia? | Usare `normalizeAmount(rawAmount)`. |
| **Segno Contabile** | Le spese sono segnate come positive o negative? | **Vincolo ADR-013:** Tutte le uscite devono essere **negative** (`amount < 0`). Se le spese sono positive, applicare `if (amount > 0) amount = -amount;`. |
| **Clearing / SDD** | Ci sono addebiti cumulativi di carte o wallet? | Filtrare o contrassegnare i movimenti SDD per non duplicare le spese già tracciate sui canali dedicati. |

---

## 3. Fase 3: Definizione del Contratto Tipizzato & Schema

Definisci in `src/lib/parsers/bankParsers.ts` il contratto esplicito della riga grezza:

```typescript
export interface RawNuovoCanaleRow {
  Data: string;
  Descrizione: string;
  Importo: string | number;
  // ...eventuali colonne accessorie
}
```

Implementa la funzione di mapping verso il tipo comune `Transaction` del Vault:

```typescript
export function parseNuovoCanale(rows: any[]): Transaction[] {
  const transactions: Transaction[] = [];
  // Loop con normalizzazione date, importi, segno e categorizzazione
  return transactions;
}
```

---

## 4. Fase 4: Isolated Mock Testing (Prima dell'Aggancio UI)

Crea un test isolato o esegui una validazione headless con fixture minime anonimizzate (3–5 righe):
- [ ] Collaudo date (casi limite fine mese, anni bisestili, orari associati).
- [ ] Collaudo importi (spese con decimali, rimborsi positivi, entrate/accrediti).
- [ ] Inversione corretta del segno contabile (uscite sempre negative).
- [ ] Assegnazione della macro-categoria tramite `categorizeDescription`.
- [ ] Verifica assenza di duplicazioni SDD rispetto al conto corrente.

---

## 5. Fase 5: Integrazione nell'Interfaccia Utente

Solo dopo che i test isolati hanno esito positivo:
1. Registra il nuovo canale in `src/types/finance.ts` (`Transaction['channel']`).
2. Aggiungi il canale alla dropzone multi-file in `src/components/FileIngestionDropzone.tsx`.
3. Verifica la visualizzazione, i filtri e l'editing in `src/components/TransactionsManager.tsx`.
4. Esegui il gate deterministico: `npm run check:sync` e `npm run build`.

