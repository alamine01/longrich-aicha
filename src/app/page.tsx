"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  Package, 
  Users, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  ShoppingCart,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Dashboard() {
  const [allSales, setAllSales] = useState<any[]>([]);
  const [totalStock, setTotalStock] = useState(0);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year" | "all">("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Écouter les produits en temps réel pour le stock total
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      let stockSum = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        stockSum += Number(data.stock || 0);
      });
      setTotalStock(stockSum);
    }, (err) => console.log("Products loading error:", err));

    // 2. Écouter toutes les ventes pour calculer dynamiquement les statistiques
    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      const sales = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllSales(sales);
      setLoading(false);
    }, (err) => {
      console.log("Sales loading error:", err);
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
    };
  }, []);

  // 3. Calculer les statistiques filtrées par période
  const computedStats = useMemo(() => {
    const now = new Date();
    
    // Début de la journée actuelle (minuit)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const oneDayMs = 24 * 60 * 60 * 1000;

    let currentStart = 0;
    let prevStart = 0;
    let prevEnd = 0;

    switch (period) {
      case "today":
        currentStart = startOfToday;
        prevStart = startOfYesterday;
        prevEnd = startOfToday;
        break;
      case "week":
        currentStart = now.getTime() - 7 * oneDayMs;
        prevStart = now.getTime() - 14 * oneDayMs;
        prevEnd = currentStart;
        break;
      case "month":
        currentStart = now.getTime() - 30 * oneDayMs;
        prevStart = now.getTime() - 60 * oneDayMs;
        prevEnd = currentStart;
        break;
      case "year":
        currentStart = now.getTime() - 365 * oneDayMs;
        prevStart = now.getTime() - 730 * oneDayMs;
        prevEnd = currentStart;
        break;
      case "all":
      default:
        currentStart = 0;
        break;
    }

    let revenue = 0;
    let pv = 0;
    let count = 0;

    let prevRevenue = 0;
    let prevPv = 0;
    let prevCount = 0;

    allSales.forEach((sale) => {
      const createdAtMs = sale.createdAt?.seconds
        ? sale.createdAt.seconds * 1000
        : sale.createdAt
          ? new Date(sale.createdAt).getTime()
          : 0;

      if (!createdAtMs) return;

      const isPaid = sale.status !== "unpaid" && sale.status !== "Non payé";

      // Période courante
      if (period === "all" || createdAtMs >= currentStart) {
        if (isPaid) {
          revenue += Number(sale.totalAmount || 0);
          pv += Number(sale.totalPV || 0);
          count += 1;
        }
      }

      // Période précédente pour comparaison
      if (period !== "all" && createdAtMs >= prevStart && createdAtMs < prevEnd) {
        if (isPaid) {
          prevRevenue += Number(sale.totalAmount || 0);
          prevPv += Number(sale.totalPV || 0);
          prevCount += 1;
        }
      }
    });

    const getChangePercent = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? "+100%" : "0%";
      }
      const diff = ((current - previous) / previous) * 100;
      return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    };

    return {
      revenue,
      pv,
      count,
      revenueChange: getChangePercent(revenue, prevRevenue),
      revenueTrend: revenue >= prevRevenue ? "up" : "down",
      pvChange: getChangePercent(pv, prevPv),
      pvTrend: pv >= prevPv ? "up" : "down",
      countChange: getChangePercent(count, prevCount),
      countTrend: count >= prevCount ? "up" : "down",
    };
  }, [allSales, period]);

  // 4. Récupérer les 6 ventes les plus récentes
  const recentSales = useMemo(() => {
    return [...allSales]
      .sort((a, b) => {
        const timeA = a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
        const timeB = b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;
        return timeB - timeA;
      })
      .slice(0, 6);
  }, [allSales]);

  const statsConfig = [
    {
      name: period === "today" ? "Chiffre d'affaires (Aujourd'hui)" : 
            period === "week" ? "Chiffre d'affaires (Semaine)" :
            period === "month" ? "Chiffre d'affaires (Mois)" :
            period === "year" ? "Chiffre d'affaires (Année)" : "Chiffre d'affaires (Total)",
      value: `${computedStats.revenue.toLocaleString()} FCFA`,
      change: period === "all" ? "Global" : computedStats.revenueChange,
      trend: period === "all" ? "up" : computedStats.revenueTrend,
      icon: TrendingUp,
      color: "bg-emerald-500",
    },
    {
      name: period === "today" ? "PV Cumulés (Aujourd'hui)" :
            period === "week" ? "PV Cumulés (Semaine)" :
            period === "month" ? "PV Cumulés (Mois)" :
            period === "year" ? "PV Cumulés (Année)" : "PV Cumulés (Total)",
      value: `${computedStats.pv.toLocaleString()} PV`,
      change: period === "all" ? "Global" : computedStats.pvChange,
      trend: period === "all" ? "up" : computedStats.pvTrend,
      icon: BarChart3,
      color: "bg-brand-teal",
    },
    {
      name: period === "today" ? "Nombre de Ventes (Aujourd'hui)" :
            period === "week" ? "Nombre de Ventes (Semaine)" :
            period === "month" ? "Nombre de Ventes (Mois)" :
            period === "year" ? "Nombre de Ventes (Année)" : "Nombre de Ventes (Total)",
      value: `${computedStats.count.toLocaleString()} vente(s)`,
      change: period === "all" ? "Global" : computedStats.countChange,
      trend: period === "all" ? "up" : computedStats.countTrend,
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      name: "Stock Total",
      value: totalStock.toLocaleString(),
      change: "Temps réel",
      trend: "up",
      icon: Package,
      color: "bg-amber-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">
            {period === "today" && "Bienvenue, voici un aperçu de votre activité aujourd'hui."}
            {period === "week" && "Bienvenue, voici un aperçu de votre activité cette semaine."}
            {period === "month" && "Bienvenue, voici un aperçu de votre activité ce mois-ci."}
            {period === "year" && "Bienvenue, voici un aperçu de votre activité cette année."}
            {period === "all" && "Bienvenue, voici un aperçu global de votre activité."}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrer par :</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-teal text-slate-800 dark:text-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine (7j)</option>
            <option value="month">Ce mois (30j)</option>
            <option value="year">Cette année (365j)</option>
            <option value="all">Tout l'historique</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={cn("p-3 rounded-xl text-white", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                stat.change === "Temps réel" || stat.change === "Global"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  : stat.trend === "up"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
              )}>
                {stat.change}
                {stat.change !== "Temps réel" && stat.change !== "Global" && (
                  stat.trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 ml-0.5" />
                )}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-500 text-sm font-medium">{stat.name}</h3>
              <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white mt-1 whitespace-nowrap">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ventes Récentes</h2>
          <Link href="/history" className="text-brand-teal hover:text-brand-teal/90 text-sm font-medium">
            Voir tout
          </Link>
        </div>
        <div className="space-y-4">
          {recentSales.map((sale) => {
            const date = sale.createdAt?.seconds 
              ? new Date(sale.createdAt.seconds * 1000) 
              : sale.createdAt 
                ? new Date(sale.createdAt) 
                : new Date();
            
            // Format format: date or time depending if it's today
            const isToday = date.toDateString() === new Date().toDateString();
            const dateStr = isToday 
              ? `Aujourd'hui à ${date.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}`
              : date.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            return (
              <div key={sale.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-teal">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{sale.customerName || "Client Comptoir"}</p>
                    <p className="text-xs text-slate-500">{dateStr}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap text-sm lg:text-base">+{Number(sale.totalAmount || 0).toLocaleString()} FCFA</p>
                  <p className="text-[10px] lg:text-xs text-brand-teal font-medium whitespace-nowrap">+{Number(sale.totalPV || 0)} PV</p>
                </div>
              </div>
            );
          })}
          {recentSales.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              Aucune vente enregistrée pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline helper
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
