"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
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
    description: "Agrega tusSalary u otros ingresos regulares para ver tubalance real.",
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
    description: "Recibirecordatorios de vencimiento de tarjetas y alertas de gastos.",
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
 * Guides new users through initial app setup
 */
export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

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
    setIsClosing(true);
    // Save that tour was completed
    localStorage.setItem("welcome_tour_completed", "true");
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    localStorage.setItem("welcome_tour_completed", "true");
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-slide-up">
        {/* Progress bar */}
        <div className="h-1 bg-neutral-100">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Omitir tour de bienvenida"
        >
          <X className="h-5 w-5 text-text-muted" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
            {step.icon}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-text-primary text-center mb-2">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-text-secondary text-center text-sm mb-8">
            {step.description}
          </p>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {tourSteps.map((step) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  tourSteps.indexOf(step) <= currentStep ? 'bg-primary' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1"
            >
              Omitir
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2"
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
      </div>
    </div>
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
