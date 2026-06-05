import React from "react";
import { X, Printer } from "lucide-react";

interface TransactionItem {
  name: string;
  price: number;
  pv: number;
  quantity: number;
}

interface MissingItem {
  name: string;
  quantity: number;
  status?: "pending" | "delivered";
}

interface Transaction {
  id: string;
  customerName?: string;
  customerSN?: string | null;
  paymentMethod: string;
  totalAmount: number;
  totalPV: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
  items?: TransactionItem[];
  missingItems?: MissingItem[];
  paymentStatus?: "paid" | "unpaid" | "partial";
  paidAmount?: number;
  remainingAmount?: number;
  customerBirthDate?: string;
  customerBirthPlace?: string;
}

interface ReceiptModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  if (!transaction) return null;

  const dateObj = transaction.createdAt?.seconds 
    ? new Date(transaction.createdAt.seconds * 1000) 
    : transaction.createdAt 
      ? new Date(transaction.createdAt) 
      : new Date();
  
  const dateStr = dateObj.toLocaleDateString("fr-FR");
  const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

  const pendingMissingItems = transaction.missingItems?.filter(item => item.status !== "delivered") || [];
  const deliveredMissingItems = transaction.missingItems?.filter(item => item.status === "delivered") || [];

  const handlePrint = () => {
    window.print();
  };

  const translateMethod = (m: string) => {
    switch (m) {
      case "cash": return "Espèces";
      case "wave": return "Wave";
      case "om": return "Orange Money";
      case "momo": return "MTN MoMo";
      default: return m;
    }
  };

  return (
    <div 
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-transparent print:p-0"
    >
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0; /* Masque complètement les en-têtes et pieds de page par défaut du navigateur */
          }
          /* Réinitialisation de la hauteur et du défilement de tous les conteneurs parents lors de l'impression */
          html, body, div, main, section {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Positionnement absolu du conteneur de fond (backdrop) pour démarrer tout en haut de la page 1 et éviter les pages blanches */
          #receipt-modal-backdrop {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            z-index: 99999 !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
          }
          /* Masquer tout le site lors de l'impression */
          body > * {
            visibility: hidden !important;
          }
          /* Rendre visible uniquement la modale de reçu et son contenu */
          #receipt-modal-backdrop, #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          /* Flow standard en mode bloc sans positionnement absolu pour gérer parfaitement les sauts de page */
          #printable-receipt {
            position: relative !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 6mm 6mm !important; /* Marges internes adaptées pour A4 et rouleaux thermiques */
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      <div 
        id="printable-receipt"
        className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] print:max-h-none print:h-auto print:overflow-visible print:shadow-none print:rounded-none print:w-full print:max-w-none print:mx-0 print:px-4"
      >
        {/* Modal Actions (Hidden in print) */}
        <div className="p-4 border-b border-slate-100 flex justify-end items-center print:hidden bg-slate-50 flex-shrink-0">
          <button 
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal-dark font-bold mr-3"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 print:p-0 text-center font-mono text-sm print:text-xs overflow-y-auto flex-1 print:overflow-visible print:max-h-none">
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 mb-2 print:border-slate-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="SEETLOXO LONGRICH Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-lg print:text-base font-black uppercase tracking-wider text-slate-900">SEETLOXO LONGRICH</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Reçu de transaction</p>
          </div>
          
          <div className="text-left border-t border-b border-slate-200 border-dashed py-3 mb-4 space-y-1">
            <p><strong>ID :</strong> {transaction.id}</p>
            <p><strong>Date :</strong> {dateStr} à {timeStr}</p>
            <p><strong>Client :</strong> {transaction.customerName || "Client Comptoir"}</p>
            {transaction.customerBirthDate && (
              <p>
                <strong>Né(e) le :</strong> {(() => {
                  try {
                    const [year, month, day] = transaction.customerBirthDate.split("-");
                    if (year && month && day) return `${day}/${month}/${year}`;
                    return transaction.customerBirthDate;
                  } catch {
                    return transaction.customerBirthDate;
                  }
                })()}
                {transaction.customerBirthPlace ? ` à ${transaction.customerBirthPlace}` : ""}
              </p>
            )}
            {transaction.customerSN && <p><strong>SN :</strong> {transaction.customerSN}</p>}
            <p><strong>Paiement :</strong> {translateMethod(transaction.paymentMethod)}</p>
          </div>

          <table className="w-full text-left mb-4">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-1">Qte x Article</th>
                <th className="py-1 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transaction.items?.map((item: TransactionItem, i: number) => (
                <tr key={i}>
                  <td className="py-2 pr-2">
                    <span className="font-bold text-slate-950 block">{item.name}</span>
                    <div className="flex flex-wrap gap-x-2 text-[11px] text-slate-500 font-medium">
                      <span>{item.quantity} x {Number(item.price).toLocaleString()} F</span>
                      <span>•</span>
                      <span>{item.pv} PV</span>
                    </div>
                  </td>
                  <td className="py-2 text-right font-bold text-slate-900 align-top pt-2">
                    {(item.price * item.quantity).toLocaleString()} F
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-slate-900 border-dashed pt-3 pb-4 space-y-2">
            <div className="flex justify-between items-center text-lg print:text-base font-black">
              <span>TOTAL :</span>
              <span>{Number(transaction.totalAmount).toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center text-brand-teal print:text-slate-900 font-bold">
              <span>TOTAL PV :</span>
              <span>{transaction.totalPV} PV</span>
            </div>
            
            {transaction.paymentStatus && (
              <div className="border-t border-slate-200 border-dotted pt-2 mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Règlement :</span>
                  <span className="font-bold">
                    {transaction.paymentStatus === "paid" && "Payé entièrement"}
                    {transaction.paymentStatus === "unpaid" && "Non Payé (Dette)"}
                    {transaction.paymentStatus === "partial" && "Paiement Partiel"}
                  </span>
                </div>
                {transaction.paymentStatus === "partial" && (
                  <>
                    <div className="flex justify-between">
                      <span>Montant versé :</span>
                      <span className="font-bold">{Number(transaction.paidAmount || 0).toLocaleString()} F</span>
                    </div>
                    <div className="flex justify-between text-rose-600 print:text-black">
                      <span>Reste à payer :</span>
                      <span className="font-black">{Number(transaction.remainingAmount || 0).toLocaleString()} F</span>
                    </div>
                  </>
                )}
                {transaction.paymentStatus === "unpaid" && (
                  <div className="flex justify-between text-rose-600 print:text-black">
                    <span>Reste à payer :</span>
                    <span className="font-black">{Number(transaction.totalAmount).toLocaleString()} F</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {pendingMissingItems.length > 0 && (
            <div className="border-t border-slate-900 border-dashed pt-4 pb-4 mt-2">
              <h3 className="text-slate-900 print:text-black font-black mb-2 text-sm">⚠️ RELIQUAT (À LIVRER)</h3>
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  {pendingMissingItems.map((item: MissingItem, i: number) => (
                    <tr key={`pending-${i}`}>
                      <td className="py-1.5 pr-2">
                        <span className="font-bold text-slate-950 block">{item.name}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Quantité : {item.quantity}</span>
                      </td>
                      <td className="py-1.5 text-right font-bold align-top pt-1.5 text-amber-600">
                        En attente
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {deliveredMissingItems.length > 0 && (
            <div className="border-t border-slate-900 border-dashed pt-4 pb-4 mt-2">
              <h3 className="text-slate-900 print:text-black font-black mb-2 text-sm">✓ RELIQUAT (LIVRÉ)</h3>
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  {deliveredMissingItems.map((item: MissingItem, i: number) => (
                    <tr key={`delivered-${i}`}>
                      <td className="py-1.5 pr-2">
                        <span className="font-bold text-slate-950 block">{item.name}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Quantité : {item.quantity}</span>
                      </td>
                      <td className="py-1.5 text-right font-bold align-top pt-1.5 text-emerald-600">
                        Livré
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-4 italic">Merci de votre confiance !</p>
        </div>
      </div>
    </div>
  );
}
