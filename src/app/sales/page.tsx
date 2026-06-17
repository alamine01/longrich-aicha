"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  ShoppingCart, 
  User, 
  CreditCard, 
  Smartphone, 
  Banknote,
  Trash2,
  Plus,
  Minus,
  Barcode,
  ChevronRight,
  FileText,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import { collection, onSnapshot, writeBatch, doc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReceiptModal from "@/components/ReceiptModal";
interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice?: number;
  pv: number;
  stock: number;
  barcode?: string;
}

interface TransactionItem {
  productId: string;
  name: string;
  price: number;
  purchasePrice?: number;
  pv: number;
  quantity: number;
}

interface Transaction {
  id: string;
  customerName?: string;
  customerSN?: string | null;
  paymentMethod: string;
  totalAmount: number;
  totalPV: number;
  items?: TransactionItem[];
  createdAt?: { seconds?: number } | string | Date | null;
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

const getNowSeconds = () => Math.floor(Date.now() / 1000);

const normalizeName = (str: string) => {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, ""); 
};

export default function SalesPage() {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [cart, setCart] = useState<(Product & { quantity: number })[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerSN, setCustomerSN] = useState("");
  const [customerSponsor, setCustomerSponsor] = useState("");
  const [customerPlacement, setCustomerPlacement] = useState("");
  const [customerNIN, setCustomerNIN] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saleType, setSaleType] = useState<"retail" | "upgrade">("upgrade");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid" | "partial">("paid");
  const [paidAmountInput, setPaidAmountInput] = useState<string>("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // New state for scan modal
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanQuantity, setScanQuantity] = useState<number | "">(1);
  const [scanClientName, setScanClientName] = useState("");
  const [scanClientSN, setScanClientSN] = useState("");
  const [scanPaymentMethod, setScanPaymentMethod] = useState("cash");
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  const [registeredCustomers, setRegisteredCustomers] = useState<Customer[]>([]);
  const [showCustSuggestions, setShowCustSuggestions] = useState(false);

  useEffect(() => {
    // Écouter les produits en temps réel
    const unsubscribeProds = onSnapshot(collection(db, "products"), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setAvailableProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error("Erreur de récupération des produits:", error);
      setLoading(false);
    });

    // Écouter les clients en temps réel
    const unsubscribeCusts = onSnapshot(collection(db, "customers"), (snapshot) => {
      const custs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setRegisteredCustomers(custs);
    });

    return () => {
      unsubscribeProds();
      unsubscribeCusts();
    };
  }, []);

  const filteredSuggestions = (customerName.trim() === "" && customerSN.trim() === "")
    ? []
    : registeredCustomers.filter(c => {
        const matchName = customerName.trim() !== "" ? (c.name && c.name.toLowerCase().includes(customerName.toLowerCase())) : false;
        const matchSN = customerSN.trim() !== "" ? (c.sn && c.sn.toLowerCase().includes(customerSN.toLowerCase())) : false;
        return matchName || matchSN;
      }).slice(0, 5);
  
  const handleScan = (code: string) => {
    try {
      const audio = new Audio('/beep.mp3');
      audio.play().catch(() => console.log('Audio non supporté'));
    } catch {
      // ignore
    }

    const product = availableProducts.find(p => p.barcode === code);
    if (product) {
      // Open modal to ask quantity and client info
      setScannedProduct(product);
      setScanQuantity(1);
      setScanClientName("");
      setScanClientSN("");
      setScanPaymentMethod("cash");
      setScanModalOpen(true);
      setSearchQuery("");
    } else {
      alert(`Produit non trouvé pour le code : ${code}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      const exactMatch = availableProducts.find(p => p.barcode === searchQuery.trim());
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery("");
      }
    }
  };

  const filteredProducts = availableProducts.filter(p => 
    normalizeName(p.name).includes(normalizeName(searchQuery)) || 
    (p.barcode && p.barcode.includes(searchQuery.trim()))
  );

  // Updated addToCart to accept quantity
  const addToCart = (product: Product, qty: number = 1) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      const newQty = existing.quantity + qty;
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: newQty } : item));
    } else {
      setCart([...cart, { ...product, quantity: qty }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };


  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalPV = cart.reduce((sum, item) => sum + (item.pv * item.quantity), 0);

  const finalPaidAmount = useMemo(() => {
    if (paymentStatus === "paid") return totalAmount;
    if (paymentStatus === "unpaid") return 0;
    const val = Number(paidAmountInput) || 0;
    return Math.min(totalAmount, Math.max(0, val));
  }, [paymentStatus, paidAmountInput, totalAmount]);

  const finalRemainingAmount = useMemo(() => {
    return Math.max(0, totalAmount - finalPaidAmount);
  }, [totalAmount, finalPaidAmount]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSaving(true);

    try {
      const batch = writeBatch(db);

      // Calculer les reliquats (missingItems) pour les produits hors stock
      const missingItems: {
        name: string;
        quantity: number;
        status: "pending" | "delivered";
      }[] = [];

      cart.forEach(item => {
        const originalProduct = availableProducts.find(p => p.id === item.id);
        const currentStock = originalProduct ? Math.max(0, originalProduct.stock) : 0;
        if (currentStock < item.quantity) {
          missingItems.push({
            name: item.name,
            quantity: item.quantity - currentStock,
            status: "pending"
          });
        }
      });

      // 1. Créer la commande dans "sales"
      const salesRef = doc(collection(db, "sales"));
      batch.set(salesRef, {
        customerName: customerName || "Client Comptoir",
        customerSN: customerSN || null,
        customerSponsor: customerSponsor || "",
        customerPlacement: customerPlacement || "",
        customerNIN: customerNIN || "",
        customerAddress: customerAddress || "",
        customerPhone: customerPhone || "",
        paymentMethod,
        saleType,
        totalAmount,
        totalPV,
        paymentStatus,
        status: paymentStatus,
        paidAmount: finalPaidAmount,
        remainingAmount: finalRemainingAmount,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          purchasePrice: item.purchasePrice || 0,
          pv: item.pv,
          quantity: item.quantity
        })),
        missingItems: missingItems,
        createdAt: serverTimestamp()
      });

      // 2. Mettre à jour les stocks dans "products"
      cart.forEach(item => {
        const productRef = doc(db, "products", item.id);
        const originalProduct = availableProducts.find(p => p.id === item.id);
        if (originalProduct) {
          const newStock = Math.max(0, originalProduct.stock - item.quantity);
          batch.update(productRef, { stock: newStock });
        }
      });

      // Sauvegarder automatiquement le membre s'il a un SN
      if (customerSN && customerSN.trim() !== "") {
        const customerRef = doc(db, "customers", customerSN.trim());
        batch.set(customerRef, {
          name: customerName || "Client Comptoir",
          sn: customerSN.trim(),
          sponsorCode: customerSponsor || "",
          placementCode: customerPlacement || "",
          nin: customerNIN || "",
          address: customerAddress || "",
          phone: customerPhone || "",
          updatedAt: serverTimestamp(),
          totalPV: increment(totalPV)
        }, { merge: true });
      }

      await batch.commit();

      const newTransaction = {
        id: salesRef.id,
        customerName: customerName || "Client Comptoir",
        customerSN: customerSN || null,
        customerSponsor: customerSponsor || "",
        customerPlacement: customerPlacement || "",
        customerNIN: customerNIN || "",
        customerAddress: customerAddress || "",
        customerPhone: customerPhone || "",
        paymentMethod,
        saleType,
        totalAmount,
        totalPV,
        paymentStatus,
        status: paymentStatus,
        paidAmount: finalPaidAmount,
        remainingAmount: finalRemainingAmount,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          purchasePrice: item.purchasePrice || 0,
          pv: item.pv,
          quantity: item.quantity
        })),
        missingItems: missingItems,
        createdAt: { seconds: getNowSeconds() }
      };

      // Réinitialiser le panier et l'interface
      setCart([]);
      setCustomerName("");
      setCustomerSN("");
      setCustomerSponsor("");
      setCustomerPlacement("");
      setCustomerNIN("");
      setCustomerAddress("");
      setCustomerPhone("");
      setPaymentMethod("cash");
      setSaleType("upgrade");
      setPaymentStatus("paid");
      setPaidAmountInput("");
      
      // Ouvrir automatiquement la modale de reçu pour impression immédiate
      setCompletedTransaction(newTransaction);

    } catch (error) {
      console.error("Erreur lors de la validation de la vente:", error);
      alert("Une erreur est survenue lors de l'enregistrement de la vente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmScan = () => {
    if (scannedProduct) {
      const qty = Number(scanQuantity);
      if (isNaN(qty) || qty < 1) {
        alert('Quantité invalide');
        return;
      }
      addToCart(scannedProduct, qty);
      setCustomerName(scanClientName);
      setCustomerSN(scanClientSN);
      setPaymentMethod(scanPaymentMethod);
      setScanModalOpen(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Product Selection */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Effectuer une Vente</h1>
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-brand-teal transition-colors"
                title="Scanner avec la caméra"
              >
                <Barcode className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Rechercher par nom ou scanner code-barres..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none transition-all"
            />
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {filteredProducts.map((product) => (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border text-left group transition-all",
                    product.stock > 0 
                      ? "border-slate-200 dark:border-slate-800 hover:border-brand-teal hover:bg-brand-teal/5 dark:hover:bg-brand-teal/10" 
                      : "border-rose-100 dark:border-rose-950/30 bg-rose-50/10 dark:bg-rose-950/5 hover:border-brand-teal hover:bg-brand-teal/5"
                  )}
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-brand-teal">{product.name}</p>
                    <p className="text-sm text-slate-500">
                      {product.price.toLocaleString()} FCFA | <span className="text-brand-teal font-medium">{product.pv} PV</span>
                    </p>
                    <p className={cn(
                      "text-xs font-bold mt-1",
                      product.stock > 10 ? "text-emerald-500" : product.stock > 0 ? "text-amber-500" : "text-rose-500"
                    )}>
                      {product.stock > 0 ? `Stock: ${product.stock}` : "Rupture de stock (Reliquat)"}
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-brand-teal" />
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500">
                  Aucun produit trouvé.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Display */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-brand-teal" />
              Panier Actuel
            </h2>
            <span className="text-sm text-slate-500">{cart.length} article(s)</span>
          </div>
          
          <div className="p-6">
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <p className="text-slate-500">Le panier est vide.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.price.toLocaleString()} FCFA / unité</p>
                      {item.stock < item.quantity && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">
                          ⚠️ {item.quantity - Math.max(0, item.stock)} en reliquat (à livrer après)
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-4">
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:text-brand-teal"><Minus className="w-4 h-4" /></button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:text-brand-teal"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="text-right w-28 flex-shrink-0">
                        <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap text-sm">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                        <p className="text-[10px] text-brand-teal font-medium whitespace-nowrap">{item.pv * item.quantity} PV</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Summary & Checkout */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <User className="w-5 h-5 mr-2 text-brand-teal" />
            Client
          </h2>
          <div className="space-y-4 relative">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom Complet</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setShowCustSuggestions(true);
                }}
                onFocus={() => setShowCustSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCustSuggestions(false), 200)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal"
                placeholder="Ex: Jean Dupont"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SN Longrich (ID)</label>
                <input 
                  type="text" 
                  value={customerSN}
                  onChange={(e) => {
                    setCustomerSN(e.target.value);
                    setShowCustSuggestions(true);
                  }}
                  onFocus={() => setShowCustSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCustSuggestions(false), 200)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                  placeholder="Ex: CI01234567"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Téléphone</label>
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                  placeholder="Ex: 77 123 45 67"
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
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">{cust.name}</p>
                    <p className="text-xs text-brand-teal font-semibold">{cust.sn}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-brand-teal" />
            Paiement
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'cash', label: 'Espèces', icon: Banknote },
              { id: 'wave', label: 'Wave', icon: Smartphone },
              { id: 'orange', label: 'Orange', icon: Smartphone },
            ].map((method) => (
              <button 
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                  paymentMethod === method.id 
                    ? "bg-brand-teal border-brand-teal text-white shadow-lg shadow-brand-teal/20 dark:shadow-none" 
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-brand-teal/50"
                )}
              >
                <method.icon className="w-6 h-6 mb-2" />
                <span className="text-xs font-bold">{method.label}</span>
              </button>
            ))}
          </div>

          {/* Type de Vente */}
          <div className="space-y-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-500 uppercase">Type de Vente</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSaleType("retail")}
                className={cn(
                  "py-2 px-3 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer",
                  saleType === "retail"
                    ? "bg-brand-teal border-brand-teal text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
                )}
              >
                Vente au détail personnelle (Retail)
              </button>
              <button
                type="button"
                onClick={() => setSaleType("upgrade")}
                className={cn(
                  "py-2 px-3 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer",
                  saleType === "upgrade"
                    ? "bg-violet-500 border-violet-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
                )}
              >
                Rehaussement de niveau
              </button>
            </div>
          </div>

          {/* Statut du Règlement */}
          <div className="space-y-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-500 uppercase">Statut de Règlement</label>
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
                  placeholder="Ex: 5000"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-slate-500">
              <span className="font-medium text-sm">Total PV</span>
              <span className="font-bold text-brand-teal text-lg">{totalPV} PV</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white">Net à payer</span>
              <span className="font-black text-xl text-slate-900 dark:text-white whitespace-nowrap">{totalAmount.toLocaleString()} FCFA</span>
            </div>
            {finalRemainingAmount > 0 && (
              <div className="flex justify-between items-center text-rose-500 font-bold text-xs py-1.5 px-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
                <span>Reste à payer (Dette)</span>
                <span>{finalRemainingAmount.toLocaleString()} FCFA</span>
              </div>
            )}
            <button 
              disabled={cart.length === 0 || isSaving}
              onClick={handleCheckout}
              className="w-full mt-4 bg-brand-teal text-white font-black py-4 rounded-xl hover:bg-brand-teal-dark transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xl shadow-brand-teal/20 dark:shadow-none flex items-center justify-center"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  VALIDER LA VENTE
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
            <button 
              onClick={() => window.print()}
              className="w-full flex items-center justify-center py-2 text-slate-500 hover:text-brand-teal transition-colors text-sm font-bold"
            >
              <FileText className="w-4 h-4 mr-2" />
              Générer Proforma / Reçu
            </button>
          </div>
        </div>
      </div>

      {/* Modal Détails Scan */}
      {scanModalOpen && scannedProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Barcode className="w-5 h-5 mr-2 text-brand-teal" />
                Produit Scanné
              </h2>
              <button onClick={() => setScanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <div className="p-3 bg-brand-teal/10 rounded-xl border border-brand-teal/20">
              <p className="font-bold text-slate-900 dark:text-white">{scannedProduct.name}</p>
              <p className="text-sm text-slate-500">{scannedProduct.price?.toLocaleString()} FCFA | <span className="text-brand-teal font-medium">{scannedProduct.pv} PV</span></p>
              <p className="text-xs text-emerald-500 font-bold mt-1">Stock disponible: {scannedProduct.stock}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantité</label>
              <input
                type="number"
                min={1}
                max={scannedProduct.stock}
                value={scanQuantity}
                onChange={e => {
                  const val = e.target.value;
                  setScanQuantity(val === "" ? "" : Number(val));
                }}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom du Client</label>
              <input
                type="text"
                value={scanClientName}
                onChange={e => setScanClientName(e.target.value)}
                placeholder="Ex: Jean Dupont"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SN Longrich (ID)</label>
              <input
                type="text"
                value={scanClientSN}
                onChange={e => setScanClientSN(e.target.value)}
                placeholder="Ex: CI01234567"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Méthode de Paiement</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Espèces', icon: Banknote },
                  { id: 'wave', label: 'Wave', icon: Smartphone },
                  { id: 'orange', label: 'Orange', icon: Smartphone },
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setScanPaymentMethod(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                      scanPaymentMethod === method.id
                        ? "bg-brand-teal border-brand-teal text-white shadow-lg shadow-brand-teal/20"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-brand-teal/50"
                    )}
                  >
                    <method.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setScanModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmScan}
                className="flex-1 py-3 bg-brand-teal text-white font-bold rounded-xl hover:bg-brand-teal-dark transition-all shadow-lg shadow-brand-teal/20"
              >
                Ajouter au Panier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scanner Caméra */}
      <BarcodeScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />

      {/* Modale de reçu automatique pour impression immédiate */}
      {completedTransaction && (
        <ReceiptModal 
          transaction={completedTransaction} 
          onClose={() => setCompletedTransaction(null)} 
        />
      )}
    </div>
  );
}
