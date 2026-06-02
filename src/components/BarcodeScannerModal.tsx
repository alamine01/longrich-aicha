"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Loader2, CameraOff } from "lucide-react";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.error).finally(() => {
              scannerRef.current?.clear();
            });
          } else {
            scannerRef.current.clear();
          }
        } catch (e) {
          console.error("Cleanup error", e);
        }
        scannerRef.current = null;
      }
      return;
    }

    Promise.resolve().then(() => {
      setIsStarting(true);
      setErrorMsg("");
    });

    const onScanSuccess = (decodedText: string) => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          onScan(decodedText);
          onClose();
        });
      }
    };

    const onScanFailure = () => {
      // Ignorer les erreurs de lecture continues
    };

    // Timeout pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      const html5QrCode = new Html5Qrcode("barcode-reader");
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 }
        },
        onScanSuccess,
        onScanFailure
      ).then(() => {
        setIsStarting(false);
      }).catch((err) => {
        console.log("Erreur d'accès à la caméra", err);
        setErrorMsg("Impossible d'accéder à la caméra. Vérifiez les permissions (et que vous êtes en HTTPS ou localhost).");
        setIsStarting(false);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.error).finally(() => {
              scannerRef.current?.clear();
            });
          } else {
            scannerRef.current.clear();
          }
        } catch (e) {
          console.error("Cleanup error", e);
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Scanner un produit</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-1 flex flex-col items-center">
          
          <div className="relative w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 min-h-[300px] flex items-center justify-center">
            
            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <Loader2 className="w-10 h-10 animate-spin text-brand-teal mb-4" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Initialisation de la caméra...</p>
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-500 mb-4">
                  <CameraOff className="w-8 h-8" />
                </div>
                <p className="text-rose-600 dark:text-rose-400 font-medium">{errorMsg}</p>
              </div>
            )}

            <div id="barcode-reader" className="w-full h-full"></div>
            
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">{"Placez le code-barres dans la zone au-dessus pour l'ajouter automatiquement au panier."}</p>
        </div>
      </div>
    </div>
  );
}
