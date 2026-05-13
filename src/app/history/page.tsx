"use client";

import React from "react";
import { 
  History, 
  Search, 
  Calendar, 
  ArrowRight, 
  FileText, 
  Printer, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample Transaction Data
const transactions = [
  { id: "TX-9021", customer: "Alice Traoré", date: "2024-05-13", time: "14:30", amount: 15500, pv: 12, method: "Wave", type: "Produits", status: "Payé" },
  { id: "TX-9020", customer: "Mamadou Koné", date: "2024-05-13", time: "12:15", amount: 160000, pv: 120, method: "Espèces", type: "Kit Silver", status: "Payé" },
  { id: "TX-9019", customer: "Kadiatou Sylla", date: "2024-05-12", time: "16:45", amount: 8500, pv: 4, method: "Orange Money", type: "Produits", status: "Payé" },
  { id: "TX-9018", customer: "Yao Koffi", date: "2024-05-12", time: "11:20", amount: 45000, pv: 60, method: "Espèces", type: "Produits", status: "Payé" },
  { id: "TX-9017", customer: "Saliou Diop", date: "2024-05-11", time: "09:30", amount: 860000, pv: 720, method: "Wave", type: "Kit Platinum", status: "Payé" },
];

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <History className="w-8 h-8 mr-3 text-brand-teal" />
            Historique des Ventes
          </h1>
          <p className="text-slate-500 mt-1">Consultez et gérez vos transactions passées et les reçus.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4 mr-2" />
            Cette Semaine
          </button>
        </div>
      </div>

      {/* Search & Stats Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher par ID transaction, client ou SN..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal transition-all"
            />
          </div>
        </div>
        <div className="bg-brand-teal text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-brand-teal/20">
          <div>
            <p className="text-xs font-bold text-brand-teal/20 uppercase tracking-wider text-white/70">Total PV (Période)</p>
            <p className="text-2xl font-black">916 PV</p>
          </div>
          <div className="p-2 bg-white/20 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID / Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type / PV</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Montant</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Méthode</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">{tx.id}</p>
                    <p className="text-xs text-slate-500">{tx.date} à {tx.time}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                    {tx.customer}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.type}</p>
                    <p className="text-xs text-brand-teal font-bold">{tx.pv} PV</p>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900 dark:text-white whitespace-nowrap">
                    {tx.amount.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold text-slate-600 dark:text-slate-400">
                      {tx.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center text-xs font-bold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-brand-teal transition-colors" title="Imprimer">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-brand-teal transition-colors" title="Voir reçu">
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500">Affichage de 1 à 5 sur 120 transactions</p>
          <div className="flex items-center space-x-2">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 cursor-not-allowed"><ChevronLeft className="w-5 h-5" /></button>
            <button className="px-4 py-2 bg-brand-teal/10 dark:bg-brand-teal/20 text-brand-teal rounded-lg font-bold">1</button>
            <button className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-bold">2</button>
            <button className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-bold">3</button>
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
