# Regola: Token Optimization & Architettura della Memoria (Calda / Fredda)

Questo documento formalizza le pratiche ereditate da `agent-core-knowledge` per l'efficienza del contesto, la conservazione del budget token e la chirurgia del codice.

---

## 1. Architettura della Memoria a 3 Livelli

Per prevenire il degrado della context window e azzerare il sovraccarico di token per prompt:

| Livello | File / Directory | Scopo | Politica di Accesso |
| :--- | :--- | :--- | :--- |
| **Memoria Calda** | `PROGRESS.md` | Cruscotto operativo snello (coordinate stack, backlog attivo, indice sintetico ADR). | **Azione zero** di ogni sessione. Vincolo ferreo: **≤90–100 righe**. |
| **Memoria Fredda Decisionale** | `docs/adr/` | Archivio immutabile delle Architectural Decision Records (ADR). | Consultare **chirurgicamente solo il singolo ADR** pertinente al task. Mai caricare l'intera cartella. |
| **Memoria Fredda Storica** | `CHANGELOG.md` | Registro storico dei rilasci e milestone completate (Keep a Changelog). | Non caricare all'avvio sessione. Si aggiorna solo a chiusura milestone. |

---

## 2. Chirurgia del Contesto (Token Hygiene)

1. **Slice Reading & Lookup Mirato:**
   - Per file estesi (>100–150 righe), è vietato eseguire letture integrali a vuoto.
   - Individuare la riga esatta con `grep_search` e leggere solo la finestra necessaria con `view_file` (`StartLine` ed `EndLine`).
2. **Targeted Diffing:**
   - Privilegiare sempre sostituzioni atomiche di blocchi contigui (`replace_file_content` o `multi_replace_file_content`).
   - È vietato riscrivere interi file sorgente o documentali quando la modifica riguarda solo poche righe.
3. **Divieto di Context Bloat:**
   - Non caricare preventivamente file interi di specifiche, manuali o guide non direttamente coinvolte nel turno operativo corrente.
4. **Prompt Caching Discipline:**
   - File di configurazione, regole `.agents/rules/` e definizioni canoniche devono rimanere stabili per favorire il prefisso in cache LLM e abbattere drasticamente tempi di risposta e costi.
