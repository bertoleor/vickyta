"use client";

import { useState, useEffect } from "react";
import { GlassCard, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  Tag, 
  X, 
  Check
} from "lucide-react";
import { getCategories } from "@/lib/actions";
import { getCategoryIcon } from "@/lib/constants";
import type { Category } from "@/types/database";

interface CategorizationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly transactionDescription: string;
  readonly transactionAmount: number;
  readonly onCategorize: (categoryId: string) => Promise<void>;
}

/**
 * Categorization Modal
 * 
 * Two options:
 * A) Click to select category from list
 * B) Drag and drop (future implementation)
 */
export function CategorizationModal({
  isOpen,
  onClose,
  transactionDescription,
  transactionAmount,
  onCategorize,
}: CategorizationModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [view, setView] = useState<'macro' | 'sub'>('macro');
  const [isLoading, setIsLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      const result = await getCategories();
      if (result.data) {
        setCategories(result.data);
      }
    }
    loadCategories();
  }, []);

  // Get parent categories (macro)
  const macroCategories = categories.filter(c => c.parent_id === null);
  
  // Get subcategories for selected macro
  const subCategories = selectedMacro 
    ? categories.filter(c => c.parent_id === selectedMacro)
    : [];

  const handleSelectMacro = (macroId: string) => {
    setSelectedMacro(macroId);
    const subs = categories.filter(c => c.parent_id === macroId);
    if (subs.length > 0) {
      setView('sub');
    } else {
      // No subcategories, use macro directly
      handleCategorize(macroId);
    }
  };

  const handleSelectSub = (subId: string) => {
    setSelectedSub(subId);
  };

  const handleCategorize = async (categoryId: string) => {
    setIsLoading(true);
    try {
      await onCategorize(categoryId);
      onClose();
    } catch (error) {
      console.error('Error categorizing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (view === 'sub') {
      setView('macro');
      setSelectedMacro(null);
      setSelectedSub(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
            onClose();
          }
        }}
      />
      
      {/* Modal */}
      <GlassCard variant="elevated" className="relative w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary-100">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-text-primary">Clasificar Gasto</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-primary-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Transaction Info */}
        <div className="p-4 bg-primary-50/50 border-b border-primary-100">
          <p className="font-medium text-text-primary">{transactionDescription}</p>
          <p className="text-sm text-text-muted">{formatCurrency(transactionAmount)}</p>
        </div>

        {/* Content */}
        <GlassCardContent className="p-4 overflow-y-auto max-h-[40vh]">
          {view === 'macro' && (
            <div className="space-y-2">
              <p className="text-sm text-text-secondary mb-3">Selecciona una categoria:</p>
              {macroCategories.map((cat) => {
                const Icon = getCategoryIcon(cat.icon_slug);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectMacro(cat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedMacro === cat.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-white/50 text-text-primary hover:bg-white/70'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedMacro === cat.id 
                        ? 'bg-white/20' 
                        : 'bg-primary-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        selectedMacro === cat.id 
                          ? 'text-white' 
                          : 'text-primary-600'
                      }`} />
                    </div>
                    <span className="font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {view === 'sub' && (
            <div className="space-y-2">
              {/* Back button */}
              <button
                onClick={handleBack}
                className="text-sm text-primary-600 hover:text-primary-700 mb-2"
              >
                ← Volver a categorias
              </button>

              <p className="text-sm text-text-secondary mb-3">Subcategoria:</p>
              
              {subCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectSub(cat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedSub === cat.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/50 text-text-primary hover:bg-white/70'
                  }`}
                >
                  <span className="font-medium">{cat.name}</span>
                </button>
              ))}

              {/* Option to use macro category directly */}
              <div className="pt-3 border-t border-primary-100 mt-3">
                <button
                  onClick={() => selectedMacro && handleCategorize(selectedMacro)}
                  className="w-full text-sm text-text-muted hover:text-text-primary py-2"
                >
                  Usar categoria general
                </button>
              </div>
            </div>
          )}
        </GlassCardContent>

        {/* Footer */}
        {selectedSub && (
          <div className="p-4 border-t border-primary-100">
            <Button
              onClick={() => handleCategorize(selectedSub)}
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Guardar Categoria
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
