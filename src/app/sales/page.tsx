"use client";

import React, { useState, useEffect } from "react";
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
import { collection, onSnapshot, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SalesPage() {
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerSN, setCustomerSN] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Écouter les produits en temps réel
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error("Erreur de récupération des produits:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const handleScan = (code: string) => {
    try {
      const audio = new Audio('/beep.mp3');
      audio.play().catch(e => console.log('Audio non supporté'));
    } catch(e) {}

    const product = availableProducts.find(p => p.barcode === code);
    if (product) {
      if (product.stock > 0) {
        addToCart(product);
        setSearchQuery("");
      } else {
        alert(`Le produit "${product.name}" est en rupture de stock !`);
      }
    } else {
      alert(`Produit non trouvé pour le code : ${code}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      const exactMatch = availableProducts.find(p => p.barcode === searchQuery.trim());
      if (exactMatch) {
        if (exactMatch.stock > 0) {
          addToCart(exactMatch);
          setSearchQuery("");
        } else {
          alert(`Le produit "${exactMatch.name}" est en rupture de stock !`);
        }
      }
    }
  };

  const filteredProducts = availableProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery.trim()))
  );

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      alert(`Stock insuffisant pour ${product.name}`);
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert(`Stock maximum atteint pour ${product.name}`);
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const product = availableProducts.find(p => p.id === id);
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (product && newQty > product.stock) {
          alert(`Stock insuffisant. Maximum: ${product.stock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalPV = cart.reduce((sum, item) => sum + (item.pv * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSaving(true);

    try {
      const batch = writeBatch(db);

      // 1. Créer la commande dans "sales"
      const salesRef = doc(collection(db, "sales"));
      batch.set(salesRef, {
        customerName: customerName || "Client Comptoir",
        customerSN: customerSN || null,
        paymentMethod,
        totalAmount,
        totalPV,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          pv: item.pv,
          quantity: item.quantity
        })),
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

      await batch.commit();

      // Réinitialiser le panier et l'interface
      setCart([]);
      setCustomerName("");
      setCustomerSN("");
      setPaymentMethod("cash");
      alert("Vente validée avec succès !");

    } catch (error) {
      console.error("Erreur lors de la validation de la vente:", error);
      alert("Une erreur est survenue lors de l'enregistrement de la vente.");
    } finally {
      setIsSaving(false);
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
                  disabled={product.stock <= 0}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border text-left group transition-all",
                    product.stock > 0 
                      ? "border-slate-200 dark:border-slate-800 hover:border-brand-teal hover:bg-brand-teal/5 dark:hover:bg-brand-teal/10" 
                      : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60 cursor-not-allowed"
                  )}
                >
                  <div>
                    <p className={cn(
                      "font-bold",
                      product.stock > 0 ? "text-slate-900 dark:text-white group-hover:text-brand-teal" : "text-slate-500"
                    )}>{product.name}</p>
                    <p className="text-sm text-slate-500">
                      {product.price.toLocaleString()} FCFA | <span className="text-brand-teal font-medium">{product.pv} PV</span>
                    </p>
                    <p className={cn(
                      "text-xs font-bold mt-1",
                      product.stock > 10 ? "text-emerald-500" : product.stock > 0 ? "text-amber-500" : "text-rose-500"
                    )}>
                      Stock: {product.stock}
                    </p>
                  </div>
                  {product.stock > 0 && <Plus className="w-5 h-5 text-slate-400 group-hover:text-brand-teal" />}
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
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.price.toLocaleString()} FCFA / unité</p>
                    </div>
                    <div className="flex items-center space-x-4">
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
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom Complet</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal"
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SN Longrich (ID)</label>
              <input 
                type="text" 
                value={customerSN}
                onChange={(e) => setCustomerSN(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal"
                placeholder="Ex: CI01234567"
              />
            </div>
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

          <div className="mt-8 space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-slate-500">
              <span className="font-medium text-sm">Total PV</span>
              <span className="font-bold text-brand-teal text-lg">{totalPV} PV</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white">Net à payer</span>
              <span className="font-black text-xl text-slate-900 dark:text-white whitespace-nowrap">{totalAmount.toLocaleString()} FCFA</span>
            </div>
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

      {/* Modal Scanner Caméra */}
      <BarcodeScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </div>
  );
}
