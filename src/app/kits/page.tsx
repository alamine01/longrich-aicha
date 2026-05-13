"use client";

import React from "react";
import { 
  Award, 
  CheckCircle2, 
  ChevronRight, 
  Info,
  Layers,
  Star,
  Zap,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

const kits = [
  {
    name: "Kit Q-Silver",
    price: 85000,
    pv: 60,
    icon: Star,
    color: "bg-slate-400",
    options: ["Option KR1", "Option KR2"],
    description: "Kit d'entrée de gamme pour démarrer l'aventure Longrich."
  },
  {
    name: "Kit Silver",
    price: 160000,
    pv: 120,
    icon: Zap,
    color: "bg-zinc-400",
    options: ["Combo 1", "Combo 2"],
    description: "Le choix populaire pour une consommation personnelle équilibrée."
  },
  {
    name: "Kit Gold",
    price: 340000,
    pv: 240,
    icon: Award,
    color: "bg-amber-400",
    options: ["Pack Santé", "Pack Beauté"],
    description: "Idéal pour ceux qui souhaitent commencer à bâtir un réseau."
  },
  {
    name: "Kit Platinum",
    price: 860000,
    pv: 720,
    icon: Crown,
    color: "bg-indigo-400",
    options: ["Full Pack Premium"],
    description: "Pour les entrepreneurs sérieux visant une croissance rapide."
  },
  {
    name: "Kit Platinum VIP",
    price: 1860000,
    pv: 1680,
    icon: Crown,
    color: "bg-violet-600",
    options: ["VIP Executive Pack"],
    description: "Le niveau ultime pour maximiser les bonus dès le départ."
  }
];

export default function KitsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <Layers className="w-8 h-8 mr-3 text-brand-teal" />
          Kits de Démarrage Longrich
        </h1>
        <p className="text-slate-500 mt-1">Sélectionnez un kit pour enregistrer une nouvelle adhésion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kits.map((kit) => (
          <div key={kit.name} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
            <div className={cn("p-6 text-white relative", kit.color)}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                  <kit.icon className="w-8 h-8" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Longrich Original</span>
              </div>
              <h2 className="text-2xl font-black mb-1">{kit.name}</h2>
              <p className="text-white/80 text-sm font-medium">{kit.pv} PV Accumulés</p>
              {/* Abstract shape decoration */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{kit.price.toLocaleString()}</span>
                  <span className="text-slate-500 font-bold">FCFA</span>
                </div>
                <p className="text-slate-500 text-sm">{kit.description}</p>
                
                <div className="space-y-2 py-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase">Options disponibles :</p>
                  <div className="flex flex-wrap gap-2">
                    {kit.options.map(opt => (
                      <span key={opt} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button className="mt-6 w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center group/btn">
                ENREGISTRER L'ADHÉSION
                <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-start space-x-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-indigo-900 dark:text-indigo-300">Note sur les PV des Kits</h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
            Les PV indiqués ci-dessus sont les PV de base pour l'adhésion. Ces points seront automatiquement ajoutés au compte du nouveau membre et comptabilisés dans votre volume de stockiste lors de la validation.
          </p>
        </div>
      </div>
    </div>
  );
}
