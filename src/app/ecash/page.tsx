/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Loader2, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins, 
  ArrowDownCircle, 
  ArrowUpCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function EcashPage() {
  const [activeTab, setActiveTab] = useState<"withdrawals" | "deposits" | "expenses" | "stats">("withdrawals");
  const [period, setPeriod] = useState<string>("month-0");

  // Dynamic month filter options (Current month + 4 previous months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    for (let i = 0; i <= 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      const label = i === 0 
        ? `${monthNames[monthIndex]} ${year} (Ce mois-ci)` 
        : `${monthNames[monthIndex]} ${year}`;
      const value = `month-${i}`;
      options.push({ label, value });
    }
    return options;
  }, []);
  
  // Data States
  const [sales, setSales] = useState<any[]>([]);
  const [ecash, setEcash] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stockAdditions, setStockAdditions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Loading States
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingEcash, setLoadingEcash] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [loadingStockAdditions, setLoadingStockAdditions] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // Form States - Withdrawal
  const [wName, setWName] = useState("");
  const [wAmount, setWAmount] = useState("");
  const [wPhone, setWPhone] = useState("");

  // Form States - Deposit
  const [dRef, setDRef] = useState("");
  const [dAmount, setDAmount] = useState("");

  // Form States - Expense
  const [eCategory, setECategory] = useState("Loyers");
  const [eAmount, setEAmount] = useState("");
  const [eDesc, setEDesc] = useState("");

  // Fetch data
  useEffect(() => {
    // 1. Listen to Sales for turnover statistics
    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      const fetchedSales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSales(fetchedSales);
      setLoadingSales(false);
    }, (err) => {
      console.error("Sales loading error:", err);
      setLoadingSales(false);
    });

    // 2. Listen to E-cash transactions (withdrawals and deposits)
    const qEcash = query(collection(db, "ecash"), orderBy("createdAt", "desc"));
    const unsubscribeEcash = onSnapshot(qEcash, (snapshot) => {
      const fetchedEcash = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEcash(fetchedEcash);
      setLoadingEcash(false);
    }, (err) => {
      console.error("E-cash loading error:", err);
      setLoadingEcash(false);
    });

    // 3. Listen to Expenses
    const qExpenses = query(collection(db, "expenses"), orderBy("createdAt", "desc"));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const fetchedExpenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenses(fetchedExpenses);
      setLoadingExpenses(false);
    }, (err) => {
      console.error("Expenses loading error:", err);
      setLoadingExpenses(false);
    });

    // 4. Listen to Stock Additions
    const qStockAdditions = query(collection(db, "stock_additions"), orderBy("createdAt", "desc"));
    const unsubscribeStockAdditions = onSnapshot(qStockAdditions, (snapshot) => {
      const fetchedAdditions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStockAdditions(fetchedAdditions);
      setLoadingStockAdditions(false);
    }, (err) => {
      console.error("Stock additions loading error:", err);
      setLoadingStockAdditions(false);
    });

    // 5. Listen to Products
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(fetchedProducts);
      setLoadingProducts(false);
    }, (err) => {
      console.error("Products loading error:", err);
      setLoadingProducts(false);
    });

    return () => {
      unsubscribeSales();
      unsubscribeEcash();
      unsubscribeExpenses();
      unsubscribeStockAdditions();
      unsubscribeProducts();
    };
  }, []);

  // Form Handlers
  const handleAddWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(wAmount);
    if (!wName || isNaN(amountNum) || amountNum <= 0) {
      alert("Veuillez renseigner un nom et un montant valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      const profit = amountNum > 5000 ? amountNum * 0.03 : 0;
      await addDoc(collection(db, "ecash"), {
        type: "withdrawal",
        memberName: wName,
        amount: amountNum,
        phone: wPhone || "",
        profit: profit,
        createdAt: serverTimestamp()
      });

      // Reset
      setWName("");
      setWAmount("");
      setWPhone("");
      alert("Retrait E-cash enregistré avec succès !");
    } catch (err) {
      console.error("Error adding withdrawal:", err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(dAmount);
    if (!dRef || isNaN(amountNum) || amountNum <= 0) {
      alert("Veuillez renseigner une référence et un montant valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      let profit = 0;
      if (amountNum >= 1000000) {
        profit = amountNum * 0.04;
      } else if (amountNum >= 400000) {
        profit = amountNum * 0.03;
      }

      await addDoc(collection(db, "ecash"), {
        type: "deposit",
        reference: dRef,
        amount: amountNum,
        profit: profit,
        createdAt: serverTimestamp()
      });

      // Reset
      setDRef("");
      setDAmount("");
      alert("Dépôt E-cash enregistré avec succès !");
    } catch (err) {
      console.error("Error adding deposit:", err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(eAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Veuillez renseigner un montant valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "expenses"), {
        category: eCategory,
        amount: amountNum,
        description: eDesc || "",
        createdAt: serverTimestamp()
      });

      // Reset
      setEAmount("");
      setEDesc("");
      alert("Dépense enregistrée avec succès !");
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (collName: string, id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) return;
    try {
      await deleteDoc(doc(db, collName, id));
      alert("Supprimé avec succès.");
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Erreur lors de la suppression.");
    }
  };

  // Filtered Lists & Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let currentStart = 0;
    let currentEnd = Infinity;

    if (period === "today") {
      currentStart = startOfToday;
    } else if (period === "week") {
      currentStart = now.getTime() - 7 * oneDayMs;
    } else if (period.startsWith("month-")) {
      const index = parseInt(period.split("-")[1] || "0", 10);
      const startMonth = new Date(now.getFullYear(), now.getMonth() - index, 1);
      currentStart = startMonth.getTime();
      const endMonth = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
      currentEnd = endMonth.getTime();
    } else {
      currentStart = 0;
      currentEnd = Infinity;
    }

    // Helpers to get item creation date
    const getCreatedAtMs = (item: any) => {
      return item.createdAt?.seconds
        ? item.createdAt.seconds * 1000
        : item.createdAt
          ? new Date(item.createdAt).getTime()
          : 0;
    };

    // Calculate Turnover and Profit from Paid Sales
    let totalSalesTurnover = 0;
    let totalSalesProfit = 0;
    sales.forEach((sale) => {
      const dateMs = getCreatedAtMs(sale);
      if (!dateMs) return;

      const isOldPaid = sale.status === "paid" || sale.status === "Payé";
      const paymentStatus = sale.paymentStatus || (isOldPaid ? "paid" : "unpaid");
      const isFullyPaid = paymentStatus === "paid";

      let actualPaidAmount = 0;
      if (sale.paidAmount !== undefined) {
        actualPaidAmount = Number(sale.paidAmount);
      } else {
        actualPaidAmount = isFullyPaid ? Number(sale.totalAmount || 0) : 0;
      }

      // Calculate sale cost
      let saleCost = 0;
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const itemPurchasePrice = Number(item.purchasePrice || 0);
          saleCost += itemPurchasePrice * Number(item.quantity || 1);
        });
      }
      const saleTotalAmount = Number(sale.totalAmount || 0);

      // Determine profit
      const getKitProfit = (kitName: string): number => {
        const name = kitName.toLowerCase();
        if (name.includes("depuis")) {
          const parts = name.split("depuis");
          const startingPart = parts[1] || "";
          if (startingPart.includes("q-silver") || startingPart.includes("q silver")) {
            return 5000;
          }
          return 10000;
        }
        if (name.includes("q-silver") || name.includes("q silver")) {
          return 5000;
        }
        return 10000;
      };

      const saleProfit = sale.kitName ? getKitProfit(sale.kitName) : saleTotalAmount - saleCost;

      if (period === "all" || (dateMs >= currentStart && dateMs < currentEnd)) {
        totalSalesTurnover += actualPaidAmount;
        if (isFullyPaid) {
          totalSalesProfit += saleProfit;
        }
      }
    });

    // Calculate total purchase cost of all sold products (turnover - profit)
    let totalStockPurchases = 0;
    sales.forEach((sale) => {
      const dateMs = getCreatedAtMs(sale);
      if (!dateMs) return;

      if (period === "all" || (dateMs >= currentStart && dateMs < currentEnd)) {
        let saleCost = 0;
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach((item: any) => {
            const itemPurchasePrice = Number(item.purchasePrice || 0);
            saleCost += itemPurchasePrice * Number(item.quantity || 1);
          });
        }
        const saleTotalAmount = Number(sale.totalAmount || 0);
        const getKitProfit = (kitName: string): number => {
          const name = kitName.toLowerCase();
          if (name.includes("depuis")) {
            const parts = name.split("depuis");
            const startingPart = parts[1] || "";
            if (startingPart.includes("q-silver") || startingPart.includes("q silver")) {
              return 5000;
            }
            return 10000;
          }
          if (name.includes("q-silver") || name.includes("q silver")) {
            return 5000;
          }
          return 10000;
        };

        const saleProfit = sale.kitName ? getKitProfit(sale.kitName) : saleTotalAmount - saleCost;
        const salePurchaseCost = saleTotalAmount - saleProfit;

        totalStockPurchases += salePurchaseCost;
      }
    });

    const longrichCommission = totalStockPurchases * 0.06;

    // E-cash totals
    let totalWithdrawalAmount = 0;
    let totalWithdrawalProfit = 0;
    let totalDepositAmount = 0;
    let totalDepositProfit = 0;

    ecash.forEach((item) => {
      const dateMs = getCreatedAtMs(item);
      if (!dateMs) return;

      if (period === "all" || (dateMs >= currentStart && dateMs < currentEnd)) {
        if (item.type === "withdrawal") {
          totalWithdrawalAmount += Number(item.amount || 0);
          totalWithdrawalProfit += Number(item.profit || 0);
        } else if (item.type === "deposit") {
          totalDepositAmount += Number(item.amount || 0);
          totalDepositProfit += Number(item.profit || 0);
        }
      }
    });

    // Expenses total
    let totalExpensesAmount = 0;
    expenses.forEach((item) => {
      const dateMs = getCreatedAtMs(item);
      if (!dateMs) return;

      if (period === "all" || (dateMs >= currentStart && dateMs < currentEnd)) {
        totalExpensesAmount += Number(item.amount || 0);
      }
    });

    const netProfit = longrichCommission + totalSalesProfit + totalWithdrawalProfit + totalDepositProfit - totalExpensesAmount;

    return {
      totalSalesTurnover,
      totalSalesProfit,
      longrichCommission,
      totalWithdrawalAmount,
      totalWithdrawalProfit,
      totalDepositAmount,
      totalDepositProfit,
      totalExpensesAmount,
      netProfit,
      totalStockPurchases
    };
  }, [sales, ecash, expenses, stockAdditions, period]);

  // Formatted date string helper
  const formatDate = (createdAt: any) => {
    if (!createdAt) return "En cours...";
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const withdrawalsList = useMemo(() => {
    return ecash.filter(item => item.type === "withdrawal");
  }, [ecash]);

  const depositsList = useMemo(() => {
    return ecash.filter(item => item.type === "deposit");
  }, [ecash]);

  const loading = loadingSales || loadingEcash || loadingExpenses || loadingStockAdditions || loadingProducts;

  // Find products that have stock > 0 but no stock_additions entries
  const productsMissingAdditions = useMemo(() => {
    if (loading) return [];
    const productIdsWithAdditions = new Set(stockAdditions.map(sa => sa.productId));
    return products.filter(p => Number(p.stock) > 0 && !productIdsWithAdditions.has(p.id));
  }, [products, stockAdditions, loading]);

  const handleMigrateStockAdditions = async () => {
    if (productsMissingAdditions.length === 0) return;
    if (!confirm(`Voulez-vous générer automatiquement l'historique d'achat pour les ${productsMissingAdditions.length} produit(s) concerné(s) ?`)) return;

    setMigrating(true);
    try {
      const { writeBatch, doc, collection } = await import("firebase/firestore");
      const batch = writeBatch(db);

      productsMissingAdditions.forEach(product => {
        const additionRef = doc(collection(db, "stock_additions"));
        batch.set(additionRef, {
          productId: product.id,
          productName: product.name,
          quantityAdded: Number(product.stock),
          purchasePrice: Number(product.purchasePrice || 0),
          createdAt: product.createdAt || serverTimestamp()
        });
      });

      await batch.commit();
      alert("Régularisation effectuée avec succès ! Les commissions et prix d'achat ont été recalculés.");
    } catch (error) {
      console.error("Migration error:", error);
      alert("Une erreur est survenue lors de la régularisation.");
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <Wallet className="w-8 h-8 mr-3 text-brand-teal" />
          E-cash & Dépenses
        </h1>
        <p className="text-slate-500 mt-1">Gérez vos retraits E-cash, dépôts au siège, dépenses de fonctionnement et analysez vos statistiques.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 w-full overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: "withdrawals", label: "Retraits E-cash", icon: ArrowDownCircle },
          { id: "deposits", label: "Dépôts Siège", icon: ArrowUpCircle },
          { id: "expenses", label: "Dépenses Charges", icon: Coins },
          { id: "stats", label: "Statistiques & Gains", icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center justify-center flex-1 px-4 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer",
              activeTab === tab.id
                ? "border-brand-teal text-brand-teal"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "withdrawals" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Enregistrer un Retrait</h2>
            <form onSubmit={handleAddWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom du membre *</label>
                <input 
                  type="text" 
                  required
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  placeholder="Ex: Fatou Diop"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Téléphone</label>
                <input 
                  type="text" 
                  value={wPhone}
                  onChange={(e) => setWPhone(e.target.value)}
                  placeholder="Ex: 77 000 00 00"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Montant à retirer (FCFA) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={wAmount}
                  onChange={(e) => setWAmount(e.target.value)}
                  placeholder="Ex: 25000"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm text-slate-900 dark:text-white"
                />
              </div>

              {Number(wAmount) > 0 && (
                <div className="p-3 bg-brand-teal/10 border border-brand-teal/20 rounded-lg text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    Bénéfice Stockiste (3%) : 
                    <span className="text-brand-teal ml-1 font-black text-sm">
                      {Number(wAmount) > 5000 ? (Number(wAmount) * 0.03).toLocaleString() : 0} FCFA
                    </span>
                  </p>
                  {Number(wAmount) <= 5000 && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">* Pas de bénéfice car le montant est inférieur ou égal à 5 000 FCFA.</p>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-teal text-white font-bold py-3 rounded-lg hover:bg-brand-teal/95 transition-all flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Plus className="w-5 h-5 mr-1" /> Enregistrer le retrait
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 dark:text-white">Historique des Retraits</h2>
              <span className="text-xs text-slate-500">{withdrawalsList.length} retrait(s) enregistré(s)</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Membre</th>
                    <th className="px-6 py-3">Montant</th>
                    <th className="px-6 py-3">Bénéfice Stockiste (3%)</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {withdrawalsList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-950 dark:text-white">{item.memberName}</p>
                        {item.phone && <p className="text-[10px] text-slate-500 font-semibold">{item.phone}</p>}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {Number(item.amount).toLocaleString()} F
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-black text-brand-teal">
                        {Number(item.profit || 0).toLocaleString()} F
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <button 
                          onClick={() => handleDelete("ecash", item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {withdrawalsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        Aucun retrait enregistré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "deposits" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Enregistrer un Dépôt Siège</h2>
            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Référence / Banque *</label>
                <input 
                  type="text" 
                  required
                  value={dRef}
                  onChange={(e) => setDRef(e.target.value)}
                  placeholder="Ex: Versement BOA ou Réf 2349"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Montant déposé (FCFA) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={dAmount}
                  onChange={(e) => setDAmount(e.target.value)}
                  placeholder="Ex: 500000"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm text-slate-900 dark:text-white"
                />
              </div>

              {Number(dAmount) > 0 && (
                <div className="p-3 bg-brand-teal/10 border border-brand-teal/20 rounded-lg text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    Bénéfice Stockiste : 
                    <span className="text-brand-teal ml-1 font-black text-sm">
                      {(() => {
                        const val = Number(dAmount);
                        if (val >= 1000000) return `${(val * 0.04).toLocaleString()} FCFA (4%)`;
                        if (val >= 400000) return `${(val * 0.03).toLocaleString()} FCFA (3%)`;
                        return "0 FCFA (0%)";
                      })()}
                    </span>
                  </p>
                  {Number(dAmount) < 400000 && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">* Les dépôts inférieurs à 400 000 FCFA ne donnent pas droit à un bénéfice.</p>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-teal text-white font-bold py-3 rounded-lg hover:bg-brand-teal/95 transition-all flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Plus className="w-5 h-5 mr-1" /> Enregistrer le dépôt
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 dark:text-white">Historique des Dépôts</h2>
              <span className="text-xs text-slate-500">{depositsList.length} dépôt(s) enregistré(s)</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Référence / Banque</th>
                    <th className="px-6 py-3">Montant</th>
                    <th className="px-6 py-3">Bénéfice Stockiste</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {depositsList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-semibold text-slate-950 dark:text-white">
                        {item.reference}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {Number(item.amount).toLocaleString()} F
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-black text-brand-teal">
                        {Number(item.profit || 0).toLocaleString()} F 
                        <span className="text-[10px] text-slate-400 font-medium ml-1">
                          ({Number(item.amount) >= 1000000 ? "4%" : Number(item.amount) >= 400000 ? "3%" : "0%"})
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <button 
                          onClick={() => handleDelete("ecash", item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {depositsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        Aucun dépôt enregistré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Enregistrer une Dépense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catégorie *</label>
                <select 
                  value={eCategory}
                  onChange={(e) => setECategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm text-slate-900 dark:text-white"
                >
                  <option value="Loyers">Loyer / Location</option>
                  <option value="Électricité">Électricité</option>
                  <option value="Internet">Internet / Réseau</option>
                  <option value="Salaires">Salaires / Main d'œuvre</option>
                  <option value="Matériel">Matériel / Fournitures</option>
                  <option value="Autres">Autres charges d'exploitation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Montant (FCFA) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={eAmount}
                  onChange={(e) => setEAmount(e.target.value)}
                  placeholder="Ex: 15000"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Notes</label>
                <textarea 
                  value={eDesc}
                  onChange={(e) => setEDesc(e.target.value)}
                  placeholder="Ex: Facture Internet Senelec..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Plus className="w-5 h-5 mr-1" /> Enregistrer la dépense
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 dark:text-white">Historique des Dépenses</h2>
              <span className="text-xs text-slate-500">{expenses.length} dépense(s) enregistré(s)</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Catégorie</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Montant</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {expenses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-bold rounded-md",
                          item.category === "Loyers" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                          item.category === "Électricité" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400" :
                          item.category === "Internet" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
                          item.category === "Salaires" ? "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" :
                          item.category === "Matériel" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400" :
                          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                        {item.description || <span className="italic text-xs text-slate-400">Aucune description</span>}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-rose-500 dark:text-rose-450">
                        -{Number(item.amount).toLocaleString()} F
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <button 
                          onClick={() => handleDelete("expenses", item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        Aucune dépense enregistrée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-8">
          {/* Controls */}
          <div className="flex items-center space-x-3 justify-end bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Période d'analyse :</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-teal text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer"
            >
              <option value="today">Aujourd'hui</option>
              <option value="week">7 derniers jours</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value="all">Tout l'historique</option>
            </select>
          </div>

          {/* Warning Banner for Missing Stock Additions */}
          {productsMissingAdditions.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-3 text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-amber-900 dark:text-amber-400">Anciens produits sans historique d'achat</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {productsMissingAdditions.length} produit(s) créé(s) avant la mise à jour n'ont pas d'historique d'approvisionnement. Cela fausse le calcul des commissions (6%).
                  </p>
                </div>
              </div>
              <button
                onClick={handleMigrateStockAdditions}
                disabled={migrating}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap cursor-pointer hover:scale-[1.02] flex items-center justify-center space-x-1"
              >
                {migrating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> Régularisation...
                  </>
                ) : (
                  "Régulariser maintenant"
                )}
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Turnover Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-emerald-500 text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Ventes Stockiste
                </span>
              </div>
              <div className="mt-6">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Chiffre d'Affaires Ventes</h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.totalSalesTurnover.toLocaleString()} FCFA
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs font-medium text-slate-500">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">Achats Stock (Prix Achat)</span>
                    <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {stats.totalStockPurchases.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">Longrich Commission (6%)</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-500 whitespace-nowrap">
                      +{stats.longrichCommission.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">Bénéfice Ventes</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-500 whitespace-nowrap">
                      +{stats.totalSalesProfit.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* E-cash Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-brand-teal text-white">
                  <Coins className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Bénéfices E-cash
                </span>
              </div>
              <div className="mt-6">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cumul Profits E-cash</h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {(stats.totalWithdrawalProfit + stats.totalDepositProfit).toLocaleString()} FCFA
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs font-medium text-slate-500">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">Profits Retraits membres (3%)</span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      +{stats.totalWithdrawalProfit.toLocaleString()} F
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">Profits Dépôts siège (3%/4%)</span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      +{stats.totalDepositProfit.toLocaleString()} F
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-rose-500 text-white">
                  <Coins className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Charges Exploitation
                </span>
              </div>
              <div className="mt-6">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total des Dépenses</h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.totalExpensesAmount.toLocaleString()} FCFA
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-start gap-2 text-xs font-medium text-slate-500">
                  <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">Loyers, électricité, salaires, etc.</span>
                  <span className="text-xs sm:text-sm font-black text-rose-500 whitespace-nowrap">
                    -{stats.totalExpensesAmount.toLocaleString()} F
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Global Net Profit Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Bénéfice Net Estimé du Stockiste</h2>
              <p className="text-slate-500 text-sm max-w-xl">
                Ce montant correspond à la somme de tous vos gains (Commission Longrich 6% sur les achats de stock, Bénéfices sur les ventes et Profits E-cash), moins l'ensemble de vos charges d'exploitation (dépenses).
              </p>
            </div>
            
            <div className={cn(
              "px-8 py-6 rounded-2xl border text-center min-w-[240px] flex flex-col justify-center",
              stats.netProfit >= 0 
                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400"
            )}>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Net Stockiste</span>
              <p className="text-3xl font-black mt-1">
                {stats.netProfit.toLocaleString()} FCFA
              </p>
              <div className="flex items-center justify-center text-xs font-extrabold mt-2">
                {stats.netProfit >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 mr-0.5" /> Positif (Excédent)
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 mr-0.5" /> Négatif (Déficit)
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
