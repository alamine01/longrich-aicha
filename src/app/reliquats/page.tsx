/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

const getNowTimestamp = () => Date.now();

import React, { useState, useEffect, useMemo } from "react";
import { 
  ClipboardList, 
  Users, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Trash2,
  PackageCheck,
  Package2,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDocs, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReceiptModal from "@/components/ReceiptModal";
import CustomerDetailsModal from "@/components/CustomerDetailsModal";

interface MissingItem {
  productId?: string;
  name: string;
  quantity: number;
  status?: "pending" | "delivered";
  deliveredAt?: number;
}

interface Transaction {
  id: string;
  customerName?: string;
  customerSN?: string | null;
  paymentMethod: string;
  totalAmount: number;
  totalPV: number;
  kitName?: string;
  createdAt?: any;
  items?: any[];
  missingItems?: MissingItem[];
  paymentStatus?: "paid" | "unpaid" | "partial";
  paidAmount?: number;
  remainingAmount?: number;
  customerPhone?: string;
  customerAddress?: string;
}

interface Customer {
  id: string;
  name: string;
  sn: string;
  sponsorCode?: string;
  placementCode?: string;
  nin?: string;
  address?: string;
  phone?: string;
  updatedAt?: any;
  totalPV?: number;
}

export default function ReliquatsPage() {
  const [activeTab, setActiveTab] = useState<"reliquats_kits" | "reliquats_normal" | "debts" | "customers">("reliquats_kits");
  const [sales, setSales] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [reliquatsSearch, setReliquatsSearch] = useState("");
  const [customersSearch, setCustomersSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<{sn: string | null, name: string} | null>(null);

  useEffect(() => {
    // 1. Écouter toutes les transactions contenant des reliquats ou des dettes
    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      const allSales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      // On garde toutes les transactions qui ont au moins un reliquat (missingItems) OU une dette restante
      const salesWithReliquatsOrDebt = allSales.filter(sale => 
        (sale.missingItems && sale.missingItems.length > 0) || 
        (sale.remainingAmount && sale.remainingAmount > 0)
      );
      setSales(salesWithReliquatsOrDebt);
      setLoadingSales(false);
    }, (error) => {
      console.error("Error loading sales data:", error);
      setLoadingSales(false);
    });

    // 2. Écouter tous les clients enregistrés
    const unsubscribeCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
      const allCusts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(allCusts);
      setLoadingCustomers(false);
    }, (error) => {
      console.error("Error loading customers:", error);
      setLoadingCustomers(false);
    });

    return () => {
      unsubscribeSales();
      unsubscribeCustomers();
    };
  }, []);

  // Marquer un produit d'un reliquat comme livré et déduire du stock
  const handleDeliverItem = async (transactionId: string, itemIndex: number) => {
    const tx = sales.find(s => s.id === transactionId);
    if (!tx || !tx.missingItems) return;

    const item = tx.missingItems[itemIndex];
    if (!confirm(`Confirmer la livraison de "${item.name}" ?`)) return;

    try {
      // 1. Déduire la quantité livrée du stock du produit
      let productRef = null;

      if (item.productId) {
        productRef = doc(db, "products", item.productId);
      } else {
        // Fallback de recherche par nom exact pour les anciens reliquats
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("name", "==", item.name));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          productRef = doc(db, "products", querySnapshot.docs[0].id);
        }
      }

      if (productRef) {
        await updateDoc(productRef, {
          stock: increment(-item.quantity)
        });
      } else {
        console.warn(`Produit "${item.name}" introuvable. Le stock n'a pas pu être déduit.`);
      }

      // 2. Mettre à jour l'élément à l'index spécifié dans la transaction
      const docRef = doc(db, "sales", transactionId);
      const updatedMissingItems = [...tx.missingItems];
      
      updatedMissingItems[itemIndex] = {
        ...updatedMissingItems[itemIndex],
        status: "delivered",
        deliveredAt: getNowTimestamp()
      };

      await updateDoc(docRef, {
        missingItems: updatedMissingItems
      });

      alert(`Livraison de "${item.name}" enregistrée et stock déduit avec succès !`);
    } catch (error) {
      console.error("Error delivering reliquat item:", error);
      alert("Une erreur est survenue lors de la livraison.");
    }
  };

  // Supprimer tout le reliquat (vider la liste des articles manquants)
  const handleDeleteEntireReliquat = async (transactionId: string) => {
    const tx = sales.find(s => s.id === transactionId);
    if (!tx) return;
    if (!confirm(`Voulez-vous vraiment supprimer tout le reliquat de "${tx.customerName || "Client"}" ?`)) return;

    try {
      const docRef = doc(db, "sales", transactionId);
      await updateDoc(docRef, {
        missingItems: []
      });
    } catch (error) {
      console.error("Error deleting entire reliquat:", error);
      alert("Une erreur est survenue lors de la suppression du reliquat.");
    }
  };

  // Supprimer un article spécifique du reliquat
  const handleDeleteReliquatItem = async (transactionId: string, itemIndex: number) => {
    const tx = sales.find(s => s.id === transactionId);
    if (!tx || !tx.missingItems) return;
    const itemName = tx.missingItems[itemIndex].name;
    if (!confirm(`Voulez-vous vraiment retirer "${itemName}" de la liste des reliquats ?`)) return;

    try {
      const docRef = doc(db, "sales", transactionId);
      const updatedMissingItems = tx.missingItems.filter((_, idx) => idx !== itemIndex);
      await updateDoc(docRef, {
        missingItems: updatedMissingItems
      });
    } catch (error) {
      console.error("Error deleting reliquat item:", error);
      alert("Une erreur est survenue lors de la suppression de l'article.");
    }
  };

  // Enregistrer un versement sur une dette restante
  const handleRecordPayment = async (transactionId: string) => {
    const tx = sales.find(s => s.id === transactionId);
    if (!tx || !tx.remainingAmount) return;

    const inputVal = prompt(
      `Enregistrer un règlement pour ${tx.customerName || "Client"}\nDette actuelle : ${tx.remainingAmount.toLocaleString()} FCFA\n\nEntrez le montant reçu (FCFA) :`,
      tx.remainingAmount.toString()
    );

    if (inputVal === null) return; // Annulé

    const paidVal = Number(inputVal);
    if (isNaN(paidVal) || paidVal <= 0) {
      alert("Montant invalide.");
      return;
    }

    if (paidVal > tx.remainingAmount) {
      alert(`Le montant saisi (${paidVal.toLocaleString()} F) dépasse la dette restante (${tx.remainingAmount.toLocaleString()} F).`);
      return;
    }

    try {
      const docRef = doc(db, "sales", transactionId);
      const newPaidAmount = (tx.paidAmount || 0) + paidVal;
      const newRemainingAmount = tx.remainingAmount - paidVal;
      const newStatus = newRemainingAmount === 0 ? "paid" : "partial";

      await updateDoc(docRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: newStatus
      });
      
      alert(
        newRemainingAmount === 0 
          ? "Paiement intégral enregistré ! La dette est soldée." 
          : `Acompte de ${paidVal.toLocaleString()} FCFA enregistré ! Reste à payer : ${newRemainingAmount.toLocaleString()} FCFA.`
      );
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Une erreur est survenue lors de la mise à jour du règlement.");
    }
  };

  // Supprimer un client de la base de données
  const handleDeleteCustomer = async (sn: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment retirer le membre "${name}" (ID: ${sn}) de la base de données ?`)) return;

    try {
      await deleteDoc(doc(db, "customers", sn));
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Impossible de supprimer le client.");
    }
  };

  // Filtrer les ventes ayant des reliquats en attente pour les ADHÉSIONS
  const pendingKitsReliquats = useMemo(() => {
    return sales.filter(tx => {
      if (!tx.kitName) return false;
      const hasPending = tx.missingItems?.some(item => item.status !== "delivered");
      if (!hasPending) return false;

      const query = reliquatsSearch.toLowerCase().trim();
      if (query === "") return true;

      return (
        tx.id.toLowerCase().includes(query) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(query)) ||
        (tx.customerSN && tx.customerSN.toLowerCase().includes(query)) ||
        tx.missingItems?.some(item => item.name.toLowerCase().includes(query))
      );
    });
  }, [sales, reliquatsSearch]);

  // Filtrer les ventes ayant des reliquats en attente pour les VENTES NORMALES
  const pendingNormalReliquats = useMemo(() => {
    return sales.filter(tx => {
      if (tx.kitName) return false;
      const hasPending = tx.missingItems?.some(item => item.status !== "delivered");
      if (!hasPending) return false;

      const query = reliquatsSearch.toLowerCase().trim();
      if (query === "") return true;

      return (
        tx.id.toLowerCase().includes(query) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(query)) ||
        (tx.customerSN && tx.customerSN.toLowerCase().includes(query)) ||
        tx.missingItems?.some(item => item.name.toLowerCase().includes(query))
      );
    });
  }, [sales, reliquatsSearch]);

  // Filtrer les ventes ayant une dette restante (reste à payer > 0)
  const pendingDebts = useMemo(() => {
    return sales.filter(tx => {
      const hasDebt = tx.remainingAmount && tx.remainingAmount > 0;
      if (!hasDebt) return false;

      // Filtre de recherche
      const query = reliquatsSearch.toLowerCase().trim();
      if (query === "") return true;

      return (
        tx.id.toLowerCase().includes(query) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(query)) ||
        (tx.customerSN && tx.customerSN.toLowerCase().includes(query))
      );
    });
  }, [sales, reliquatsSearch]);

  // Filtrer les reliquats déjà livrés pour l'historique des ADHÉSIONS
  const completedKitsReliquats = useMemo(() => {
    return sales.filter(tx => {
      if (!tx.kitName) return false;
      const allDelivered = tx.missingItems?.every(item => item.status === "delivered");
      if (!allDelivered || !tx.missingItems || tx.missingItems.length === 0) return false;

      const query = reliquatsSearch.toLowerCase().trim();
      if (query === "") return true;

      return (
        tx.id.toLowerCase().includes(query) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(query)) ||
        (tx.customerSN && tx.customerSN.toLowerCase().includes(query))
      );
    });
  }, [sales, reliquatsSearch]);

  // Filtrer les reliquats déjà livrés pour l'historique des VENTES NORMALES
  const completedNormalReliquats = useMemo(() => {
    return sales.filter(tx => {
      if (tx.kitName) return false;
      const allDelivered = tx.missingItems?.every(item => item.status === "delivered");
      if (!allDelivered || !tx.missingItems || tx.missingItems.length === 0) return false;

      const query = reliquatsSearch.toLowerCase().trim();
      if (query === "") return true;

      return (
        tx.id.toLowerCase().includes(query) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(query)) ||
        (tx.customerSN && tx.customerSN.toLowerCase().includes(query))
      );
    });
  }, [sales, reliquatsSearch]);

  // Filtrer les clients enregistrés
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      const query = customersSearch.toLowerCase().trim();
      if (query === "") return true;

      return (
        cust.name.toLowerCase().includes(query) ||
        cust.sn.toLowerCase().includes(query)
      );
    });
  }, [customers, customersSearch]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <ClipboardList className="w-8 h-8 mr-3 text-brand-teal" />
          Clients & Reliquats
        </h1>
        <p className="text-slate-500 mt-1">Gérez les produits en rupture à livrer ultérieurement et la base de données des membres.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 w-full overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab("reliquats_kits")}
          className={cn(
            "flex items-center justify-center flex-1 px-3 py-2.5 md:px-6 md:py-3 border-b-2 text-xs md:text-sm font-bold transition-all cursor-pointer flex-shrink-0",
            activeTab === "reliquats_kits"
              ? "border-brand-teal text-brand-teal"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          )}
        >
          <Package2 className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span className="hidden md:inline">Reliquats Adhésions</span>
          <span className="inline md:hidden">Adhésions</span>
          {sales.some(tx => tx.kitName && tx.missingItems?.some(it => it.status !== "delivered")) && (
            <span className="ml-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("reliquats_normal")}
          className={cn(
            "flex items-center justify-center flex-1 px-3 py-2.5 md:px-6 md:py-3 border-b-2 text-xs md:text-sm font-bold transition-all cursor-pointer flex-shrink-0",
            activeTab === "reliquats_normal"
              ? "border-brand-teal text-brand-teal"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          )}
        >
          <Package2 className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span className="hidden md:inline">Reliquats Ventes</span>
          <span className="inline md:hidden">Ventes</span>
          {sales.some(tx => !tx.kitName && tx.missingItems?.some(it => it.status !== "delivered")) && (
            <span className="ml-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("debts")}
          className={cn(
            "flex items-center justify-center flex-1 px-3 py-2.5 md:px-6 md:py-3 border-b-2 text-xs md:text-sm font-bold transition-all cursor-pointer flex-shrink-0",
            activeTab === "debts"
              ? "border-brand-teal text-brand-teal"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          )}
        >
          <Users className="w-4 h-4 mr-1.5 text-amber-500 flex-shrink-0" />
          <span className="hidden md:inline">Reste à payer (Dettes)</span>
          <span className="inline md:hidden">Dettes</span>
          {sales.some(tx => tx.remainingAmount && tx.remainingAmount > 0) && (
            <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={cn(
            "flex items-center justify-center flex-1 px-3 py-2.5 md:px-6 md:py-3 border-b-2 text-xs md:text-sm font-bold transition-all cursor-pointer flex-shrink-0",
            activeTab === "customers"
              ? "border-brand-teal text-brand-teal"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          )}
        >
          <Users className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span className="hidden md:inline">Base des Membres ({customers.length})</span>
          <span className="inline md:hidden">Membres ({customers.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {(activeTab === "reliquats_kits" || activeTab === "reliquats_normal") ? (
        (() => {
          const pendingList = activeTab === "reliquats_kits" ? pendingKitsReliquats : pendingNormalReliquats;
          const completedList = activeTab === "reliquats_kits" ? completedKitsReliquats : completedNormalReliquats;

          return (
            <div className="space-y-6">
              {/* Search bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={reliquatsSearch}
                    onChange={(e) => setReliquatsSearch(e.target.value)}
                    placeholder="Rechercher par ID transaction, client, code SN ou produit manquant..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal transition-all text-sm"
                  />
                </div>
              </div>

              {loadingSales ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {/* Outstanding/Pending section */}
                  <div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1.5 text-amber-500" />
                      Reliquats Actifs ({pendingList.length})
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pendingList.map((tx) => {
                        const dateObj = tx.createdAt?.seconds 
                          ? new Date(tx.createdAt.seconds * 1000) 
                          : tx.createdAt 
                            ? new Date(tx.createdAt) 
                            : new Date();
                        const dateStr = dateObj.toLocaleDateString("fr-FR");

                        return (
                          <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors">
                            {/* Card Header */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="p-1 bg-brand-teal/10 rounded-md text-brand-teal"><User className="w-4 h-4" /></span>
                                  <span className="font-bold text-slate-900 dark:text-white">{tx.customerName}</span>
                                </div>
                                {tx.customerSN && (
                                  <p className="text-xs text-brand-teal font-bold mt-1 ml-7">ID: {tx.customerSN}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0 text-xs text-slate-500 flex flex-col items-end">
                                <p className="font-mono font-bold truncate max-w-[100px]">{tx.id}</p>
                                <p className="flex items-center mt-1"><Calendar className="w-3 h-3 mr-1" /> {dateStr}</p>
                                <div className="flex space-x-1.5 mt-2 justify-end">
                                  <button
                                    onClick={() => setSelectedTx(tx)}
                                    className="flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-teal dark:hover:bg-brand-teal hover:text-white dark:hover:text-white text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-bold transition-all cursor-pointer hover:scale-105"
                                    title="Réimprimer le ticket de caisse"
                                  >
                                    <Printer className="w-3 h-3 mr-1" />
                                    Réimprimer
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEntireReliquat(tx.id)}
                                    className="flex items-center px-2 py-1 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white text-rose-600 dark:text-rose-400 rounded-md text-[10px] font-bold transition-all cursor-pointer hover:scale-105"
                                    title="Supprimer tout le reliquat"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-5 flex-1 space-y-4">
                              {tx.kitName && (
                                <p className="text-xs bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-1 rounded-md inline-block">
                                  Kits: {tx.kitName}
                                </p>
                              )}
                              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-auto max-h-60 w-full relative">
                                <table className="w-full text-left text-xs min-w-[280px]">
                                  <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                                      <th className="p-3 text-slate-500 font-bold bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm">Produit en rupture</th>
                                      <th className="p-3 text-slate-500 font-bold text-center bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm">Qté</th>
                                      <th className="p-3 text-slate-500 font-bold text-right bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {tx.missingItems?.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                        <td className="p-3 font-bold text-center">{item.quantity}</td>
                                        <td className="p-3 text-right">
                                          <div className="flex items-center justify-end space-x-2">
                                            {item.status === "delivered" ? (
                                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold text-[10px]">
                                                Livré
                                              </span>
                                            ) : (
                                              <button
                                                onClick={() => handleDeliverItem(tx.id, idx)}
                                                className="px-2.5 py-1 bg-brand-teal text-white hover:bg-brand-teal-dark rounded-md text-[10px] font-bold shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                              >
                                                Livrer
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleDeleteReliquatItem(tx.id, idx)}
                                              className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                              title="Supprimer cet article"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {pendingList.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          <PackageCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun reliquat en attente de livraison !</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Completed/Delivered section */}
                  {completedList.length > 0 && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
                        Historique des Livraisons Terminées ({completedList.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-75">
                        {completedList.map((tx) => {
                          const dateObj = tx.createdAt?.seconds 
                            ? new Date(tx.createdAt.seconds * 1000) 
                            : tx.createdAt 
                              ? new Date(tx.createdAt) 
                              : new Date();
                          const dateStr = dateObj.toLocaleDateString("fr-FR");

                          return (
                            <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 flex justify-between gap-4">
                                <div>
                                  <p className="font-bold text-slate-600 dark:text-slate-400">{tx.customerName}</p>
                                  {tx.customerSN && <p className="text-xs text-brand-teal font-medium mt-0.5">SN: {tx.customerSN}</p>}
                                </div>
                                <div className="text-right text-xs text-slate-500 flex flex-col items-end">
                                  <p className="font-mono truncate max-w-[80px]">{tx.id}</p>
                                  <p className="mt-0.5 flex items-center"><Calendar className="w-3 h-3 mr-1" /> {dateStr}</p>
                                  <div className="flex space-x-1.5 mt-1.5 justify-end">
                                    <button
                                      onClick={() => setSelectedTx(tx)}
                                      className="flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-teal dark:hover:bg-brand-teal hover:text-white dark:hover:text-white text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold transition-all cursor-pointer hover:scale-105"
                                      title="Réimprimer le ticket de caisse"
                                    >
                                      <Printer className="w-2.5 h-2.5 mr-1" />
                                      Réimprimer
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEntireReliquat(tx.id)}
                                      className="flex items-center px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white text-rose-600 dark:text-rose-400 rounded text-[9px] font-bold transition-all cursor-pointer hover:scale-105"
                                      title="Supprimer tout le reliquat"
                                    >
                                      <Trash2 className="w-2.5 h-2.5 mr-1" />
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-white dark:bg-slate-900">
                                <ul className="text-xs text-slate-500 space-y-1">
                                  {tx.missingItems?.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center py-1">
                                      <span>{item.quantity}x {item.name}</span>
                                      <span className="text-emerald-500 font-bold">✓ Livré</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()
      ) : activeTab === "debts" ? (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={reliquatsSearch}
                onChange={(e) => setReliquatsSearch(e.target.value)}
                placeholder="Rechercher par ID transaction, client, code SN..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal transition-all text-sm"
              />
            </div>
          </div>

          {loadingSales ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 text-amber-500" />
                  Reste à payer (Dettes actives) ({pendingDebts.length})
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingDebts.map((tx) => {
                    const dateObj = tx.createdAt?.seconds 
                      ? new Date(tx.createdAt.seconds * 1000) 
                      : tx.createdAt 
                        ? new Date(tx.createdAt) 
                        : new Date();
                    const dateStr = dateObj.toLocaleDateString("fr-FR");

                    return (
                      <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors">
                        {/* Card Header */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="p-1 bg-brand-teal/10 rounded-md text-brand-teal"><User className="w-4 h-4" /></span>
                              <span className="font-bold text-slate-900 dark:text-white">{tx.customerName}</span>
                            </div>
                            {tx.customerSN && (
                              <p className="text-xs text-brand-teal font-bold mt-1 ml-7">ID: {tx.customerSN}</p>
                            )}
                            {tx.customerPhone && (
                              <p className="text-[11px] text-slate-500 mt-1 ml-7 font-medium">📞 {tx.customerPhone}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 text-xs text-slate-500 flex flex-col items-end">
                            <p className="font-mono font-bold truncate max-w-[100px]">{tx.id}</p>
                            <p className="flex items-center mt-1"><Calendar className="w-3 h-3 mr-1" /> {dateStr}</p>
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="mt-2 flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-teal dark:hover:bg-brand-teal hover:text-white dark:hover:text-white text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-bold transition-all cursor-pointer hover:scale-105"
                              title="Réimprimer le ticket de caisse"
                            >
                              <Printer className="w-3 h-3 mr-1" />
                              Réimprimer
                            </button>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            {tx.kitName && (
                              <p className="text-xs bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-1 rounded-md inline-block">
                                Kits: {tx.kitName}
                              </p>
                            )}
                            
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                              <div className="flex justify-between text-xs font-semibold text-slate-500">
                                <span>Total Transaction :</span>
                                <span className="font-bold text-slate-900 dark:text-white">{Number(tx.totalAmount).toLocaleString()} F</span>
                              </div>
                              <div className="flex justify-between text-xs font-semibold text-slate-500">
                                <span>Montant Réglé :</span>
                                <span className="font-bold text-emerald-500">{Number(tx.paidAmount || 0).toLocaleString()} F</span>
                              </div>
                              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-rose-500">Reste à payer :</span>
                                <span className="text-rose-600 dark:text-rose-400 font-black">{Number(tx.remainingAmount).toLocaleString()} F</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRecordPayment(tx.id)}
                            className="w-full py-2.5 bg-brand-teal text-white hover:bg-brand-teal-dark rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center space-x-1"
                          >
                            <span>Enregistrer un Règlement</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {pendingDebts.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun reste à payer en attente !</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search customer */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={customersSearch}
                onChange={(e) => setCustomersSearch(e.target.value)}
                placeholder="Rechercher un membre par nom ou code Longrich (SN)..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal transition-all text-sm"
              />
            </div>
          </div>

          {loadingCustomers ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {/* Table View for large screens */}
              <div className="hidden lg:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Membre & Contact</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID & NIN</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Généalogie</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Cumul PV</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dernière activité</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredCustomers.map((cust) => {
                      const dateObj = cust.updatedAt?.seconds 
                        ? new Date(cust.updatedAt.seconds * 1000) 
                        : cust.updatedAt 
                          ? new Date(cust.updatedAt) 
                          : new Date();
                      const dateStr = dateObj.toLocaleDateString("fr-FR");

                      return (
                        <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 dark:text-white">{cust.name}</p>
                            {cust.phone && <p className="text-xs text-slate-500 font-semibold mt-0.5">📞 {cust.phone}</p>}
                            {cust.address && <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">{cust.address}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-mono font-bold text-brand-teal">{cust.sn}</p>
                            {cust.nin && <p className="text-[11px] text-slate-500 font-bold mt-0.5">NIN: {cust.nin}</p>}
                          </td>
                          <td className="px-6 py-4 text-xs space-y-0.5">
                            {cust.sponsorCode ? (
                              <p className="text-slate-600 dark:text-slate-400"><span className="text-[10px] text-slate-400 font-bold uppercase">Parrain:</span> {cust.sponsorCode}</p>
                            ) : (
                              <p className="text-[10px] text-slate-300 dark:text-slate-600 italic">Pas de parrain</p>
                            )}
                            {cust.placementCode ? (
                              <p className="text-slate-600 dark:text-slate-400"><span className="text-[10px] text-slate-400 font-bold uppercase">Placement:</span> {cust.placementCode}</p>
                            ) : (
                              <p className="text-[10px] text-slate-300 dark:text-slate-600 italic">Pas de placement</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-brand-teal/10 text-brand-teal dark:bg-brand-teal/20">
                              {cust.totalPV || 0} PV
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{dateStr}</td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setSelectedCustomerForDetails({ sn: cust.sn, name: cust.name })}
                                className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                title="Voir les détails du membre"
                              >
                                <User className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(cust.sn, cust.name)}
                                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                title="Retirer le membre de la base"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Card List View for mobile screens */}
              <div className="block lg:hidden p-4 space-y-4">
                {filteredCustomers.map((cust) => {
                  const dateObj = cust.updatedAt?.seconds 
                    ? new Date(cust.updatedAt.seconds * 1000) 
                    : cust.updatedAt 
                      ? new Date(cust.updatedAt) 
                      : new Date();
                  const dateStr = dateObj.toLocaleDateString("fr-FR");

                  return (
                    <div key={cust.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{cust.name}</p>
                          <p className="text-xs font-mono font-black text-brand-teal mt-0.5">{cust.sn}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-brand-teal/10 text-brand-teal dark:bg-brand-teal/20">
                          {cust.totalPV || 0} PV
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Téléphone</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{cust.phone || "Non renseigné"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Identité (NIN)</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{cust.nin || "Non renseigné"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Adresse</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 italic">{cust.address || "Non renseignée"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-100/40 dark:bg-slate-800/20 p-2 rounded-lg">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Parrain</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-450">{cust.sponsorCode || "Aucun"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Placement</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-455">{cust.placementCode || "Aucun"}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 font-semibold">
                        <span>Activité : {dateStr}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedCustomerForDetails({ sn: cust.sn, name: cust.name })}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>Détails</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(cust.sn, cust.name)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Retirer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCustomers.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  Aucun membre trouvé dans la base de données.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {selectedTx && (
        <ReceiptModal 
          transaction={selectedTx} 
          onClose={() => setSelectedTx(null)} 
        />
      )}
      
      {selectedCustomerForDetails && (
        <CustomerDetailsModal
          customerSN={selectedCustomerForDetails.sn}
          transactionCustomerName={selectedCustomerForDetails.name}
          onClose={() => setSelectedCustomerForDetails(null)}
        />
      )}
    </div>
  );
}
