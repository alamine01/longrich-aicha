"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { X, Printer } from "lucide-react";

interface BarcodePrintModalProps {
  product: {
    name: string;
    price: number;
    barcode: string;
    pv?: number;
  };
  onClose: () => void;
}

export default function BarcodePrintModal({ product, onClose }: BarcodePrintModalProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && product.barcode) {
      JsBarcode(barcodeRef.current, product.barcode, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });
    }
  }, [product.barcode]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      alert("Veuillez autoriser les popups pour imprimer.");
      return;
    }

    const svgEl = barcodeRef.current;
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Code-barres - ${product.name}</title>
        <style>
          @page {
            size: 60mm 40mm;
            margin: 2mm;
          }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
          }
          .label {
            text-align: center;
            padding: 4mm;
            border: 1px dashed #ccc;
            display: inline-block;
          }
          .product-name {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .product-price {
            font-size: 10px;
            color: #555;
            margin-bottom: 6px;
          }
          .barcode-svg {
            display: block;
            margin: 0 auto;
          }
          @media print {
            .label {
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="product-name">${product.name}</div>
          <div class="product-price">${product.price.toLocaleString()} FCFA</div>
          <div class="barcode-svg">${svgData}</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Code-barres du produit</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center space-y-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center uppercase tracking-wide">
            {product.name}
          </p>
          <p className="text-xs text-slate-500">
            {product.price.toLocaleString()} FCFA
          </p>

          <div className="bg-white p-4 rounded-xl border border-slate-200 w-full flex justify-center">
            <svg ref={barcodeRef}></svg>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Code : {product.barcode}
          </p>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-brand-teal text-white rounded-lg font-bold hover:bg-brand-teal-dark transition-colors flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}
