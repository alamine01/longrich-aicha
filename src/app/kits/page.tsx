"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  X,
  Search,
  Plus,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, serverTimestamp, getDocs, writeBatch, doc, increment, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReceiptModal from "@/components/ReceiptModal";

interface KitItem {
  name: string;
  quantity: number;
}

interface KitOption {
  name: string;
  items: KitItem[];
}

interface Kit {
  name: string;
  price: number;
  pv: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  options: KitOption[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice?: number;
  pv: number;
  stock: number;
}

interface Transaction {
  id: string;
  customerName?: string;
  customerSN?: string | null;
  paymentMethod: string;
  totalAmount: number;
  totalPV: number;
  kitName?: string;
  createdAt?: { seconds?: number } | string | Date | null;
  items?: {
    productId: string;
    name: string;
    price: number;
    purchasePrice?: number;
    pv: number;
    quantity: number;
  }[];
  missingItems?: {
    name: string;
    quantity: number;
  }[];
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
  updatedAt?: { seconds?: number } | string | Date | null;
}

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
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerSN, setCustomerSN] = useState("");
  const [customerBirthDate, setCustomerBirthDate] = useState("");
  const [customerBirthPlace, setCustomerBirthPlace] = useState("");
  const [customerSponsor, setCustomerSponsor] = useState("");
  const [customerPlacement, setCustomerPlacement] = useState("");
  const [customerNIN, setCustomerNIN] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSaving, setIsSaving] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  const [registeredCustomers, setRegisteredCustomers] = useState<Customer[]>([]);
  const [showCustSuggestions, setShowCustSuggestions] = useState(false);

  // States for custom kits (Platinum & Platinum VIP)
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomItems, setSelectedCustomItems] = useState<{ [productId: string]: number }>({});
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const [startingKitName, setStartingKitName] = useState("Aucun (Nouveau membre)");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid" | "partial">("paid");
  const [paidAmountInput, setPaidAmountInput] = useState<string>("");

  const startingKitsOptions = useMemo(() => [
    { name: "Aucun (Nouveau membre)", price: 0, pv: 0 },
    { name: "Kit Q-Silver", price: 85000, pv: 60 },
    { name: "Kit Silver", price: 160000, pv: 120 },
    { name: "Kit Gold", price: 340000, pv: 240 },
    { name: "Kit Platinum", price: 860000, pv: 720 }
  ], []);

  const activeStartingKit = useMemo(() => {
    return startingKitsOptions.find(opt => opt.name === startingKitName) || { name: "Aucun (Nouveau membre)", price: 0, pv: 0 };
  }, [startingKitName, startingKitsOptions]);

  const targetPrice = useMemo(() => {
    if (!selectedKit) return 0;
    return Math.max(0, selectedKit.price - activeStartingKit.price);
  }, [selectedKit, activeStartingKit]);

  const targetPV = useMemo(() => {
    if (!selectedKit) return 0;
    return Math.max(0, selectedKit.pv - activeStartingKit.pv);
  }, [selectedKit, activeStartingKit]);

  const kitTotalAmount = useMemo(() => {
    if (!selectedKit) return 0;
    const isCustomKit = selectedKit.name === "Kit Platinum" || selectedKit.name === "Kit Platinum VIP";
    return isCustomKit ? targetPrice : selectedKit.price;
  }, [selectedKit, targetPrice]);

  const finalPaidAmount = useMemo(() => {
    if (paymentStatus === "paid") return kitTotalAmount;
    if (paymentStatus === "unpaid") return 0;
    const val = Number(paidAmountInput) || 0;
    return Math.min(kitTotalAmount, Math.max(0, val));
  }, [paymentStatus, paidAmountInput, kitTotalAmount]);

  const finalRemainingAmount = useMemo(() => {
    return Math.max(0, kitTotalAmount - finalPaidAmount);
  }, [kitTotalAmount, finalPaidAmount]);


  useEffect(() => {
    // 1. Écouter les clients en temps réel
    const unsubscribeCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
      const custs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setRegisteredCustomers(custs);
    });

    // 2. Écouter les produits en temps réel pour la sélection personnalisée
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(prods);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  // Liste et totaux des articles personnalisés choisis
  const customItemsList = useMemo(() => {
    return Object.entries(selectedCustomItems)
      .map(([id, qty]) => {
        const prod = products.find(p => p.id === id);
        return prod ? { ...prod, quantity: qty } : null;
      })
      .filter(Boolean) as (Product & { quantity: number })[];
  }, [selectedCustomItems, products]);

  const customTotalAmount = useMemo(() => {
    return customItemsList.reduce((sum: number, item: Product & { quantity: number }) => sum + (item.price * item.quantity), 0);
  }, [customItemsList]);

  const customTotalPV = useMemo(() => {
    return customItemsList.reduce((sum: number, item: Product & { quantity: number }) => sum + (item.pv * item.quantity), 0);
  }, [customItemsList]);

  const filteredSuggestions = (customerName.trim() === "" && customerSN.trim() === "")
    ? []
    : registeredCustomers.filter(c => 
        (c.name && c.name.toLowerCase().includes(customerName.toLowerCase())) ||
        (c.sn && c.sn.toLowerCase().includes(customerSN.toLowerCase()))
      ).slice(0, 5);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKit || !customerName) {
      alert("Veuillez remplir les informations du membre.");
      return;
    }

    setIsSaving(true);
    try {
      const option = selectedKit.options[selectedOptionIndex];
      const isCustomKit = selectedKit.name === "Kit Platinum" || selectedKit.name === "Kit Platinum VIP";
      
      const batch = writeBatch(db);
      
      const suppliedItems: {
        productId: string;
        name: string;
        price: number;
        purchasePrice?: number;
        pv: number;
        quantity: number;
      }[] = [];
      const missingItems: {
        name: string;
        quantity: number;
        status?: "pending" | "delivered";
      }[] = [];

      if (isCustomKit) {
        // Validation check for targets
        if (customTotalAmount < targetPrice || customTotalPV < targetPV) {
          alert(`Sélection insuffisante. Veuillez ajouter des produits jusqu'à atteindre au moins ${targetPrice.toLocaleString()} FCFA et ${targetPV} PV.`);
          setIsSaving(false);
          return;
        }

        // Add custom items to suppliedItems and deduct stock in batch
        customItemsList.forEach((item: Product & { quantity: number }) => {
          suppliedItems.push({
            productId: item.id,
            name: item.name,
            price: item.price,
            purchasePrice: item.purchasePrice || 0,
            pv: item.pv,
            quantity: item.quantity
          });
          const productRef = doc(db, "products", item.id);
          batch.update(productRef, { stock: increment(-item.quantity) });
        });
      } else {
        const requiredItems = option.items;

        // Fetch all products from DB for matching
        const productsSnap = await getDocs(collection(db, "products"));
        const dbProducts = productsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "",
            price: Number(data.price || 0),
            purchasePrice: Number(data.purchasePrice || 0),
            pv: Number(data.pv || 0),
            stock: Number(data.stock || 0)
          } as Product;
        });

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
                purchasePrice: match.purchasePrice || 0,
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
                quantity: missingQty,
                status: "pending"
              });
            }
          } else {
            // No match at all in DB -> 100% missing
            missingItems.push({
              name: reqItem.name,
              quantity: reqItem.quantity,
              status: "pending"
            });
          }
        }
      }

      // Add the sale transaction
      const saleRef = doc(collection(db, "sales"));
      const isUpgrade = isCustomKit && startingKitName !== "Aucun (Nouveau membre)";
      const finalKitName = isUpgrade 
        ? `Upgrade ${selectedKit.name} (depuis ${startingKitName})` 
        : (isCustomKit ? selectedKit.name : `${selectedKit.name} (${option.name})`);
      const finalAmount = isCustomKit ? targetPrice : selectedKit.price;
      const finalPV = isCustomKit ? targetPV : selectedKit.pv;

      batch.set(saleRef, {
        customerName,
        customerBirthDate: customerBirthDate || "",
        customerBirthPlace: customerBirthPlace || "",
        customerSN: null,
        customerSponsor: customerSponsor || "",
        customerPlacement: customerPlacement || "",
        customerNIN: customerNIN || "",
        customerAddress: customerAddress || "",
        customerPhone: customerPhone || "",
        paymentMethod,
        totalAmount: finalAmount,
        totalPV: finalPV,
        kitName: finalKitName,
        paymentStatus,
        status: paymentStatus,
        paidAmount: finalPaidAmount,
        remainingAmount: finalRemainingAmount,
        items: suppliedItems,
        missingItems: missingItems,
        createdAt: serverTimestamp()
      });

      const newTransaction = {
        id: saleRef.id,
        customerName,
        customerBirthDate: customerBirthDate || "",
        customerBirthPlace: customerBirthPlace || "",
        customerSN: null,
        customerSponsor: customerSponsor || "",
        customerPlacement: customerPlacement || "",
        customerNIN: customerNIN || "",
        customerAddress: customerAddress || "",
        customerPhone: customerPhone || "",
        paymentMethod,
        totalAmount: finalAmount,
        totalPV: finalPV,
        kitName: finalKitName,
        paymentStatus,
        status: paymentStatus,
        paidAmount: finalPaidAmount,
        remainingAmount: finalRemainingAmount,
        items: suppliedItems,
        missingItems: missingItems,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      };

      // Sauvegarder automatiquement le membre s'il a un SN
      if (customerSN && customerSN.trim() !== "") {
        const customerRef = doc(db, "customers", customerSN.trim());
        batch.set(customerRef, {
          name: customerName,
          sn: customerSN.trim(),
          sponsorCode: customerSponsor || "",
          placementCode: customerPlacement || "",
          nin: customerNIN || "",
          address: customerAddress || "",
          phone: customerPhone || "",
          updatedAt: serverTimestamp(),
          totalPV: increment(finalPV)
        }, { merge: true });
      }

      // Commit everything atomicaly
      await batch.commit();

      setSelectedKit(null);
      setSelectedOptionIndex(0);
      setCustomerName("");
      setCustomerSN("");
      setCustomerBirthDate("");
      setCustomerBirthPlace("");
      setCustomerSponsor("");
      setCustomerPlacement("");
      setCustomerNIN("");
      setCustomerAddress("");
      setCustomerPhone("");
      setSelectedCustomItems({});
      setCustomSearchQuery("");
      setStartingKitName("Aucun (Nouveau membre)");
      setPaymentMethod("cash");
      setPaymentStatus("paid");
      setPaidAmountInput("");


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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                  if (kit.name === "Kit Platinum" || kit.name === "Kit Platinum VIP") {
                    setStartingKitName("Kit Q-Silver");
                  } else {
                    setStartingKitName("Aucun (Nouveau membre)");
                  }
                }}
                className="mt-6 w-full py-3 px-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center text-xs sm:text-sm group/btn"
              >
                {"ENREGISTRER L'ADHÉSION"}
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
            {"Les PV indiqués ci-dessus sont les PV de base pour l'adhésion. Ces points seront automatiquement ajoutés au compte du nouveau membre et comptabilisés dans votre volume de stockiste lors de la validation. Le système déduira automatiquement les produits du stock en fonction de l'option choisie."}
          </p>
        </div>
      </div>

      {selectedKit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form 
            onSubmit={handleRegister} 
            className={cn(
              "bg-white dark:bg-slate-900 w-[95%] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col transition-all duration-300",
              selectedKit.name === "Kit Platinum" || selectedKit.name === "Kit Platinum VIP" 
                ? "max-w-3xl" 
                : "max-w-md"
            )}
          >
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
              
              {/* Product custom builder for Platinum & Platinum VIP */}
              {(selectedKit.name === "Kit Platinum" || selectedKit.name === "Kit Platinum VIP") ? (
                <div className="space-y-6">
                  {/* Progress & Targets header */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-3 shrink-0">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex justify-between items-center">
                        <span>🚨 OBJECTIFS DU KIT PERSONNALISÉ</span>
                        {startingKitName !== "Aucun (Nouveau membre)" && (
                          <span className="text-[10px] bg-brand-teal/20 text-brand-teal px-2 py-0.5 rounded-full lowercase font-bold">
                            upgrade
                          </span>
                        )}
                      </h3>
                      
                      {/* Starting Kit Selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          {"Choisir le kit actuel du client (pour upgrade/mise à niveau) :"}
                        </label>
                        <select
                          value={startingKitName}
                          onChange={(e) => {
                            setStartingKitName(e.target.value);
                            setSelectedCustomItems({}); // Reset custom selected items to let them build from scratch
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-brand-teal font-medium text-slate-900 dark:text-white"
                        >
                          {startingKitsOptions
                            .filter(opt => opt.price < selectedKit.price && opt.name !== "Aucun (Nouveau membre)")
                            .map(opt => (
                              <option key={opt.name} value={opt.name}>
                                {`${opt.name} (${opt.price.toLocaleString()} F | ${opt.pv} PV)`}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                      {/* Price Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600 dark:text-slate-400">Budget requis (FCFA)</span>
                          <span className={cn(
                            "font-black text-xs",
                            customTotalAmount >= targetPrice ? "text-emerald-500" : "text-amber-500"
                          )}>
                            {customTotalAmount.toLocaleString()} / {targetPrice.toLocaleString()} F
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              customTotalAmount >= targetPrice ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                            )}
                            style={{ width: `${targetPrice > 0 ? Math.min(100, (customTotalAmount / targetPrice) * 100) : 100}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* PV Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600 dark:text-slate-400">Points requis (PV)</span>
                          <span className={cn(
                            "font-black text-xs",
                            customTotalPV >= targetPV ? "text-emerald-500" : "text-brand-teal"
                          )}>
                            {customTotalPV} / {targetPV} PV
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              customTotalPV >= targetPV ? "bg-emerald-500 animate-pulse" : "bg-brand-teal"
                            )}
                            style={{ width: `${targetPV > 0 ? Math.min(100, (customTotalPV / targetPV) * 100) : 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {customTotalAmount >= targetPrice && customTotalPV >= targetPV ? (
                      <p className="text-[10px] text-emerald-500 font-black flex items-center pt-1 animate-bounce">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {"Objectifs atteints ! Vous pouvez valider l'adhésion."}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold pt-1">
                        {"* Ajoutez des produits du stock jusqu'à ce que les deux barres soient vertes."}
                      </p>
                    )}
                  </div>

                  {/* 2 columns layout for builder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Products list from stock */}
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          value={customSearchQuery}
                          onChange={(e) => setCustomSearchQuery(e.target.value)}
                          placeholder="Rechercher un produit à ajouter..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-xs"
                        />
                      </div>
                      
                      <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto pr-1 space-y-1 p-1 bg-slate-50/50 dark:bg-slate-900/50">
                        {products
                          .filter(p => normalizeName(p.name).includes(normalizeName(customSearchQuery)))
                          .map(prod => {
                            const currentQty = selectedCustomItems[prod.id] || 0;
                            return (
                              <div key={prod.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs hover:border-brand-teal/40 transition-colors">
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="font-bold text-slate-900 dark:text-white truncate">{prod.name}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">{prod.price.toLocaleString()} F | <span className="text-brand-teal font-black">{prod.pv} PV</span></p>
                                  <p className="text-[9px] text-slate-400 font-medium">Stock dispo : {prod.stock}</p>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (currentQty > 0) {
                                        const newQty = currentQty - 1;
                                        const updated = { ...selectedCustomItems };
                                        if (newQty === 0) {
                                          delete updated[prod.id];
                                        } else {
                                          updated[prod.id] = newQty;
                                        }
                                        setSelectedCustomItems(updated);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-500 border border-slate-100 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                    disabled={currentQty === 0}
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-6 text-center font-bold text-slate-900 dark:text-white">{currentQty}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (currentQty < prod.stock) {
                                        setSelectedCustomItems({
                                          ...selectedCustomItems,
                                          [prod.id]: currentQty + 1
                                        });
                                      } else {
                                        alert("Stock insuffisant !");
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-brand-teal border border-slate-100 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                    disabled={currentQty >= prod.stock}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Right: Selected items list */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">🛒 SÉLECTION ACTUELLE ({customItemsList.length} articles)</p>
                      <div className="border border-slate-100 dark:border-slate-800 rounded-xl max-h-60 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/40 p-3 divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                        {customItemsList.map((item: Product & { quantity: number }) => (
                          <div key={item.id} className="flex justify-between items-center text-xs pt-2 first:pt-0">
                            <div className="pr-2 min-w-0 flex-1">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{item.quantity} x {item.price.toLocaleString()} F | <span className="text-brand-teal">{item.pv * item.quantity} PV</span></p>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white flex-shrink-0">{(item.price * item.quantity).toLocaleString()} F</span>
                          </div>
                        ))}
                        {customItemsList.length === 0 && (
                          <div className="py-12 text-center text-slate-400 text-xs italic">
                            Aucun produit sélectionné.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Fixed option selector (KR1, KR2, Combo A...)
                selectedKit.options.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{"Choix de l'option *"}</label>
                    <select 
                      value={selectedOptionIndex}
                      onChange={(e) => setSelectedOptionIndex(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-brand-teal mb-3 font-medium text-slate-900 dark:text-white"
                    >
                      {selectedKit.options.map((opt: KitOption, idx: number) => (
                        <option key={idx} value={idx}>{opt.name}</option>
                      ))}
                    </select>
                    
                    {selectedKit.options[selectedOptionIndex].items.length > 0 && (
                      <div className="text-xs">
                        <p className="font-bold text-slate-500 mb-1">Contenu qui sera déduit :</p>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                          {selectedKit.options[selectedOptionIndex].items.map((it: KitItem, i: number) => (
                            <li key={i}>{it.quantity}x {it.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              )}

              <div className="space-y-4 relative">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du nouveau membre *</label>
                  <input 
                    type="text" 
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowCustSuggestions(true);
                    }}
                    onFocus={() => setShowCustSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCustSuggestions(false), 200)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal animate-none" 
                    placeholder="Ex: Marie Koné" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date de naissance *</label>
                    <input 
                      type="date" 
                      required
                      value={customerBirthDate}
                      onChange={(e) => setCustomerBirthDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lieu de naissance *</label>
                    <input 
                      type="text" 
                      required
                      value={customerBirthPlace}
                      onChange={(e) => setCustomerBirthPlace(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm" 
                      placeholder="Ex: Dakar" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">NIN (Identité)</label>
                  <input 
                    type="text" 
                    value={customerNIN}
                    onChange={(e) => setCustomerNIN(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" 
                    placeholder="Ex: 123456789" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Parrainage</label>
                    <input 
                      type="text" 
                      value={customerSponsor}
                      onChange={(e) => setCustomerSponsor(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm" 
                      placeholder="Code Parrain" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Placement</label>
                    <input 
                      type="text" 
                      value={customerPlacement}
                      onChange={(e) => setCustomerPlacement(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm" 
                      placeholder="Code Placement" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                    <input 
                      type="text" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm" 
                      placeholder="Numéro tel" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Adresse</label>
                    <input 
                      type="text" 
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm" 
                      placeholder="Adresse domicile" 
                    />
                  </div>
                </div>

                {showCustSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2">
                    {filteredSuggestions.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          setCustomerName(cust.name);
                          setCustomerSN(cust.sn);
                          setCustomerSponsor(cust.sponsorCode || "");
                          setCustomerPlacement(cust.placementCode || "");
                          setCustomerNIN(cust.nin || "");
                          setCustomerAddress(cust.address || "");
                          setCustomerPhone(cust.phone || "");
                          setShowCustSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer text-slate-800 dark:text-slate-200"
                      >
                        <p className="font-bold text-slate-900 dark:text-white">{cust.name}</p>
                        <p className="text-xs text-brand-teal font-semibold">{cust.sn}</p>
                      </button>
                    ))}
                  </div>
                )}
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

              {/* Statut du Règlement */}
              <div className="space-y-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Statut de Règlement</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "paid", label: "Payé", color: "border-emerald-500 text-emerald-500 dark:text-emerald-400" },
                    { id: "partial", label: "Avance", color: "border-amber-500 text-amber-500 dark:text-amber-400" },
                    { id: "unpaid", label: "Pas Payé", color: "border-rose-500 text-rose-500 dark:text-rose-400" }
                  ].map((status) => (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => {
                        setPaymentStatus(status.id as "paid" | "unpaid" | "partial");
                        if (status.id !== "partial") setPaidAmountInput("");
                      }}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer",
                        paymentStatus === status.id
                          ? cn("bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold shadow-sm", status.color)
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>

                {paymentStatus === "partial" && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Montant Avancé (FCFA)</label>
                    <input
                      type="number"
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      placeholder="Ex: 50000"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {finalRemainingAmount > 0 && (
                  <div className="flex justify-between items-center text-rose-500 font-bold text-xs py-1.5 px-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
                    <span>Reste à payer (Dette)</span>
                    <span>{finalRemainingAmount.toLocaleString()} FCFA</span>
                  </div>
                )}
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
                disabled={isSaving || ((selectedKit.name === "Kit Platinum" || selectedKit.name === "Kit Platinum VIP") && (customTotalAmount < targetPrice || customTotalPV < targetPV))}
                className="px-6 py-2 bg-brand-teal text-white rounded-lg font-bold hover:bg-brand-teal-dark transition-shadow flex items-center justify-center disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {"Valider l'adhésion"}
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
