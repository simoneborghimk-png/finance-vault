import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Check,
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  RefreshCw,
  X,
  Trash2,
  Layers,
  Filter,
  FileText,
  Plus,
} from 'lucide-react';
import { Transaction, MACRO_CATEGORY_SHORT_LABELS, CustomCategoryRule } from '@/types/finance';
import { parseFinancialFile } from '@/lib/parsers/bankParsers';
import { applyRulesToTransactions } from '@/lib/userRulesEngine';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from './ui';

export interface BatchFileItem {
  id: string;
  file: File;
  fileName: string;
  fileSizeBytes: number;
  status: 'parsing' | 'success' | 'error';
  channel?: Transaction['channel'];
  transactions: Transaction[];
  errorMessage?: string;
}

interface FileIngestionDropzoneProps {
  onImportTransactions: (transactions: Transaction[]) => void;
  onSyncDrive: () => Promise<void>;
  isSyncing: boolean;
  driveConnected: boolean;
  existingTransactions?: Transaction[];
  customRules?: CustomCategoryRule[];
}

const CHANNEL_BADGE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  BancoBPM: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Numia: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Nexi: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  PayPal: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Satispay: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Contanti: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const FileIngestionDropzone: React.FC<FileIngestionDropzoneProps> = ({
  onImportTransactions,
  onSyncDrive,
  isSyncing,
  driveConnected: _driveConnected,
  existingTransactions = [],
  customRules = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchFileItem[]>([]);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatEuro = (val: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

  // Set di ID già salvati nel Vault per calcolare le dedupliche
  const existingIdSet = useMemo(() => {
    return new Set(existingTransactions.map((t) => t.id));
  }, [existingTransactions]);

  // Gestione elaborazione batch multi-file
  const handleFiles = async (filesList: FileList | File[] | null) => {
    if (!filesList || filesList.length === 0) return;
    const filesArray = Array.from(filesList);

    // Crea un nuovo item per ogni file in caricamento
    const newItems: BatchFileItem[] = filesArray.map((file) => ({
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      fileName: file.name,
      fileSizeBytes: file.size,
      status: 'parsing',
      transactions: [],
    }));

    setBatchItems((prev) => [...prev, ...newItems]);
    setNotification({
      type: 'info',
      message: `Elaborazione in corso di ${newItems.length} ${newItems.length === 1 ? 'file' : 'file in parallelo'}...`,
    });

    // Parsing concorrente per ciascun file
    await Promise.allSettled(
      newItems.map(async (item) => {
        try {
          const result = await parseFinancialFile(item.file);
          const finalTxs = customRules.length > 0
            ? applyRulesToTransactions(result.transactions, customRules).updatedTransactions
            : result.transactions;
          setBatchItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: 'success',
                    channel: result.channel,
                    transactions: finalTxs,
                  }
                : it
            )
          );
        } catch (err: any) {
          const errMsg = err?.message || 'Formato file non supportato o corrotto';
          setBatchItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: 'error',
                    errorMessage: errMsg,
                  }
                : it
            )
          );
        }
      })
    );

    setNotification(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Rimozione di un singolo file dal batch
  const handleRemoveFile = (id: string) => {
    setBatchItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Svuota completamente il batch
  const handleClearBatch = () => {
    setBatchItems([]);
    setSelectedChannelFilter('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // File elaborati con successo
  const successfulFiles = useMemo(() => {
    return batchItems.filter((f) => f.status === 'success');
  }, [batchItems]);

  const parsingFilesCount = useMemo(() => {
    return batchItems.filter((f) => f.status === 'parsing').length;
  }, [batchItems]);

  const errorFilesCount = useMemo(() => {
    return batchItems.filter((f) => f.status === 'error').length;
  }, [batchItems]);

  // Transazioni estratte aggregate
  const allExtractedTransactions = useMemo(() => {
    return successfulFiles.flatMap((f) => f.transactions);
  }, [successfulFiles]);

  // Canali unici presenti nel batch corrente
  const availableChannels = useMemo(() => {
    const set = new Set<string>();
    successfulFiles.forEach((f) => {
      if (f.channel) set.add(f.channel);
    });
    return Array.from(set);
  }, [successfulFiles]);

  // Calcolo deduplica aggregata
  const { newTransactions, duplicateTransactionsCount } = useMemo(() => {
    const seenBatchIds = new Set<string>();
    const newItems: Transaction[] = [];
    let duplicates = 0;

    for (const tx of allExtractedTransactions) {
      if (existingIdSet.has(tx.id) || seenBatchIds.has(tx.id)) {
        duplicates++;
      } else {
        seenBatchIds.add(tx.id);
        newItems.push(tx);
      }
    }

    return {
      newTransactions: newItems,
      duplicateTransactionsCount: duplicates,
    };
  }, [allExtractedTransactions, existingIdSet]);

  // Transazioni visualizzate nella tabella con filtro canale
  const displayedTransactions = useMemo(() => {
    if (selectedChannelFilter === 'all') return allExtractedTransactions;
    return allExtractedTransactions.filter((tx) => tx.channel === selectedChannelFilter);
  }, [allExtractedTransactions, selectedChannelFilter]);

  // Conferma importazione
  const handleConfirmImport = () => {
    if (newTransactions.length === 0) return;
    onImportTransactions(newTransactions);
    const importedCount = newTransactions.length;
    const dupsCount = duplicateTransactionsCount;
    setBatchItems([]);
    setSelectedChannelFilter('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setNotification({
      type: 'success',
      message: `Successo: ${importedCount} nuove transazioni importate nel Vault!${
        dupsCount > 0 ? ` (${dupsCount} transazioni già registrate scartate)` : ''
      }`,
    });
  };

  return (
    <div className="space-y-6">
        {/* ========================================================================= */}
        {/* TOP HEADER: TITOLO E SYNC DRIVE                                           */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              Ingestione Multi-File & Riconciliazione (Client-Side)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trascina contemporaneamente i tuoi file Banco BPM, Carta Nexi, Carta Numia, PayPal e Satispay per il parsing simultaneo
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={onSyncDrive}
              disabled={isSyncing}
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground font-medium text-xs px-4 py-2 flex items-center gap-2 shrink-0 shadow-xs"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  Cifratura AES-GCM & Invio...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-primary" />
                  Sincronizza su Google Drive
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DRAG & DROP ZONE MULTI-FILE                                               */}
        {/* ========================================================================= */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border hover:border-border/80 bg-background/50 hover:bg-accent/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Trascina qui uno o più file Excel (.xlsx) o CSV (Caricamento Batch)
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl mx-auto">
            Riconoscimento automatico multi-canale: <span className="text-foreground font-medium">Banco BPM</span>,{' '}
            <span className="text-foreground font-medium">Carta Nexi</span>,{' '}
            <span className="text-foreground font-medium">Carta Numia</span>,{' '}
            <span className="text-foreground font-medium">PayPal (CSV)</span> e{' '}
            <span className="text-foreground font-medium">Satispay</span>
          </p>
          <p className="text-[11px] text-primary/90 mt-2 font-medium">
            Architettura Zero-Knowledge: il parsing avviene in 15 millisecondi in memoria locale nel browser. Nessun dato lascia il tuo dispositivo.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* BANNER NOTIFICA / FEEDBACK STATO                                          */}
        {/* ========================================================================= */}
        {notification && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : notification.type === 'error'
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-primary/10 border-primary/30 text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-primary shrink-0 animate-spin" />
              )}
              <span>{notification.message}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotification(null)}
              className="h-6 w-6 rounded-md hover:bg-black/20"
              aria-label="Chiudi notifica"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CRUSCOTTO SINTESI BATCH & LISTA FILE CARICATI                             */}
        {/* ========================================================================= */}
        {batchItems.length > 0 && (
          <div className="space-y-4">
            {/* Metriche Riassuntive del Batch */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-card/70 border-border p-3.5 shadow-xs">
                <div className="text-xs text-muted-foreground font-medium">File nel Batch</div>
                <div className="text-xl font-bold font-mono text-foreground mt-1 flex items-baseline gap-1">
                  <span>{successfulFiles.length}</span>
                  <span className="text-xs font-normal text-muted-foreground">/ {batchItems.length} pronti</span>
                </div>
                {parsingFilesCount > 0 && (
                  <div className="text-[10px] text-primary flex items-center gap-1 mt-1 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {parsingFilesCount} in parsing...
                  </div>
                )}
                {errorFilesCount > 0 && (
                  <div className="text-[10px] text-destructive flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {errorFilesCount} con errori
                  </div>
                )}
              </Card>

              <Card className="bg-card/70 border-border p-3.5 shadow-xs">
                <div className="text-xs text-muted-foreground font-medium">Movimenti Rilevati</div>
                <div className="text-xl font-bold font-mono text-foreground mt-1">
                  {allExtractedTransactions.length}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Estratti dai file validi
                </div>
              </Card>

              <Card className="bg-primary/5 border-primary/30 p-3.5 shadow-xs">
                <div className="text-xs text-primary font-medium">Nuovi da Importare</div>
                <div className="text-xl font-bold font-mono text-foreground mt-1">
                  {newTransactions.length}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Pronti per il Vault
                </div>
              </Card>

              <Card className="bg-card/70 border-border p-3.5 shadow-xs">
                <div className="text-xs text-muted-foreground font-medium">Duplicati Riconosciuti</div>
                <div className="text-xl font-bold font-mono text-muted-foreground mt-1">
                  {duplicateTransactionsCount}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Già nel Vault o ridondanti
                </div>
              </Card>
            </div>

            {/* Schede Dettaglio dei Singoli File nel Batch */}
            <Card className="bg-card/60 border-border shadow-xs">
              <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    File Elaborati nel Batch ({batchItems.length})
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs border-border hover:border-primary/40 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    Aggiungi altri file
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearBatch}
                    className="h-7 text-xs border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Svuota batch
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-3.5 pt-1 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {batchItems.map((item) => {
                    const badgeStyle = item.channel
                      ? CHANNEL_BADGE_STYLE[item.channel] || {
                          bg: 'bg-muted/40',
                          text: 'text-foreground',
                          border: 'border-border',
                        }
                      : null;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card/80 hover:bg-card transition-all text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="p-2 rounded-lg bg-background border border-border shrink-0">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate max-w-56 sm:max-w-72">
                              {item.fileName}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span>{formatBytes(item.fileSizeBytes)}</span>
                              <span>•</span>
                              {item.status === 'parsing' && (
                                <span className="text-primary flex items-center gap-1 font-medium">
                                  <RefreshCw className="w-3 h-3 animate-spin" /> In elaborazione...
                                </span>
                              )}
                              {item.status === 'error' && (
                                <span className="text-destructive flex items-center gap-1 font-medium truncate max-w-44">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  {item.errorMessage || 'Errore di parsing'}
                                </span>
                              )}
                              {item.status === 'success' && (
                                <span className="text-muted-foreground">
                                  {item.transactions.length} movimenti estratti
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'success' && item.channel && badgeStyle && (
                            <Badge
                              variant="outline"
                              className={`${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} text-[10px] font-medium py-0.5 px-2`}
                            >
                              {item.channel}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(item.id)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Rimuovi ${item.fileName} dal batch`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TABELLA DI ANTEPRIMA AGGREGATA DEI MOVIMENTI                              */}
        {/* ========================================================================= */}
        {allExtractedTransactions.length > 0 && (
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4 pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-border/60">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base text-foreground font-semibold flex items-center gap-2">
                    Anteprima Movimenti Estratti ({displayedTransactions.length})
                  </CardTitle>
                  {duplicateTransactionsCount > 0 && (
                    <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                      {duplicateTransactionsCount} duplicati esclusi
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  Verifica l'auto-categorizzazione multi-fonte prima del salvataggio definitivo nel Vault cifrato
                </CardDescription>
              </div>

              {/* Azione Primaria Unica per la schermata */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={handleConfirmImport}
                  disabled={newTransactions.length === 0 || parsingFilesCount > 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-4 py-2 flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Check className="w-4 h-4" />
                  {newTransactions.length > 0
                    ? `Conferma ed Importa ${newTransactions.length} Movimenti nel Vault`
                    : 'Tutti i Movimenti sono già Presenti'}
                </Button>
              </div>
            </CardHeader>

            {/* Barra Filtri per Canale */}
            {availableChannels.length > 1 && (
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border/60 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-muted-foreground flex items-center gap-1 font-medium">
                  <Filter className="w-3.5 h-3.5" /> Filtra Canale:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedChannelFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedChannelFilter === 'all'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  Tutti ({allExtractedTransactions.length})
                </button>
                {availableChannels.map((ch) => {
                  const count = allExtractedTransactions.filter((t) => t.channel === ch).length;
                  const isSelected = selectedChannelFilter === ch;
                  const style = CHANNEL_BADGE_STYLE[ch];

                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChannelFilter(ch)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                        isSelected
                          ? `${style?.bg || 'bg-primary/20'} ${style?.text || 'text-primary'} ${style?.border || 'border-primary/40'} shadow-xs`
                          : 'bg-card text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      {ch} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[460px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border text-xs text-muted-foreground bg-card/40">
                      <TableHead className="w-24">Data</TableHead>
                      <TableHead className="w-28">Canale</TableHead>
                      <TableHead>Descrizione Movimento</TableHead>
                      <TableHead className="w-32">Macro-Categoria</TableHead>
                      <TableHead className="w-40">Categoria Assegnata</TableHead>
                      <TableHead className="text-right w-28">Importo</TableHead>
                      <TableHead className="w-24 text-center">Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {displayedTransactions.map((item) => {
                      const isExisting = existingIdSet.has(item.id);
                      const channelStyle = CHANNEL_BADGE_STYLE[item.channel] || {
                        bg: 'bg-muted/40',
                        text: 'text-foreground',
                        border: 'border-border',
                      };

                      return (
                        <TableRow
                          key={item.id}
                          className={`border-border/60 hover:bg-accent/40 ${
                            isExisting ? 'opacity-50 bg-muted/10' : ''
                          }`}
                        >
                          <TableCell className="font-mono text-foreground align-middle">
                            {item.date}
                          </TableCell>

                          <TableCell className="align-middle">
                            <Badge
                              variant="outline"
                              className={`${channelStyle.bg} ${channelStyle.text} ${channelStyle.border} text-[10px] py-0.5 px-2`}
                            >
                              {item.channel}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-foreground align-middle">
                            <div className="font-medium">{item.description}</div>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {item.tags.map((tg) => (
                                  <span key={tg} className="text-[10px] text-muted-foreground">
                                    {tg}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="align-middle">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                item.macroCategory === 'Needs'
                                  ? 'bg-sky-950 text-sky-300 border border-sky-800/40'
                                  : item.macroCategory === 'Commitments'
                                  ? 'bg-violet-950 text-violet-300 border border-violet-800/40'
                                  : item.macroCategory === 'Wants'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                                  : item.macroCategory === 'Extraordinary'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              }`}
                            >
                              {MACRO_CATEGORY_SHORT_LABELS[item.macroCategory] || item.macroCategory}
                            </span>
                          </TableCell>

                          <TableCell className="text-foreground align-middle">
                            {item.category}
                          </TableCell>

                          <TableCell
                            className={`text-right font-mono font-medium align-middle ${
                              item.amount > 0 ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {formatEuro(item.amount)}
                          </TableCell>

                          <TableCell className="text-center align-middle">
                            {isExisting ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-border text-muted-foreground bg-muted/20"
                              >
                                Nel Vault
                              </Badge>
                            ) : item.autoCategorized ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-primary/40 text-primary bg-primary/10 inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                Auto
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-950/20 inline-flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                                Verifica
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
};
