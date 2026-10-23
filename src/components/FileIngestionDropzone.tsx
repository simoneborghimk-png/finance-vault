import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, CheckCircle2, CloudUpload, ArrowRight, RefreshCw } from 'lucide-react';
import { Transaction, MacroCategory } from '@/types/finance';
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
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            Ingestione File Bancari & Riconciliazione (Client-Side)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Trascina i tuoi file Banco BPM (`movimentiConto.xlsx`) o Carta Numia (`movimenti.xlsx`) per l'auto-categorizzazione istantanea
          </p>
        </div>

        <Button
          onClick={onSyncDrive}
          disabled={isSyncing}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2 flex items-center gap-2 shadow-lg shadow-emerald-950/50"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Cifratura AES-GCM & Invio...
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4" />
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
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">
          Trascina qui il file Excel (.xlsx) o CSV del conto / carta
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Supporto nativo per <span className="text-slate-200">movimentiConto.xlsx</span> (Banco BPM) e <span className="text-slate-200">movimenti (2).xlsx</span> (Carta Numia)
        </p>
        <p className="text-[11px] text-emerald-400/80 mt-2">
          Nessun file viene caricato su server esterni: il parsing avviene in 15 millisecondi nel browser.
        </p>
      </div>

      {importStatus && (
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importStatus}</span>
          </div>
          {fileName && (
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {fileName}
            </Badge>
          )}
        </div>
      )}

      {/* Preview Table of Parsed Transactions */}
      {parsedItems.length > 0 && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <span>Anteprima Movimenti Estratti ({parsedItems.length})</span>
                {detectedChannel && (
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 bg-cyan-950/30 text-xs">
                    Canale: {detectedChannel}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Verifica le categorie assegnate dalle regole prima di confermare l'importazione
              </CardDescription>
            </div>

            <Button
              onClick={handleConfirmImport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Conferma ed Importa nel Vault
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 text-xs text-slate-400">
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
                    <TableRow key={item.id} className="border-slate-800/60 hover:bg-slate-800/30">
                      <TableCell className="font-mono text-slate-300">{item.date}</TableCell>
                      <TableCell className="text-slate-200">
                        <div className="font-medium">{item.description}</div>
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-0.5">
                            {item.tags.map((tg) => (
                              <span key={tg} className="text-[10px] text-slate-500">
                                {tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          item.macroCategory === 'Needs' ? 'bg-sky-950 text-sky-300 border border-sky-800/40' :
                          item.macroCategory === 'Commitments' ? 'bg-violet-950 text-violet-300 border border-violet-800/40' :
                          item.macroCategory === 'Wants' ? 'bg-amber-950 text-amber-300 border border-amber-800/40' :
                          item.macroCategory === 'Extraordinary' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                        }`}>
                          {item.macroCategory}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">{item.category}</TableCell>
                      <TableCell className={`text-right font-mono font-medium ${
                        item.amount > 0 ? 'text-emerald-400' : 'text-slate-100'
                      }`}>
                        {formatEuro(item.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.autoCategorized ? (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-950/20">
                            Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-950/20">
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
