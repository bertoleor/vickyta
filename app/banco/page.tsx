import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  Building2, 
  CreditCard,
  Calendar,
  Plus,
  Clock
} from "lucide-react";
import { getAccounts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency, getAccountTypeConfig } from "@/lib/constants";
import type { Account } from "@/types/database";

/**
 * Banco Page - Server Component
 * Connected to Supabase for real data
 */
export default async function BancoPage() {
  // Get current user
  const user = await getCurrentUser();

  // Get accounts
  const accountsResult = await getAccounts(user?.id || "");
  const accounts = accountsResult.data || [];

  // Filter bank and credit card accounts
  const bankAccounts = accounts.filter(a => 
    a.type === "banco" || a.type === "tarjeta_credito" || a.type === "deuda_fiado"
  );

  // Calculate totals
  const totalDebt = bankAccounts
    .filter(a => a.type === "tarjeta_credito" || a.type === "deuda_fiado")
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="font-delicate text-2xl font-semibold text-text-primary">
          Banco
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Vencimientos e intereses
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent>
            <p className="text-xs text-text-muted mb-1">Deuda Total</p>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(totalDebt)}
            </p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard variant="lavender" className="text-center">
          <GlassCardContent>
            <p className="text-xs text-text-muted mb-1">Cuentas</p>
            <p className="text-2xl font-bold text-primary-700">
              {bankAccounts.length}
            </p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Add Account Button */}
      <GlassCard variant="lavender">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-200">
            <Plus className="h-5 w-5 text-primary-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">
              Agregar cuenta bancaria o tarjeta
            </p>
          </div>
          <Button size="sm">Agregar</Button>
        </div>
      </GlassCard>

      {/* Accounts List */}
      {bankAccounts.map((account) => {
        const config = getAccountTypeConfig(account.type);
        const Icon = config.icon;
        
        return (
          <GlassCard key={account.id} variant="default">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-primary-100">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                {account.name}
                <span className="ml-auto text-xs font-normal text-text-muted bg-primary-100 px-2 py-0.5 rounded-full">
                  {config.label}
                </span>
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted">Saldo/Deuda</p>
                  <p className={`text-xl font-bold ${
                    account.type === "tarjeta_credito" || account.type === "deuda_fiado" 
                      ? "text-red-600" 
                      : "text-text-primary"
                  }`}>
                    {account.type === "tarjeta_credito" || account.type === "deuda_fiado" 
                      ? "-" 
                      : ""}{formatCurrency(account.balance)}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Ver detalles
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        );
      })}

      {/* Empty State */}
      {bankAccounts.length === 0 && (
        <GlassCard variant="default" className="text-center py-8">
          <GlassCardContent>
            <Building2 className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No hay cuentas bancarias registradas.</p>
            <p className="text-text-muted text-sm mt-1">
              Agrega tus tarjetas y cuentas para llevar un control.
            </p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
