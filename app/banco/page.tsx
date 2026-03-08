"use client";

import { useState, useEffect } from "react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  Building2, 
  Plus,
  ChevronRight
} from "lucide-react";
import { getAccounts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency, getAccountTypeConfig } from "@/lib/constants";
import { AddAccountForm } from "@/components/ui/AddAccountForm";
import { AccountDetailsModal } from "@/components/ui/AccountDetailsModal";
import type { Account } from "@/types/database";

/**
 * Banco Page - Client Component
 * Connected to Supabase for real data
 */
export default function BancoPage() {
  const [user, setUser] = useState<{ id: string; email: string; displayName: string } | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const userData = await getCurrentUser();
      setUser(userData);
      
      const accountsResult = await getAccounts(userData?.id || "");
      setAccounts(accountsResult.data || []);
      setLoading(false);
    }
    loadData();
  });

  // Filter bank and credit card accounts
  const bankAccounts = accounts.filter(a => 
    a.type === "banco" || a.type === "tarjeta_credito" || a.type === "deuda_fiado"
  );

  // Calculate totals
  const totalDebt = bankAccounts
    .filter(a => a.type === "tarjeta_credito" || a.type === "deuda_fiado")
    .reduce((sum, a) => sum + a.balance, 0);

  // Calculate days until due
  const getDaysUntilDue = (dueDay: number | null) => {
    if (!dueDay) return null;
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    if (dueDate < today) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Check if due date is close (within 5 days)
  const isDueSoon = (dueDay: number | null) => {
    const days = getDaysUntilDue(dueDay);
    return days !== null && days <= 5;
  };

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleCloseModal = () => {
    setSelectedAccount(null);
  };

  const handleAccountUpdated = async () => {
    // Reload accounts
    const userData = await getCurrentUser();
    const accountsResult = await getAccounts(userData?.id || "");
    setAccounts(accountsResult.data || []);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center pt-4 pb-2">
          <div className="h-8 w-48 bg-neutral-100 rounded mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-neutral-50 rounded-2xl animate-pulse" />
          <div className="h-24 bg-neutral-50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-2xl font-bold text-text-primary">
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
            <p className="text-2xl font-bold text-red-500">
              {formatCurrency(totalDebt)}
            </p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard variant="default" className="text-center">
          <GlassCardContent>
            <p className="text-xs text-text-muted mb-1">Cuentas</p>
            <p className="text-2xl font-bold text-primary">
              {bankAccounts.length}
            </p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Add Account Button / Form */}
      {showAddForm ? (
        <AddAccountForm onSuccess={handleAccountUpdated} />
      ) : (
        <Button 
          variant="primary" 
          className="w-full"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Cuenta
        </Button>
      )}

      {/* Accounts List */}
      {bankAccounts.map((account) => {
        const config = getAccountTypeConfig(account.type);
        const Icon = config.icon;
        const daysUntilDue = getDaysUntilDue(account.due_day ?? null);
        const dueSoon = isDueSoon(account.due_day ?? null);
        
        return (
          <GlassCard 
            key={account.id} 
            variant="default"
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleAccountClick(account)}
          >
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-background-secondary">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                {account.name}
                <span className="ml-auto text-xs font-normal text-text-muted bg-background-secondary px-2 py-0.5 rounded-full">
                  {config.label}
                </span>
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-text-muted">Saldo/Deuda</p>
                  <p className={`text-xl font-bold ${
                    account.type === "tarjeta_credito" || account.type === "deuda_fiado" 
                      ? "text-red-500" 
                      : "text-text-primary"
                  }`}>
                    {account.type === "tarjeta_credito" || account.type === "deuda_fiado" 
                      ? "-" 
                      : ""}{formatCurrency(account.balance)}
                  </p>
                  
                  {/* Due Date Indicator */}
                  {account.due_day && (account.type === "tarjeta_credito" || account.type === "deuda_fiado") && (
                    <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      dueSoon 
                        ? "bg-amber-100 text-amber-700" 
                        : "bg-green-100 text-green-700"
                    }`}>
                      <span>Vence: Día {account.due_day}</span>
                      {daysUntilDue !== null && (
                        <span>({daysUntilDue} días)</span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted" />
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

      {/* Account Details Modal */}
      {selectedAccount && user && (
        <AccountDetailsModal 
          account={selectedAccount}
          userId={user.id}
          onClose={handleCloseModal}
          onDelete={handleAccountUpdated}
        />
      )}
    </div>
  );
}
