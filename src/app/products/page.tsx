"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Barcode,
  Package,
  Loader2,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BarcodePrintModal from "@/components/BarcodePrintModal";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const categories = ["Toutes", "Soins", "Hygiène", "Santé", "Supplément", "Cosmétique"];

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Soins");
  const [price, setPrice] = useState("");
  const [pv, setPv] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [barcodePrintProduct, setBarcodePrintProduct] = useState<any>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScan = (code: string) => {
    const existingProduct = products.find(p => p.barcode === code.trim());
    if (existingProduct) {
      // Product already exists -> Open the modal in Edit mode to add stock or update info!
      setEditingProduct(existingProduct);
      setName(existingProduct.name || "");
      setCategory(existingProduct.category || "Soins");
      setPrice(existingProduct.price?.toString() || "");
      setPv(existingProduct.pv?.toString() || "");
      setStock(existingProduct.stock?.toString() || "");
      setBarcode(existingProduct.barcode || "");
      setIsAddModalOpen(true);
    } else {
      // Product does not exist -> Open the modal in Create mode with the barcode prefilled!
      setEditingProduct(null);
      setName("");
      setCategory("Soins");
      setPrice("");
      setPv("");
      setStock("");
      setBarcode(code.trim());
      setIsAddModalOpen(true);
    }
  };

  // Génère un code-barres unique basé sur un préfixe + timestamp
  const generateBarcode = (): string => {
    const prefix = "LR";
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
    return `${prefix}${timestamp}${random}`;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(prods);
      setLoading(false);
      setFirebaseError(null);
    }, (error) => {
      console.log("Error loading products:", error);
      setFirebaseError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !pv || !stock) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSaving(true);
    try {
      const productData: any = {
        name,
        category,
        price: Number(price),
        pv: Number(pv),
        stock: Number(stock),
      };

      if (editingProduct) {
        // Update existing product
        productData.barcode = barcode.trim() || editingProduct.barcode || generateBarcode();
        await updateDoc(doc(db, "products", editingProduct.id), productData);
        alert("Produit modifié avec succès !");
      } else {
        // Create new product
        productData.barcode = barcode.trim() || generateBarcode();
        productData.createdAt = serverTimestamp();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Délai d'attente dépassé.")), 10000)
        );

        await Promise.race([
          addDoc(collection(db, "products"), productData),
          timeoutPromise
        ]);
        alert("Produit ajouté avec succès !");
      }

      // Reset
      setName("");
      setCategory("Soins");
      setPrice("");
      setPv("");
      setStock("");
      setBarcode("");
      setEditingProduct(null);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error("Error saving product:", err);
      alert("Erreur lors de l'enregistrement : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        alert("Produit supprimé.");
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const filteredProducts = products.filter(p => {
    // Search filter
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    // Category filter
    const matchesCategory = categoryFilter === "Toutes" || p.category === categoryFilter;
    // Low stock filter
    const matchesStock = !showLowStock || Number(p.stock) < 10;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      {firebaseError && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-lg">
          <p className="font-bold">Erreur de connexion à Firebase Firestore :</p>
          <p>{firebaseError}</p>
          <p className="text-sm mt-2">
            Vérifiez que vous avez bien <strong>créé la base de données Firestore</strong> dans votre console Firebase, et que les <strong>règles de sécurité</strong> autorisent la lecture et l'écriture.
          </p>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion du Stock</h1>
          <p className="text-slate-500">Gérez vos produits Longrich, les prix et les PV.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
            title="Scanner code-barres"
          >
            <Barcode className="w-4 h-4 mr-2 text-brand-teal" />
            Scanner Stock
          </button>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setName("");
              setPrice("");
              setPv("");
              setStock("");
              setBarcode("");
              setIsAddModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal-dark transition-colors shadow-lg shadow-brand-teal/20 dark:shadow-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Produit
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou code-barres..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowLowStock(!showLowStock)}
            className={cn(
              "flex items-center px-4 py-2 border rounded-lg transition-colors",
              showLowStock
                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showLowStock ? "Stock bas ✓" : "Stock bas"}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={cn(
                "flex items-center px-4 py-2 border rounded-lg transition-colors",
                categoryFilter !== "Toutes"
                  ? "bg-brand-teal/10 dark:bg-brand-teal/20 border-brand-teal/30 text-brand-teal"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              )}
            >
              {categoryFilter === "Toutes" ? "Catégories" : categoryFilter}
            </button>
            {showCategoryDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2 overflow-hidden">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setShowCategoryDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors",
                      categoryFilter === cat
                        ? "bg-brand-teal/10 text-brand-teal"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">PV</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Code-barres</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                          <Package className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap text-sm">
                      {Number(product.price).toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-brand-teal text-sm">{product.pv} PV</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-semibold",
                        Number(product.stock) < 10 ? "text-rose-500" : "text-emerald-500"
                      )}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-500">
                        <Barcode className="w-4 h-4 mr-2" />
                        {product.barcode || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button 
                          onClick={() => setBarcodePrintProduct(product)}
                          className="p-2 hover:bg-brand-teal/10 rounded-lg transition-colors text-slate-400 hover:text-brand-teal"
                          title="Imprimer le code-barres"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingProduct(product);
                            setName(product.name);
                            setCategory(product.category);
                            setPrice(product.price.toString());
                            setPv(product.pv.toString());
                            setStock(product.stock.toString());
                            setBarcode(product.barcode || "");
                            setIsAddModalOpen(true);
                          }}
                          className="p-2 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors text-slate-400 hover:text-amber-500"
                          title="Modifier le produit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors text-slate-400 hover:text-rose-600"
                          title="Supprimer le produit"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Aucun produit trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleAddProduct} className="bg-white dark:bg-slate-900 w-[95%] max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingProduct ? "Modifier le Produit" : "Nouveau Produit"}
              </h2>
              <p className="text-sm text-slate-500">Saisissez les informations du produit Longrich.</p>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom du produit *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  list="kit-products"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" 
                  placeholder="Ex: Gobelet Alcalin" 
                />
                <datalist id="kit-products">
                  <option value="Crème de main (100g)" />
                  <option value="Pâte dentifrice (200g)" />
                  <option value="Calcium comprimé" />
                  <option value="The marron" />
                  <option value="Thé vert" />
                  <option value="The rose" />
                  <option value="Shampooing (300ml)" />
                  <option value="Senteur de bouche" />
                  <option value="Savon noir" />
                  <option value="Déo Anti-transpirant" />
                  <option value="Cordyceps Coffee" />
                  <option value="Arthro" />
                  <option value="Anti-moustique 195ml" />
                  <option value="LAIT DE CORPS" />
                  <option value="Serviette Hygiénique" />
                  <option value="Hand Gel" />
                  <option value="Kit Hotel pour Voyage" />
                  <option value="Gel de douche (300ml)" />
                  <option value="Crème de bébé 120ml" />
                  <option value="Shampooing & Gel bébé" />
                  <option value="Gobelet Alcalin" />
                  <option value="Liqueur" />
                  <option value="LAIT DE CORPS SOD" />
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catégorie</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="Soins">Soins corporels</option>
                  <option value="Hygiène">Hygiène</option>
                  <option value="Santé">Santé</option>
                  <option value="Supplément">Suppléments</option>
                  <option value="Cosmétique">Cosmétiques</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prix (FCFA) *</label>
                  <input 
                    type="number" 
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Points Valeur (PV) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required
                    value={pv}
                    onChange={(e) => setPv(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" 
                    placeholder="0.0" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantité en stock *</label>
                <input 
                  type="number" 
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" 
                  placeholder="0" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code-barres (laisser vide pour générer)</label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal text-slate-800 dark:text-slate-200" 
                    placeholder="Entrer un code-barres ou laisser vide" 
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                  setName("");
                  setPrice("");
                  setPv("");
                  setStock("");
                  setBarcode("");
                }}
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
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barcode Print Modal */}
      {barcodePrintProduct && (
        <BarcodePrintModal
          product={barcodePrintProduct}
          onClose={() => setBarcodePrintProduct(null)}
        />
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </div>
  );
}
