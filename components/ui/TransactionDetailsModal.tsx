"use client";

import { 
  X, 
  Calendar, 
  CreditCard,
  Wallet,
  Tag,
  FileText,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/constants";
import type { TransactionWithRelations } from "@/types/database";

interface TransactionDetailsModalProps {
  readonly transaction: TransactionWithRelations;
  readonly onClose: () => void;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
}

export function TransactionDetailsModal({ 
  transaction, 
  onClose, 
  onEdit, 
  onDelete 
}: TransactionDetailsModalProps) {
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "gasto":
        return "Gasto";
      case "ingreso":
        return "Ingreso";
      case "transferencia_interna":
        return "Transferencia";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "gasto":
        return "text-red-500";
      case "ingreso":
        return "text-green-500";
      case "transferencia_interna":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "gasto":
        return TrendingDown;
      case "ingreso":
        return TrendingUp;
      case "transferencia_interna":
        return ArrowLeftRight;
      default:
        return TrendingDown;
    }
  };

  const getMethodLabel = (method: string): string => {
    switch (method) {
      case "efectivo":
        return "Efectivo";
      case "tarjeta_debito":
        return "Tarjeta de Débito";
      case "tarjeta_credito":
        return "Tarjeta de Crédito";
      case "transferencia":
        return "Transferencia";
      case "otro":
        return "Otro";
      default:
        return method;
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TypeIcon = getTypeIcon(transaction.type);

  const getTypeBackgroundColor = (type: string): string => {
    if (type === 'gasto') return 'bg-red-100';
    if (type === 'ingreso') return 'bg-green-100';
    return 'bg-blue-100';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button 
        className="absolute inset-0 w-full h-full bg-black/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Cerrar modal"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Detalles del Movimiento</h2>
          <button 
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Amount & Type */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getTypeBackgroundColor(transaction.type)}`}>
                <TypeIcon className={`h-5 w-5 ${getTypeColor(transaction.type)}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{getTypeLabel(transaction.type)}</p>
                <p className={`text-2xl font-bold ${getTypeColor(transaction.type)}`}>
                  {transaction.type === "ingreso" ? "+" : "-"}{formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Descripción</p>
              <p className="text-sm font-medium text-gray-900">
                {transaction.description || "Sin descripción"}
              </p>
            </div>
          </div>

          {/* Category */}
          {transaction.category && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Categoría</p>
                <p className="text-sm font-medium text-gray-900">{transaction.category.name}</p>
              </div>
            </div>
          )}

          {/* Account */}
          {transaction.account && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <Wallet className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Cuenta</p>
                <p className="text-sm font-medium text-gray-900">{transaction.account.name}</p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Método de Pago</p>
              <p className="text-sm font-medium text-gray-900">{getMethodLabel(transaction.method)}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Fecha</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(transaction.date)}</p>
              <p className="text-xs text-gray-500">{formatTime(transaction.date)}</p>
            </div>
          </div>

          {/* Installment Info */}
          {transaction.is_installment && transaction.total_installments && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Cuota</p>
                <p className="text-sm font-medium text-gray-900">
                  {transaction.current_installment} de {transaction.total_installments}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          {onEdit && (
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="danger" 
              className="flex-1"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
