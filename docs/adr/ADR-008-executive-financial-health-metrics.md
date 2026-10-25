# ADR-008: Metriche Esecutive di Salute Finanziaria e Ripartizione Costi

- **Stato:** Accettata
- **Data:** 2026-10-24
- **Contesto:**
  L'Executive Dashboard forniva finora KPI aggregati essenziali (Entrate, Uscite, Risparmio Netto, Tasso di Risparmio). Tuttavia, per una visione strategica e una tempestiva presa di decisioni di finanza personale, all'utente mancavano indicatori di efficienza strutturale:
  1. Benchmark formale rispetto a regole consolidate di budget (es. Regola 50/30/20 di Elizabeth Warren).
  2. Chiara distinzione tra rigidità di costo (spese fisse incomprimibili) e flessibilità di manovra (spese variabili comprimibili).
  3. Velocità di esborso quotidiana (Daily Burn Rate) rapportata al reddito giornaliero per monitorare l'erosione di cassa.

- **Decisione:**
  1. **Regola 50/30/20 Integrata:**
     - Calcolo delle 3 dimensioni sul Totale Entrate:
       - **Bisogni & Impegni (Needs, target ≤50%):** Include macro-categorie di primaria necessità (`Needs`) e debiti/mutui contrattuali (`Commitments`).
       - **Desideri (Wants, target ≤30%):** Include macro-categorie discrezionali (`Wants`).
       - **Risparmio & Investimenti (Savings, target ≥20%):** Calcolato come surplus netto positivo del periodo più eventuali contributi a fondi pensione / investimenti accumulati.
     - Badge di stato sintetico: *Equilibrato* (se Needs ≤ 55% e Savings ≥ 15%), altrimenti *Attenzione: squilibrio*.
  2. **Ripartizione Costi Fissi vs Variabili:**
     - Mappatura semantica categorica: Casa/Affitto, Utenze, Finanziamenti, Assicurazioni e Abbonamenti come **Costi Fissi**; Spesa alimentare, Ristoranti, Trasporti, Shopping, Tempo Libero e Viaggi come **Costi Variabili**.
     - Calcolo del buffer comprimibile mensile: stima della quota media mensile di spese variabili che l'utente può tagliare in scenari di emergenza.
  3. **Daily Burn Rate & Cash Flow:**
     - Calcolo dell'esborso medio per giorno di calendario nell'intervallo temporale selezionato (`Uscite Totali / Giorni Totali`).
     - Confronto con l'entrata media giornaliera (`Entrate Totali / Giorni Totali`) con differenziale netto giornaliero per monitorare la traiettoria di cassa istantanea.

- **Conseguenze:**
  - **Positive:** Comprensione immediata e a colpo d'occhio della sostenibilità del tenore di vita, identificazione del margine di manovra e quantificazione dello spazio di risparmio potenziale.
  - **Negative:** Richiede che le macro-categorie delle transazioni siano accuratamente valorizzate (garantito dalle regole di categorizzazione e dagli arricchimenti di deduplicazione/riconciliazione).
