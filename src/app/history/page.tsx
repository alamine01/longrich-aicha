/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Calendar, 
  ArrowRight, 
  FileText, 
  Printer, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, writeBatch, increment, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReceiptModal from "@/components/ReceiptModal";
import CustomerDetailsModal from "@/components/CustomerDetailsModal";

export default function HistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pour la modale de reçu
  const [selectedTx, setSelectedTx] = useState<any>(null);
  
  // Pour la modale de détails client
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<{sn: string | null, name: string, fallbackData?: any} | null>(null);

  const toggleStatus = async (tx: any) => {
    const currentStatus = tx.status === "unpaid" || tx.status === "Non payé" ? "unpaid" : "paid";
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    try {
      await updateDoc(doc(db, "sales", tx.id), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Impossible de modifier le statut.");
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSales(fetchedSales);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sales history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (tx: any) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette vente ?")) return;
    
    try {
      const batch = writeBatch(db);
      
      // Restaurer le stock si demandé
      if (tx.items && tx.items.length > 0) {
        const checkPromises = tx.items.map(async (item: any) => {
          if (item.productId && !item.productId.startsWith("kit_")) {
            const productRef = doc(db, "products", item.productId);
            try {
              const snap = await getDoc(productRef);
              if (snap.exists()) {
                batch.update(productRef, { stock: increment(item.quantity) });
              } else {
                console.warn(`Product ${item.productId} not found in database. Skipping stock restore.`);
              }
            } catch (err) {
              console.error(`Error checking product ${item.productId}:`, err);
            }
          }
        });
        
        await Promise.all(checkPromises);
      }
      
      // Supprimer la vente
      const saleRef = doc(db, "sales", tx.id);
      batch.delete(saleRef);
      
      await batch.commit();
      alert("Vente supprimée avec succès et stock restauré.");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Une erreur est survenue lors de la suppression.");
    }
  };

  const filteredSales = sales.filter(sale => {
    // Filtre de recherche texte
    const matchesSearch = sale.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customerSN?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;

    // Filtre de date
    if (dateFilter === "all") return true;

    const dateObj = sale.createdAt?.seconds 
      ? new Date(sale.createdAt.seconds * 1000) 
      : sale.createdAt 
        ? new Date(sale.createdAt) 
        : new Date();

    const now = new Date();
    
    if (dateFilter === "today") {
      return dateObj.toDateString() === now.toDateString();
    }
    
    if (dateFilter === "week") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return dateObj >= sevenDaysAgo;
    }
    
    if (dateFilter === "month") {
      return dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
    }

    return true;
  });

  const totalPeriodPV = filteredSales.reduce((sum, sale) => {
    const isPaid = sale.status !== "unpaid" && sale.status !== "Non payé";
    return sum + (isPaid ? Number(sale.totalPV || 0) : 0);
  }, 0);

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
          <div className="relative">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors font-medium outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="all">Toutes les transactions</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Les 7 derniers jours</option>
              <option value="month">Ce mois-ci</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Search & Stats Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par ID transaction, client ou code membre (SN)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal transition-all"
            />
          </div>
        </div>
        <div className="bg-brand-teal text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-brand-teal/20">
          <div>
            <p className="text-xs font-bold text-brand-teal/20 uppercase tracking-wider text-white/70">Total PV (Période)</p>
            <p className="text-2xl font-black">{totalPeriodPV.toLocaleString()} PV</p>
          </div>
          <div className="p-2 bg-white/20 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
          </div>
        ) : (
          <div className="w-full">
            {/* Vue Tableau pour grands écrans */}
            <div className="hidden lg:block overflow-x-auto">
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
                {filteredSales.map((tx) => {
                  const dateObj = tx.createdAt?.seconds 
                    ? new Date(tx.createdAt.seconds * 1000) 
                    : tx.createdAt 
                      ? new Date(tx.createdAt) 
                      : new Date();
                  const dateStr = dateObj.toLocaleDateString("fr-FR");
                  const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

                  // Detect type based on items count or names
                  let type = "Produits";
                  if (tx.items && tx.items.length === 1 && tx.items[0].name.toLowerCase().startsWith("kit")) {
                    type = tx.items[0].name;
                  }

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
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{tx.id}</p>
                        <p className="text-xs text-slate-500">{dateStr} à {timeStr}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {tx.customerName}
                        {tx.customerSN && <span className="block text-xs font-normal text-slate-500">SN: {tx.customerSN}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{type}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-brand-teal font-bold">{tx.totalPV} PV</p>
                          {tx.saleType && (
                            <span className={cn(
                              "px-2 py-0.5 text-[10px] font-bold rounded-md",
                              tx.saleType === "upgrade" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            )}>
                              {tx.saleType === "upgrade" ? "Upgrade" : "Détail"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {Number(tx.totalAmount).toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold text-slate-600 dark:text-slate-400">
                          {translateMethod(tx.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(tx)}
                          className={cn(
                            "flex items-center text-xs font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm",
                            tx.status === "unpaid" || tx.status === "Non payé"
                              ? "bg-rose-50 hover:bg-rose-100/75 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-50 hover:bg-emerald-100/75 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400"
                          )}
                          title="Cliquer pour changer le statut"
                        >
                          <span className={cn(
                            "w-2 h-2 rounded-full mr-2",
                            tx.status === "unpaid" || tx.status === "Non payé" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                          )}></span>
                          {tx.status === "unpaid" || tx.status === "Non payé" ? "Non payé" : "Payé"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedCustomerForDetails({ 
                                sn: tx.customerId || tx.customerSN, 
                                name: tx.customerName,
                                fallbackData: {
                                  nin: tx.customerNIN,
                                  phone: tx.customerPhone,
                                  address: tx.customerAddress,
                                  birthDate: tx.customerBirthDate,
                                  birthPlace: tx.customerBirthPlace,
                                  sponsorCode: tx.customerSponsor,
                                  placementCode: tx.customerPlacement
                                }
                              });
                            }}
                            className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-500 hover:text-indigo-600 hover:bg-indigo-100 transition-colors" 
                            title="Détails du client"
                          >
                            <User className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedTx(tx);
                              setTimeout(() => window.print(), 300);
                            }}
                            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-brand-teal transition-colors" 
                            title="Imprimer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedTx(tx)}
                            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-brand-teal transition-colors" 
                            title="Voir reçu"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(tx)}
                            className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" 
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Aucune transaction trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            {/* Vue Cartes pour petits écrans */}
            <div className="block lg:hidden p-4 space-y-4">
              {filteredSales.map((tx) => {
                const dateObj = tx.createdAt?.seconds 
                  ? new Date(tx.createdAt.seconds * 1000) 
                  : tx.createdAt 
                    ? new Date(tx.createdAt) 
                    : new Date();
                const dateStr = dateObj.toLocaleDateString("fr-FR");
                const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={tx.id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{tx.customerName}</p>
                        {tx.customerSN && <p className="text-xs font-mono text-brand-teal font-bold">{tx.customerSN}</p>}
                        {tx.saleType && (
                          <span className={cn(
                            "inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md",
                            tx.saleType === "upgrade" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          )}>
                            {tx.saleType === "upgrade" ? "Upgrade" : "Détail"}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 dark:text-white">{Number(tx.totalAmount).toLocaleString()} F</p>
                        <p className="text-xs text-brand-teal font-bold">{tx.totalPV} PV</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <span>{dateStr} à {timeStr}</span>
                      <button
                        onClick={() => toggleStatus(tx)}
                        className={cn(
                          "flex items-center font-bold px-2 py-0.5 rounded-full border transition-all",
                          tx.status === "unpaid" || tx.status === "Non payé"
                            ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400"
                            : "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                        )}
                      >
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full mr-1",
                          tx.status === "unpaid" || tx.status === "Non payé" ? "bg-rose-500" : "bg-emerald-500"
                        )}></span>
                        {tx.status === "unpaid" || tx.status === "Non payé" ? "Non payé" : "Payé"}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => setSelectedCustomerForDetails({ 
                          sn: tx.customerId || tx.customerSN, 
                          name: tx.customerName,
                          fallbackData: {
                            nin: tx.customerNIN,
                            phone: tx.customerPhone,
                            address: tx.customerAddress,
                            birthDate: tx.customerBirthDate,
                            birthPlace: tx.customerBirthPlace,
                            sponsorCode: tx.customerSponsor,
                            placementCode: tx.customerPlacement
                          }
                        })}
                        className="flex-1 flex items-center justify-center py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-lg font-bold text-xs hover:bg-indigo-100 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 mr-1" /> Profil
                      </button>
                      <button 
                        onClick={() => setSelectedTx(tx)}
                        className="flex-1 flex items-center justify-center py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs hover:bg-slate-300 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" /> Reçu
                      </button>
                      <button 
                        onClick={() => handleDelete(tx)}
                        className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredSales.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  Aucune transaction trouvée.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination Placeholder */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500">Affichage de {filteredSales.length} transaction(s)</p>
          <div className="flex items-center space-x-2">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 cursor-not-allowed"><ChevronLeft className="w-5 h-5" /></button>
            <button className="px-4 py-2 bg-brand-teal/10 dark:bg-brand-teal/20 text-brand-teal rounded-lg font-bold">1</button>
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 cursor-not-allowed"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <ReceiptModal 
        transaction={selectedTx} 
        onClose={() => setSelectedTx(null)} 
      />

      {selectedCustomerForDetails && (
        <CustomerDetailsModal
          customerSN={selectedCustomerForDetails.sn}
          transactionCustomerName={selectedCustomerForDetails.name}
          fallbackData={selectedCustomerForDetails.fallbackData}
          onClose={() => setSelectedCustomerForDetails(null)}
        />
      )}
    </div>
  );
}
