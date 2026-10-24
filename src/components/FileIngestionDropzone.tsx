import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, CheckCircle2, CloudUpload, ArrowRight, RefreshCw } from 'lucide-react';
import { Transaction, MacroCategory, MACRO_CATEGORY_SHORT_LABELS } from '@/types/finance';
import { parseFinancialFile } from '@/lib/parsers/bankParsers';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui';

interface FileIngestionDropzoneProps {
  onImportTransactions: (transactions: Transaction[]) => void;
  onSyncDrive: () => Promise<void>;
  isSyncing: boolean;
  driveConnected: boolean;
}

export const FileIngestionDropzone: React.FC<FileIngestionDropzoneProps> = ({
  onImportTransactions,
  onSyncDrive,
  isSyncing,
  driveConnected,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedItems, setParsedItems] = useState<Transaction[]>([]);
  const [detectedChannel, setDetectedChannel] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatEuro = (val: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileName(file.name);
    setImportStatus('Elaborazione file in corso...');

    try {
      const result = await parseFinancialFile(file);
      setDetectedChannel(result.channel);
      setParsedItems(result.transactions);
      setImportStatus(
        `File riconosciuto: ${result.channel}. Estratte ${result.transactions.length} transazioni.`
      );
    } catch (err: any) {
      setImportStatus('Errore durante la lettura del file: ' + err.message);
    }
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

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;
    onImportTransactions(parsedItems);
    setParsedItems([]);
    setFileName(null);
    setDetectedChannel(null);
    setImportStatus(`Successo: ${parsedItems.length} transazioni importate nel Vault!`);
  };

  const updateItemCategory = (id: string, macroCategory: MacroCategory, category: string) => {
    setParsedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, macroCategory, category, autoCategorized: true }
          : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            Ingestione File Bancari & Riconciliazione (Client-Side)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Trascina i tuoi file Banco BPM (`movimentiConto.xlsx`) o Carta Numia (`movimenti.xlsx`) per l'auto-categorizzazione istantanea
          </p>
        </div>

        <Button
          variant="outline"
          onClick={onSyncDrive}
          disabled={isSyncing}
          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground font-medium text-xs px-4 py-2 flex items-center gap-2 shrink-0"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Cifratura AES-GCM & Invio...
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4 text-muted-foreground" />
              Sincronizza su Google Drive
            </>
          )}
        </Button>
      </div>

      {/* Drag & Drop Zone */}
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
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Trascina qui il file Excel (.xlsx) o CSV del conto, carta o wallet
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-lg mx-auto">
          Supporto nativo: <span className="text-foreground font-medium">Banco BPM</span>, <span className="text-foreground font-medium">Carta Nexi</span>, <span className="text-foreground font-medium">Carta Numia</span>, <span className="text-foreground font-medium">PayPal (CSV)</span> e <span className="text-foreground font-medium">Satispay</span>
        </p>
        <p className="text-[11px] text-primary/90 mt-2">
          Nessun file viene caricato su server esterni: il parsing avviene in 15 millisecondi nel browser.
        </p>
      </div>

      {importStatus && (
        <div className="p-3 rounded-lg bg-card border border-border text-xs text-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>{importStatus}</span>
          </div>
          {fileName && (
            <Badge variant="outline" className="border-border text-foreground">
              {fileName}
            </Badge>
          )}
        </div>
      )}

      {/* Preview Table of Parsed Transactions */}
      {parsedItems.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <span>Anteprima Movimenti Estratti ({parsedItems.length})</span>
                {detectedChannel && (
                  <Badge variant="outline" className="border-info/40 text-info bg-info/10 text-xs">
                    Canale: {detectedChannel}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Verifica le categorie assegnate dalle regole prima di confermare l'importazione
              </CardDescription>
            </div>

            <Button
              onClick={handleConfirmImport}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Conferma ed Importa nel Vault
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="border-border text-xs text-muted-foreground">
                    <TableHead className="w-24">Data</TableHead>
                    <TableHead>Descrizione Movimento</TableHead>
                    <TableHead className="w-32">Macro-Categoria</TableHead>
                    <TableHead className="w-44">Categoria Assegnata</TableHead>
                    <TableHead className="text-right w-28">Importo</TableHead>
                    <TableHead className="w-24 text-center">Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {parsedItems.map((item) => (
                    <TableRow key={item.id} className="border-border/60 hover:bg-accent/40">
                      <TableCell className="font-mono text-foreground align-middle">{item.date}</TableCell>
                      <TableCell className="text-foreground align-middle">
                        <div className="font-medium">{item.description}</div>
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-0.5">
                            {item.tags.map((tg) => (
                              <span key={tg} className="text-[10px] text-muted-foreground">
                                {tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          item.macroCategory === 'Needs' ? 'bg-sky-950 text-sky-300 border border-sky-800/40' :
                          item.macroCategory === 'Commitments' ? 'bg-violet-950 text-violet-300 border border-violet-800/40' :
                          item.macroCategory === 'Wants' ? 'bg-amber-950 text-amber-300 border border-amber-800/40' :
                          item.macroCategory === 'Extraordinary' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                        }`}>
                          {MACRO_CATEGORY_SHORT_LABELS[item.macroCategory] || item.macroCategory}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground align-middle">{item.category}</TableCell>
                      <TableCell className={`text-right font-mono font-medium align-middle ${
                        item.amount > 0 ? 'text-primary' : 'text-foreground'
                      }`}>
                        {formatEuro(item.amount)}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        {item.autoCategorized ? (
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                            Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-950/20 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            Verifica
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
