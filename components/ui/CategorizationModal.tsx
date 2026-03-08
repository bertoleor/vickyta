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
      <button 
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm border-none ring-0 w-full h-full cursor-default"
        onClick={onClose}
      />
      
      {/* Modal */}
      <GlassCard variant="elevated" className="relative w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text-primary">Clasificar Gasto</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-text-tertiary" />
          </button>
        </div>

        {/* Transaction Info */}
        <div className="p-4 bg-background-secondary/50 border-b border-neutral-100">
          <p className="font-bold text-text-primary text-base">{transactionDescription}</p>
          <p className="text-sm text-text-secondary font-medium">{formatCurrency(transactionAmount)}</p>
        </div>

        {/* Content */}
        <GlassCardContent className="p-4 overflow-y-auto max-h-[40vh]">
          {view === 'macro' && (
            <div className="space-y-2">
              <p className="text-sm text-text-secondary mb-3 font-medium">Selecciona una categoría:</p>
              {macroCategories.map((cat) => {
                const Icon = getCategoryIcon(cat.icon_slug);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectMacro(cat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedMacro === cat.id
                        ? 'bg-primary text-white shadow-soft'
                        : 'bg-background-secondary/50 text-text-primary hover:bg-background-secondary'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedMacro === cat.id 
                        ? 'bg-white/20' 
                        : 'bg-background-secondary'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        selectedMacro === cat.id 
                          ? 'text-white' 
                          : 'text-primary'
                      }`} />
                    </div>
                    <span className="font-bold text-sm">{cat.name}</span>
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
                className="text-sm text-primary font-bold hover:opacity-80 mb-2"
              >
                ← Volver a categorías
              </button>

              <p className="text-sm text-text-secondary mb-3 font-medium">Subcategoría:</p>
              
              {subCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectSub(cat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedSub === cat.id
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-background-secondary/50 text-text-primary hover:bg-background-secondary'
                  }`}
                >
                  <span className="font-bold text-sm">{cat.name}</span>
                </button>
              ))}

              {/* Option to use macro category directly */}
              <div className="pt-3 border-t border-neutral-100 mt-3">
                <button
                  onClick={() => selectedMacro && handleCategorize(selectedMacro)}
                  className="w-full text-sm text-text-tertiary hover:text-text-primary py-2 font-medium"
                >
                  Usar categoría general
                </button>
              </div>
            </div>
          )}
        </GlassCardContent>

        {/* Footer */}
        {selectedSub && (
          <div className="p-4 border-t border-neutral-100">
            <Button
              onClick={() => handleCategorize(selectedSub)}
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Guardar Categoría
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
