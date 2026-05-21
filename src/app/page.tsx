"use client";

import React, { useState, useEffect } from "react";
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
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalRevenue: 0,
    totalStock: 0,
    totalPV: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Écouter les produits pour le stock total
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      let stockSum = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        stockSum += Number(data.stock || 0);
      });
      setStats((prev) => ({ ...prev, totalStock: stockSum }));
    }, (err) => console.log("Products loading error:", err));

    // 2. Écouter toutes les ventes pour les statistiques globales
    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      let revenueSum = 0;
      let pvSum = 0;
      let todaySum = 0;

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const amount = Number(data.totalAmount || 0);
        const pv = Number(data.totalPV || 0);
        
        revenueSum += amount;
        pvSum += pv;

        // Vérifier si la vente a été faite aujourd'hui
        if (data.createdAt) {
          const createdAtMs = data.createdAt.seconds 
            ? data.createdAt.seconds * 1000 
            : new Date(data.createdAt).getTime();
          if (createdAtMs >= startOfToday) {
            todaySum += amount;
          }
        }
      });

      setStats((prev) => ({
        ...prev,
        todaySales: todaySum,
        totalRevenue: revenueSum,
        totalPV: pvSum,
      }));
    }, (err) => console.log("Sales loading error:", err));

    // 3. Écouter les 6 ventes les plus récentes
    const recentSalesQuery = query(
      collection(db, "sales"),
      orderBy("createdAt", "desc"),
      limit(6)
    );

    const unsubscribeRecentSales = onSnapshot(recentSalesQuery, (snapshot) => {
      const sales = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentSales(sales);
      setLoading(false);
    }, (err) => {
      console.log("Recent sales loading error:", err);
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
      unsubscribeRecentSales();
    };
  }, []);

  const statsConfig = [
    {
      name: "Ventes du jour",
      value: `${stats.todaySales.toLocaleString()} FCFA`,
      change: "+12.5%",
      trend: "up",
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      name: "Chiffre d'affaires",
      value: `${stats.totalRevenue.toLocaleString()} FCFA`,
      change: "+18.2%",
      trend: "up",
      icon: TrendingUp,
      color: "bg-emerald-500",
    },
    {
      name: "Stock Total",
      value: stats.totalStock.toLocaleString(),
      change: "-4",
      trend: "down",
      icon: Package,
      color: "bg-amber-500",
    },
    {
      name: "PV Cumulés",
      value: `${stats.totalPV.toLocaleString()} PV`,
      change: "+850",
      trend: "up",
      icon: BarChart3,
      color: "bg-brand-teal",
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Bienvenue, voici un aperçu de votre activité aujourd'hui.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={cn("p-3 rounded-xl text-white", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center text-sm font-medium",
                stat.trend === "up" ? "text-emerald-600" : "text-rose-600"
              )}>
                {stat.change}
                {stat.trend === "up" ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
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
            const timeStr = date.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={sale.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-teal">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{sale.customerName || "Client Comptoir"}</p>
                    <p className="text-xs text-slate-500">Aujourd'hui à {timeStr}</p>
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
