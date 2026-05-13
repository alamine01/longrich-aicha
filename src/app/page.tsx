"use client";

import React from "react";
import { 
  TrendingUp, 
  Package, 
  Users, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  ShoppingCart
} from "lucide-react";

const stats = [
  {
    name: "Ventes du jour",
    value: "145.000 FCFA",
    change: "+12.5%",
    trend: "up",
    icon: ShoppingCart,
    color: "bg-blue-500",
  },
  {
    name: "Chiffre d'affaires",
    value: "2.840.000 FCFA",
    change: "+18.2%",
    trend: "up",
    icon: TrendingUp,
    color: "bg-emerald-500",
  },
  {
    name: "Stock Total",
    value: "1,240",
    change: "-4",
    trend: "down",
    icon: Package,
    color: "bg-amber-500",
  },
  {
    name: "PV Cumulés",
    value: "12,450 PV",
    change: "+850",
    trend: "up",
    icon: BarChart3,
    color: "bg-brand-teal",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Bienvenue, voici un aperçu de votre activité aujourd'hui.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
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
          <button className="text-brand-teal hover:text-brand-teal/90 text-sm font-medium">Voir tout</button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-teal">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Client #{1024 + i}</p>
                  <p className="text-xs text-slate-500">Aujourd'hui à 14:{30 + i}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap text-sm lg:text-base">+{(15 + i) * 1000} FCFA</p>
                <p className="text-[10px] lg:text-xs text-indigo-500 font-medium whitespace-nowrap">+{(i + 1) * 20} PV</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline helper because I missed it earlier
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
