"use client";

import React, { useState } from "react";
import { 
  Award, 
  CheckCircle2, 
  ChevronRight, 
  Info,
  Layers,
  Star,
  Zap,
  Crown,
  Loader2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, serverTimestamp, getDocs, writeBatch, doc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReceiptModal from "@/components/ReceiptModal";

const normalizeName = (str: string) => {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, ""); 
};

const kits = [
  {
    name: "Kit Q-Silver",
    price: 85000,
    pv: 60,
    icon: Star,
    color: "bg-slate-400",
    description: "Kit d'entrée de gamme pour démarrer l'aventure Longrich.",
    options: [
      {
        name: "Option KR1",
        items: [
          { name: "Crème de main (100g)", quantity: 1 },
          { name: "Pâte dentifrice (200g)", quantity: 1 },
          { name: "Calcium comprimé", quantity: 2 },
          { name: "The marron", quantity: 1 },
          { name: "Thé vert", quantity: 1 },
          { name: "The rose", quantity: 1 },
          { name: "Shampooing (300ml)", quantity: 1 },
          { name: "Senteur de bouche", quantity: 2 },
          { name: "Savon noir", quantity: 1 },
          { name: "Déo Anti-transpirant", quantity: 1 }
        ]
      },
      {
        name: "Option KR2",
        items: [
          { name: "Cordyceps Coffee", quantity: 2 },
          { name: "Pâte dentifrice (200g)", quantity: 2 },
          { name: "Arthro", quantity: 1 },
          { name: "Senteur de bouche", quantity: 2 },
          { name: "Anti-moustique 195ml", quantity: 1 },
          { name: "LAIT DE CORPS", quantity: 2 },
          { name: "Savon noir", quantity: 1 }
        ]
      }
    ]
  },
  {
    name: "Kit Silver",
    price: 160000,
    pv: 120,
    icon: Zap,
    color: "bg-zinc-400",
    description: "Le choix populaire pour une consommation personnelle équilibrée.",
    options: [
      {
        name: "Combo A",
        items: [
          { name: "Serviette Hygiénique", quantity: 1 },
          { name: "Pâte dentifrice (200g)", quantity: 3 },
          { name: "Arthro", quantity: 1 },
          { name: "Senteur de bouche", quantity: 1 },
          { name: "Calcium comprimé", quantity: 5 },
          { name: "LAIT DE CORPS", quantity: 2 },
          { name: "Savon noir", quantity: 1 },
          { name: "Anti-moustique 195ml", quantity: 1 }
        ]
      },
      {
        name: "Combo B",
        items: [
          { name: "Serviette Hygiénique", quantity: 1 },
          { name: "Pâte dentifrice (200g)", quantity: 2 },
          { name: "Arthro", quantity: 1 },
          { name: "Senteur de bouche", quantity: 1 },
          { name: "Hand Gel", quantity: 1 },
          { name: "LAIT DE CORPS", quantity: 2 },
          { name: "Savon noir", quantity: 1 },
          { name: "Shampooing (300ml)", quantity: 1 }
        ]
      },
      {
        name: "Combo C",
        items: [
          { name: "Pâte dentifrice (200g)", quantity: 4 },
          { name: "Calcium comprimé", quantity: 4 },
          { name: "Kit Hotel pour Voyage", quantity: 3 },
          { name: "Savon noir", quantity: 2 },
          { name: "Anti-moustique 195ml", quantity: 1 },
          { name: "Shampooing (300ml)", quantity: 1 },
          { name: "Gel de douche (300ml)", quantity: 1 },
          { name: "Crème de main (100g)", quantity: 4 },
          { name: "Crème de bébé 120ml", quantity: 1 },
          { name: "Shampooing & Gel bébé", quantity: 2 }
        ]
      }
    ]
  },
  {
    name: "Kit Gold",
    price: 340000,
    pv: 240,
    icon: Award,
    color: "bg-amber-400",
    description: "Idéal pour ceux qui souhaitent commencer à bâtir un réseau.",
    options: [
      {
        name: "Standard",
        items: [
          { name: "Serviette Hygiénique", quantity: 1 },
          { name: "Pâte dentifrice (200g)", quantity: 6 },
          { name: "Calcium comprimé", quantity: 3 },
          { name: "Kit Hôtel pour Voyage", quantity: 3 },
          { name: "Savon noir", quantity: 5 },
          { name: "Gel de douche (300ml)", quantity: 2 },
          { name: "Gobelet Alcalin", quantity: 1 },
          { name: "Anti-moustique 195ml", quantity: 4 },
          { name: "Shampooing & Gel bébé", quantity: 2 },
          { name: "Crème de main (100g)", quantity: 3 },
          { name: "Cordyceps Coffee", quantity: 4 },
          { name: "Liqueur", quantity: 2 },
          { name: "Déo Anti-transpirant", quantity: 2 },
          { name: "LAIT DE CORPS", quantity: 5 }
        ]
      }
    ]
  },
  {
    name: "Kit Platinum",
    price: 860000,
    pv: 720,
    icon: Crown,
    color: "bg-indigo-400",
    description: "Pour les entrepreneurs sérieux visant une croissance rapide.",
    options: [
      {
        name: "Standard",
        items: []
      }
    ]
  },
  {
    name: "Kit Platinum VIP",
    price: 1860000,
    pv: 1680,
    icon: Crown,
    color: "bg-violet-600",
    description: "Le niveau ultime pour maximiser les bonus dès le départ.",
    options: [
      {
        name: "Standard",
        items: []
      }
    ]
  }
];

export default function KitsPage() {
  const [selectedKit, setSelectedKit] = useState<any>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerSN, setCustomerSN] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSaving, setIsSaving] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKit || !customerName) {
      alert("Veuillez remplir les informations du membre.");
      return;
    }

    setIsSaving(true);
    try {
      const option = selectedKit.options[selectedOptionIndex];
      const requiredItems = option.items;

      // Fetch all products from DB for matching
      const productsSnap = await getDocs(collection(db, "products"));
      const dbProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      const batch = writeBatch(db);
      
      const suppliedItems: any[] = [];
      const missingItems: any[] = [];

      for (const reqItem of requiredItems) {
        // Try to find matching product
        const reqNorm = normalizeName(reqItem.name);
        // Find best match (DB name includes req name, or req name includes DB name)
        const match = dbProducts.find(p => {
          const pNorm = normalizeName(p.name);
          return pNorm.includes(reqNorm) || reqNorm.includes(pNorm);
        });

        if (match) {
          const currentStock = Number(match.stock || 0);
          const fulfilledQty = Math.min(currentStock, reqItem.quantity);
          const missingQty = reqItem.quantity - fulfilledQty;

          if (fulfilledQty > 0) {
            suppliedItems.push({
              productId: match.id,
              name: reqItem.name,
              price: match.price || 0,
              pv: match.pv || 0,
              quantity: fulfilledQty
            });
            // Deduct stock in batch
            const productRef = doc(db, "products", match.id);
            batch.update(productRef, { stock: increment(-fulfilledQty) });
          }

          if (missingQty > 0) {
            missingItems.push({
              name: reqItem.name,
              quantity: missingQty
            });
          }
        } else {
          // No match at all in DB -> 100% missing
          missingItems.push({
            name: reqItem.name,
            quantity: reqItem.quantity
          });
        }
      }

      // If no items were required (e.g. Platinum), at least log the kit name
      if (requiredItems.length === 0) {
        suppliedItems.push({
          productId: `kit_${selectedKit.name.toLowerCase().replace(/\s+/g, "_")}`,
          name: `${selectedKit.name} (${option.name})`,
          price: selectedKit.price,
          pv: selectedKit.pv,
          quantity: 1
        });
      }

      // Add the sale transaction
      const saleRef = doc(collection(db, "sales"));
      batch.set(saleRef, {
        customerName,
        customerSN: customerSN || null,
        paymentMethod,
        totalAmount: selectedKit.price,
        totalPV: selectedKit.pv,
        kitName: `${selectedKit.name} (${option.name})`,
        items: suppliedItems,
        missingItems: missingItems,
        createdAt: serverTimestamp()
      });

      const newTransaction = {
        id: saleRef.id,
        customerName,
        customerSN: customerSN || null,
        paymentMethod,
        totalAmount: selectedKit.price,
        totalPV: selectedKit.pv,
        kitName: `${selectedKit.name} (${option.name})`,
        items: suppliedItems,
        missingItems: missingItems,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      };

      // Commit everything atomicaly
      await batch.commit();

      setSelectedKit(null);
      setSelectedOptionIndex(0);
      setCustomerName("");
      setCustomerSN("");
      setPaymentMethod("cash");

      // Ouvrir automatiquement la modale de reçu pour le kit
      setCompletedTransaction(newTransaction);
    } catch (err) {
      console.error("Error saving kit sale:", err);
      alert("Une erreur est survenue lors de la validation.");
    } finally {
      setIsSaving(false);
    }
  };

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
                      <span key={opt.name} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                        {opt.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setSelectedKit(kit);
                  setSelectedOptionIndex(0);
                }}
                className="mt-6 w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center group/btn"
              >
                ENREGISTRER L'ADHÉSION
                <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-start space-x-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-indigo-900 dark:text-indigo-300">Note sur les PV des Kits</h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
            Les PV indiqués ci-dessus sont les PV de base pour l'adhésion. Ces points seront automatiquement ajoutés au compte du nouveau membre et comptabilisés dans votre volume de stockiste lors de la validation. Le système déduira automatiquement les produits du stock en fonction de l'option choisie.
          </p>
        </div>
      </div>

      {selectedKit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleRegister} className="bg-white dark:bg-slate-900 w-[95%] max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Adhésion : {selectedKit.name}</h2>
                <p className="text-sm text-slate-500">{selectedKit.price.toLocaleString()} FCFA — {selectedKit.pv} PV</p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedKit(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              
              {selectedKit.options.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Choix de l'option *</label>
                  <select 
                    value={selectedOptionIndex}
                    onChange={(e) => setSelectedOptionIndex(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-brand-teal mb-3 font-medium"
                  >
                    {selectedKit.options.map((opt: any, idx: number) => (
                      <option key={idx} value={idx}>{opt.name}</option>
                    ))}
                  </select>
                  
                  {selectedKit.options[selectedOptionIndex].items.length > 0 && (
                    <div className="text-xs">
                      <p className="font-bold text-slate-500 mb-1">Contenu qui sera déduit :</p>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                        {selectedKit.options[selectedOptionIndex].items.map((it: any, i: number) => (
                          <li key={i}>{it.quantity}x {it.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du nouveau membre *</label>
                <input 
                  type="text" 
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" 
                  placeholder="Ex: Marie Koné" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Code Membre (SN)</label>
                <input 
                  type="text" 
                  value={customerSN}
                  onChange={(e) => setCustomerSN(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" 
                  placeholder="Ex: SN12345678" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Méthode de paiement</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="cash">Espèces</option>
                  <option value="wave">Wave</option>
                  <option value="om">Orange Money</option>
                  <option value="momo">MTN MoMo</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 shrink-0">
              <button 
                type="button"
                onClick={() => setSelectedKit(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Annuler
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-brand-teal text-white rounded-lg font-bold hover:bg-brand-teal-dark transition-shadow flex items-center justify-center"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Valider l'adhésion
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modale de reçu automatique pour adhésion immédiate */}
      {completedTransaction && (
        <ReceiptModal 
          transaction={completedTransaction} 
          onClose={() => setCompletedTransaction(null)} 
        />
      )}
    </div>
  );
}
