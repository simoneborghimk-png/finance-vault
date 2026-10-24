import React, { useState } from 'react';
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Wallet,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Cloud,
  AlertTriangle,
} from 'lucide-react';
import { googleDrive, PayslipInfo, checkMissingPreviousMonthPayslip } from '@/lib/googleDrive';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Badge
} from './ui';

interface PayslipSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSalary: number;
  onApplySalary: (netSalary: number, isExtra?: '13th' | '14th' | null) => void;
}

const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const PayslipSyncDialog: React.FC<PayslipSyncDialogProps> = ({
  open,
  onOpenChange,
  currentSalary,
  onApplySalary,
}) => {
  const [payslips, setPayslips] = useState<PayslipInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const missingAlert = checkMissingPreviousMonthPayslip(payslips);

  const fetchPayslips = async () => {
    setIsLoading(true);
    try {
      const items = await googleDrive.listPayslips();
      setPayslips(items);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      fetchPayslips();
    }
  }, [open]);

  const handleApply = (payslip: PayslipInfo) => {
    onApplySalary(payslip.netSalary, payslip.isExtraordinaryMonth);
    setAppliedId(payslip.id);
    setTimeout(() => {
      onOpenChange(false);
      setAppliedId(null);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[85vh] flex flex-col p-5 sm:p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pr-8 pb-1">
          <DialogTitle className="text-base text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span>Sincronizzazione Buste Paga da Google Drive</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
            Scansione automatica dei cedolini PDF archiviati nella cartella Drive{' '}
            <code className="text-primary font-mono font-medium bg-primary/10 px-1 py-0.5 rounded">
              Lavoro &gt; Buste paga
            </code>{' '}
            suddivisi per anno.
          </DialogDescription>
        </DialogHeader>

        {/* Corpo scrollabile unificato con min-h-0 e flex-1 */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3.5 p-1 pr-1.5 text-xs">
          {/* Banner Promemoria Cedolino Mancante dopo il 15 */}
          {missingAlert.isMissing && !isLoading && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">
                  Promemoria: Cedolino di {missingAlert.targetMonthLabel} non trovato
                </p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  È passato il 15 del mese e non risulta ancora presente la busta paga di {missingAlert.targetMonthLabel} nella cartella Drive <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono text-[10px] text-amber-100">Lavoro &gt; Buste paga</code>. Carica il PDF su Drive per sincronizzarlo con il vault.
                </p>
              </div>
            </div>
          )}

          {/* Box stipendio corrente */}
          <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
            <div>
              <span className="text-[11px] text-muted-foreground">Stipendio Base Netto Attuale</span>
              <p className="text-base font-bold text-foreground mt-0.5">{formatEuro(currentSalary)}</p>
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 text-xs">
              Profilo Attivo
            </Badge>
          </div>

          {/* Elenco cedolini trovati */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-card py-1 z-10">
              Documenti Buste Paga Rilevati ({payslips.length})
            </p>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                <span>Ricerca cedolini in Lavoro &gt; Buste paga...</span>
              </div>
            ) : payslips.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
                <p className="font-medium text-foreground">Nessun cedolino rilevato in Google Drive</p>
                <p className="text-[11px]">
                  Verifica che i PDF siano presenti nella cartella <code className="text-primary font-mono">Lavoro &gt; Buste paga</code> o contengano "Busta" / "Cedolino" nel nome.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {payslips.map((p) => {
                  const isCurrent = p.netSalary === currentSalary && !p.isExtraordinaryMonth;
                  const isJustApplied = appliedId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 truncate">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-xs text-foreground truncate">{p.name}</span>
                          {p.isExtraordinaryMonth && (
                            <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] py-0">
                              {p.isExtraordinaryMonth === '14th' ? 'Quattordicesima' : 'Tredicesima'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span>Mese: {p.month}</span>
                          </span>
                          <span className="font-mono text-foreground font-medium">
                            Netto: {formatEuro(p.netSalary)}
                          </span>
                        </div>
                      </div>

                      {isJustApplied ? (
                        <Badge className="bg-emerald-600 text-white px-2.5 py-1 text-xs gap-1.5 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Applicato</span>
                        </Badge>
                      ) : isCurrent ? (
                        <Badge variant="outline" className="border-border text-muted-foreground bg-muted/20 px-2.5 py-1 text-xs gap-1.5 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary opacity-80" />
                          <span>In uso</span>
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApply(p)}
                          className="h-7 text-xs shrink-0 font-medium px-2.5 gap-1.5 border-border hover:border-primary/50 hover:text-primary transition-all"
                        >
                          <span>Applica</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Fisso ancorato all'interno del perimetro della modale */}
        <DialogFooter className="shrink-0 pt-3 border-t border-border flex items-center justify-end gap-2.5 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs border-border text-foreground hover:bg-muted/50"
          >
            Chiudi
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={fetchPayslips}
            disabled={isLoading}
            className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Sincronizzazione...' : 'Sincronizza Buste Paga'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
