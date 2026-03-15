"use client";

import { useEffect } from "react";

const onStateChange = (newWorker: ServiceWorker) => {
  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
    console.log("Nueva versión disponible");
  }
};

const onUpdateFound = (registration: ServiceWorkerRegistration) => {
  const newWorker = registration.installing;
  if (newWorker) {
    newWorker.addEventListener("statechange", () => onStateChange(newWorker));
  }
};

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    // Detect when a new service worker takes over and reload the page
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registrado:", registration.scope);
        
        // Initial check for updates
        registration.update();

        // Check for updates periodically or on focus
        const checkUpdate = () => {
          registration.update();
        };

        window.addEventListener("focus", checkUpdate);
        
        registration.addEventListener("updatefound", () => onUpdateFound(registration));

        return () => {
          window.removeEventListener("focus", checkUpdate);
        };
      })
      .catch((error) => {
        console.error("Error registrando Service Worker:", error);
      });
  }, []);

  return null;
}
