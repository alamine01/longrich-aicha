import React from "react";
import { X, Printer } from "lucide-react";

interface ReceiptModalProps {
  transaction: any;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-transparent print:p-0">
      <div 
        id="printable-receipt"
        className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-[80mm] print:max-w-[80mm] print:mx-auto"
      >
        {/* Modal Actions (Hidden in print) */}
        <div className="p-4 border-b border-slate-100 flex justify-end items-center print:hidden bg-slate-50">
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
        <div className="p-6 print:p-2 text-center font-mono text-sm print:text-xs">
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 mb-2 print:border-slate-300">
              <img src="/logo.jpg" alt="SEETLOXO LONGRICH Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-lg print:text-base font-black uppercase tracking-wider text-slate-900">SEETLOXO LONGRICH</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Reçu de transaction</p>
          </div>
          
          <div className="text-left border-t border-b border-slate-200 border-dashed py-3 mb-4 space-y-1">
            <p><strong>ID :</strong> {transaction.id}</p>
            <p><strong>Date :</strong> {dateStr} à {timeStr}</p>
            <p><strong>Client :</strong> {transaction.customerName || "Client Comptoir"}</p>
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
              {transaction.items?.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="py-2 pr-2">
                    {item.quantity}x {item.name}
                    <span className="block text-xs text-slate-500">{item.pv} PV</span>
                  </td>
                  <td className="py-2 text-right font-semibold">
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
          </div>

          {transaction.missingItems && transaction.missingItems.length > 0 && (
            <div className="border-t border-slate-900 border-dashed pt-4 pb-4 mt-2">
              <h3 className="text-slate-900 print:text-black font-black mb-2 text-sm">⚠️ RELIQUAT (À LIVRER)</h3>
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  {transaction.missingItems.map((item: any, i: number) => (
                    <tr key={`missing-${i}`}>
                      <td className="py-1">{item.quantity}x {item.name}</td>
                      <td className="py-1 text-right font-bold">Manquant</td>
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
