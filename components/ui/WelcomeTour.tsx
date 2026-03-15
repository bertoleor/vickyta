"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Check, 
  Wallet, 
  CreditCard, 
  TrendingUp,
  Bell,
  X
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  actionUrl: string;
}

const tourSteps: TourStep[] = [
  {
    id: "accounts",
    title: "Agrega tus Cuentas",
    description: "Crea tus cuentas bancarias, billeteras virtuales y efectivo para comenzar a rastrear tu dinero.",
    icon: <Wallet className="h-8 w-8" />,
    actionText: "Ir a Cuentas",
    actionUrl: "/banco",
  },
  {
    id: "income",
    title: "Registra tus Ingresos",
    description: "Agrega tus ingresos regulares para ver tu balance real.",
    icon: <TrendingUp className="h-8 w-8" />,
    actionText: "Agregar Ingresos",
    actionUrl: "/ingresos",
  },
  {
    id: "cards",
    title: "Configura tus Tarjetas",
    description: "Agrega las fechas de vencimiento de tus tarjetas de crédito para no perder detalle.",
    icon: <CreditCard className="h-8 w-8" />,
    actionText: "Ver Cuentas",
    actionUrl: "/banco",
  },
  {
    id: "notifications",
    title: "Activa Notificaciones",
    description: "Recibe recordatorios de vencimiento de tarjetas y alertas de gastos.",
    icon: <Bell className="h-8 w-8" />,
    actionText: "Configurar",
    actionUrl: "/configuracion/notificaciones",
  },
];

interface WelcomeTourProps {
  readonly onComplete: () => void;
}

/**
 * Welcome Tour Component
 * Guides new users through initial app setup with smooth transitions
 */
export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("welcome_tour_completed", "true");
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem("welcome_tour_completed", "true");
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden relative"
        >
          <div className="h-1.5 bg-neutral-100">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
            />
          </div>

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 transition-colors z-20"
            aria-label="Omitir tour de bienvenida"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>

          {/* Content */}
          <div className="p-8 pt-10">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Icon */}
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-8 shadow-inner">
                  {step.icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-text-primary mb-3">
                  {step.title}
                </h2>

                {/* Description */}
                <p className="text-text-secondary font-medium leading-relaxed mb-8">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Step indicator */}
            <div className="flex justify-center gap-2.5 mb-8">
              {tourSteps.map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={{ 
                    width: idx === currentStep ? 24 : 8,
                    backgroundColor: idx <= currentStep ? "var(--accent-color, #8B5CF6)" : "#E5E5EA"
                  }}
                  className="h-2 rounded-full"
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1 h-12 rounded-2xl font-bold"
              >
                Omitir
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                {currentStep < tourSteps.length - 1 ? (
                  <>
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Finalizar
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to check if welcome tour should be shown
 */
export function useWelcomeTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if user has completed tour before
    const hasCompletedTour = localStorage.getItem("welcome_tour_completed");
    
    // Show tour if never completed
    if (!hasCompletedTour) {
      setShouldShowTour(true);
    }
    
    setIsLoaded(true);
  }, []);

  const completeTour = () => {
    localStorage.setItem("welcome_tour_completed", "true");
    setShouldShowTour(false);
  };

  return { shouldShowTour: isLoaded && shouldShowTour, completeTour };
}
