"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Barcode,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample Data
const initialProducts = [
  { id: 1, name: "Savon Noir Longrich", category: "Soins", price: 3500, pv: 2, stock: 45, barcode: "LR001" },
  { id: 2, name: "Dentifrice Longrich", category: "Hygiène", price: 4500, pv: 3.5, stock: 120, barcode: "LR002" },
  { id: 3, name: "Gobelet Alcalin", category: "Santé", price: 45000, pv: 60, stock: 15, barcode: "LR003" },
  { id: 4, name: "Cordyceps Militaris", category: "Supplément", price: 55000, pv: 80, stock: 8, barcode: "LR004" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState(initialProducts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion du Stock</h1>
          <p className="text-slate-500">Gérez vos produits Longrich, les prix et les PV.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
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
            placeholder="Rechercher par nom ou code-barres..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </button>
          <button className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
            Catégories
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
              {products.map((product) => (
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
                    {product.price.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-brand-teal text-sm">{product.pv} PV</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-semibold",
                      product.stock < 10 ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-slate-500">
                      <Barcode className="w-4 h-4 mr-2" />
                      {product.barcode}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal Placeholder */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nouveau Produit</h2>
              <p className="text-sm text-slate-500">Saisissez les informations du produit Longrich.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom du produit</label>
                <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" placeholder="Ex: Gobelet Alcalin" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prix (FCFA)</label>
                  <input type="number" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Points Valeur (PV)</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" placeholder="0.0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantité en stock</label>
                <input type="number" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code-barres</label>
                <div className="flex space-x-2">
                  <input type="text" className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-teal" placeholder="Scanner ou saisir..." />
                  <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-brand-teal transition-colors">
                    <Barcode className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Annuler
              </button>
              <button className="px-6 py-2 bg-brand-teal text-white rounded-lg font-bold hover:bg-brand-teal-dark transition-shadow">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
