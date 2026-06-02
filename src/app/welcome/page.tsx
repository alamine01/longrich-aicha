/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, 
  Layers, 
  Package, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  LogIn, 
  ChevronRight, 
  Check, 
  Award,
  Crown,
  Star,
  Zap,
  Globe,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  BookmarkCheck
} from "lucide-react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// Kits details mapping (similar to kits page but client-oriented)
const kits = [
  {
    name: "Kit Q-Silver",
    price: 85000,
    pv: 60,
    icon: Star,
    color: "from-slate-500 to-slate-700 shadow-slate-500/20",
    description: "Kit d'entrée de gamme idéal pour tester la qualité des produits et démarrer votre affaire.",
    benefits: ["Activation immédiate", "Gains sur 3 générations", "60 PV crédités"]
  },
  {
    name: "Kit Silver",
    price: 160000,
    pv: 120,
    icon: Zap,
    color: "from-teal-500 to-emerald-600 shadow-teal-500/20",
    description: "Le choix populaire pour la consommation personnelle et un partage équilibré.",
    benefits: ["Marge bénéficiaire accrue", "Bonus de parrainage", "120 PV crédités"]
  },
  {
    name: "Kit Gold",
    price: 340000,
    pv: 240,
    icon: Award,
    color: "from-amber-400 to-amber-600 shadow-amber-500/20",
    description: "Conçu pour les distributeurs ambitieux souhaitant bâtir un réseau solide.",
    benefits: ["Bonus de performance +10%", "Accès aux séminaires", "240 PV crédités"]
  },
  {
    name: "Kit Platinum",
    price: 860000,
    pv: 720,
    icon: Crown,
    color: "from-indigo-500 to-indigo-700 shadow-indigo-500/20",
    description: "Le niveau premium pour un développement rapide et l'optimisation des gains.",
    benefits: ["Bonus de performance +12%", "Éligibilité voyages", "720 PV crédités"]
  },
  {
    name: "Kit Platinum VIP",
    price: 1860000,
    pv: 1680,
    icon: Crown,
    color: "from-violet-600 to-fuchsia-700 shadow-violet-600/20",
    description: "L'excellence Longrich. Partagez les bénéfices mondiaux de la compagnie.",
    benefits: ["Partage des ventes mondiales (1%)", "Statut VIP permanent", "1680 PV crédités"]
  }
];

const categories = ["Toutes", "Soins", "Hygiène", "Santé", "Supplément", "Cosmétique"];

export default function LandingPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Toutes");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error("Error loading products for landing:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "Toutes" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-brand-teal selection:text-white font-sans scroll-smooth">
      
      {/* 1. Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-md p-1 border border-slate-100 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="Longrich Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Longrich <span className="text-brand-teal">Aicha</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-600">
            <a href="#accueil" className="hover:text-brand-teal transition-colors">Accueil</a>
            <a href="#kits" className="hover:text-brand-teal transition-colors">Kits Adhésion</a>
            <a href="#catalogue" className="hover:text-brand-teal transition-colors">Nos Produits</a>
            <a href="#opportunite" className="hover:text-brand-teal transition-colors">Opportunité</a>
            <a href="#contact" className="hover:text-brand-teal transition-colors">Contact</a>
          </div>

          <div>
            {user ? (
              <Link 
                href="/" 
                className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all hover:scale-[1.02]"
              >
                <User className="w-4 h-4 mr-2" />
                Espace Admin
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center px-4 py-2 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl text-sm font-bold shadow-md transition-all hover:scale-[1.02] shadow-brand-teal/20"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connexion Admin
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section id="accueil" className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-brand-teal/5 rounded-full blur-3xl -translate-x-1/2"></div>
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl translate-x-1/3"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-brand-teal/10 text-brand-teal uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Stockiste Longrich Officiel
              </span>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Améliorez votre <span className="text-brand-teal">Santé</span> et votre <span className="text-emerald-500">Style de vie</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 font-medium">
                Découvrez des produits de santé et de soins corporels bio-technologiques d'exception. Rejoignez notre réseau international et transformez vos dépenses quotidiennes en source de revenus durables.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a 
                  href="#catalogue"
                  className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-2xl font-bold shadow-xl shadow-brand-teal/20 transition-all hover:scale-[1.02]"
                >
                  Découvrir les Produits
                  <ChevronRight className="w-5 h-5 ml-1.5" />
                </a>
                <a 
                  href="#kits"
                  className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl font-bold border border-slate-200 shadow-sm transition-all hover:scale-[1.02]"
                >
                  Devenir Membre (Kits)
                </a>
              </div>

              {/* Badges/Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-8 max-w-md mx-auto lg:mx-0 border-t border-slate-200/60">
                <div>
                  <p className="text-2xl font-black text-slate-900">100%</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">Naturel & Bio</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">+2000</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">Membres Actifs</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">24/7</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">Support Stockiste</p>
                </div>
              </div>
            </div>

            {/* Right Graphics */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-brand-teal/20 to-emerald-500/20 flex items-center justify-center p-6 animate-pulse duration-[4000ms]">
                <div className="w-full h-full rounded-full bg-white shadow-2xl flex flex-col items-center justify-center text-center p-8 border border-slate-100">
                  <div className="w-20 h-20 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal mb-4">
                    <Globe className="w-10 h-10 animate-spin" style={{ animationDuration: '20s' }} />
                  </div>
                  <h3 className="font-black text-xl text-slate-900">Stockiste Longrich</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">Plateforme Aicha</p>
                  <p className="text-sm text-slate-500 mt-4 font-medium max-w-[200px]">
                    Votre partenaire de confiance pour tous vos besoins en produits originaux Longrich.
                  </p>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute top-10 left-10 bg-white/80 backdrop-blur-md border border-slate-200/60 p-4 rounded-2xl shadow-xl flex items-center space-x-3 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="p-2 bg-emerald-500 rounded-lg text-white"><ShieldCheck className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">Garantie</p>
                  <p className="text-sm font-black text-slate-800">100% Authentique</p>
                </div>
              </div>

              <div className="absolute bottom-10 right-10 bg-white/80 backdrop-blur-md border border-slate-200/60 p-4 rounded-2xl shadow-xl flex items-center space-x-3 animate-bounce" style={{ animationDuration: '4.5s' }}>
                <div className="p-2 bg-brand-teal rounded-lg text-white"><TrendingUp className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">Croissance</p>
                  <p className="text-sm font-black text-slate-800">Bonus Hebdomadaires</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Kits Section */}
      <section id="kits" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-block text-xs font-black uppercase tracking-widest bg-brand-teal/20 text-brand-teal px-3 py-1 rounded-full">
              Adhésion & Business
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Choisissez votre Kit de Démarrage
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              Chaque kit vous donne droit à un lot de produits équivalent à votre investissement, des points de valeur (PV) et active votre licence internationale de distributeur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {kits.map((kit) => (
              <div 
                key={kit.name}
                className="bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-brand-teal transition-all group overflow-hidden flex flex-col h-full shadow-2xl hover:shadow-brand-teal/10"
              >
                {/* Header */}
                <div className={cn("p-6 text-white bg-gradient-to-r relative", kit.color)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                      <kit.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 px-2.5 py-1 rounded-full">
                      {kit.pv} PV
                    </span>
                  </div>
                  <h3 className="text-xl font-black">{kit.name}</h3>
                  <p className="text-white/80 text-xs font-medium mt-1">Niveau d'adhésion officiel</p>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-3xl font-black text-white">{kit.price.toLocaleString()}</span>
                      <span className="text-slate-400 font-bold text-sm">FCFA</span>
                    </div>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">{kit.description}</p>
                    
                    <ul className="space-y-2 pt-4 border-t border-slate-700/60">
                      {kit.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center text-xs text-slate-350">
                          <Check className="w-4 h-4 mr-2 text-brand-teal flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a 
                    href="#contact"
                    className="w-full py-3 bg-slate-700 hover:bg-brand-teal text-white font-bold rounded-xl text-xs text-center transition-colors block uppercase tracking-wider"
                  >
                    Demander ce Kit
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Products Catalog Section */}
      <section id="catalogue" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <span className="inline-block text-xs font-black uppercase tracking-widest bg-brand-teal/10 text-brand-teal px-3 py-1 rounded-full">
                Catalogue Général
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                Nos Produits Phares Longrich
              </h2>
              <p className="text-slate-500 text-sm font-medium max-w-md">
                Parcourez nos catégories de produits de soins quotidiens et de santé. Tous nos produits sont certifiés et de qualité supérieure.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-none mb-8 -mx-6 px-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap cursor-pointer",
                  activeCategory === cat
                    ? "bg-brand-teal border-brand-teal text-white shadow-lg shadow-brand-teal/10"
                    : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => {
                  const inStock = Number(product.stock || 0) > 0;
                  return (
                    <div 
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200/60 p-5 flex flex-col justify-between hover:shadow-xl hover:border-brand-teal/30 transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            {product.category}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                            inStock ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                          )}>
                            {inStock ? "Disponible" : "Rupture"}
                          </span>
                        </div>

                        <div className="w-full h-32 bg-slate-50 rounded-xl flex items-center justify-center text-slate-350 border border-slate-100 group-hover:bg-brand-teal/5 transition-colors">
                          <Package className="w-10 h-10 text-brand-teal/40 group-hover:scale-110 transition-transform" />
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 group-hover:text-brand-teal transition-colors truncate">{product.name}</h4>
                          <p className="text-xs text-slate-400 font-bold mt-0.5">{product.pv} PV</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                        <span className="font-black text-slate-900 text-base">
                          {Number(product.price).toLocaleString()} F
                        </span>
                        <a 
                          href={`https://wa.me/221770000000?text=Bonjour,%20je%20souhaite%20acheter%20le%20produit%20:${encodeURIComponent(product.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm",
                            inStock 
                              ? "bg-brand-teal hover:bg-brand-teal-dark text-white shadow-brand-teal/10 hover:scale-[1.02]" 
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            if (!inStock) e.preventDefault();
                          }}
                        >
                          Commander
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-medium">
                  Aucun produit ne correspond à votre recherche.
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* 5. Opportunity / How it works */}
      <section id="opportunite" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Graphics */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-lg space-y-2 mt-8">
                  <BookmarkCheck className="w-8 h-8" />
                  <h4 className="font-black text-lg">Qualité de Produit</h4>
                  <p className="text-xs text-white/80">Des produits bio-technologiques brevetés et reconnus mondialement.</p>
                </div>
                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-2">
                  <TrendingUp className="w-8 h-8 text-brand-teal" />
                  <h4 className="font-black text-lg text-slate-900">Revenus Hebdomadaires</h4>
                  <p className="text-xs text-slate-500">Un plan de rémunération généreux basé sur les PV de votre réseau.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-2">
                  <Star className="w-8 h-8 text-amber-500" />
                  <h4 className="font-black text-lg text-slate-900">Voyages & Voitures</h4>
                  <p className="text-xs text-slate-500">Des challenges réguliers pour remporter des voyages, voitures et bourses d'études.</p>
                </div>
                <div className="bg-indigo-650 bg-indigo-650 bg-indigo-600 text-white p-6 rounded-2xl shadow-lg space-y-2">
                  <Globe className="w-8 h-8" />
                  <h4 className="font-black text-lg">Liberté Financière</h4>
                  <p className="text-xs text-white/80">Travaillez à votre rythme et bâtissez votre propre entreprise.</p>
                </div>
              </div>
            </div>

            {/* Right content */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-block text-xs font-black uppercase tracking-widest bg-brand-teal/10 text-brand-teal px-3 py-1 rounded-full">
                Pourquoi nous rejoindre ?
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                L'opportunité d'affaire Longrich
              </h2>
              <p className="text-slate-500 text-sm sm:text-base font-medium">
                Longrich n'est pas seulement une marque de produits cosmétiques et de santé, c'est une véritable plateforme entrepreneuriale. En rejoignant Longrich, vous devenez partenaire d'un géant de la cosmétique mondiale présent dans plus de 180 pays.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <h5 className="font-black text-slate-900">Achetez un Kit de Démarrage</h5>
                    <p className="text-xs text-slate-500">Choisissez l'un de nos kits d'adhésion pour recevoir vos produits et activer votre code partenaire unique.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <h5 className="font-black text-slate-900">Consommez et Recommandez</h5>
                    <p className="text-xs text-slate-500">Utilisez les produits au quotidien et partagez les bienfaits autour de vous.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <h5 className="font-black text-slate-900">Développez votre Équipe</h5>
                    <p className="text-xs text-slate-500">Parrainez de nouveaux partenaires et touchez des commissions sur l'ensemble du volume de vente de votre réseau.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <a 
                  href="#contact"
                  className="inline-flex items-center px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all hover:scale-[1.02] shadow-md shadow-slate-900/10"
                >
                  Contacter le Stockiste
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 6. Contact Section */}
      <section id="contact" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-block text-xs font-black uppercase tracking-widest bg-brand-teal/20 text-brand-teal px-3 py-1 rounded-full">
                Nous Contacter
              </span>
              <h2 className="text-3xl font-black text-white">Contactez Notre Bureau Stockiste</h2>
              <p className="text-slate-400 text-sm font-medium">
                Vous souhaitez commander des produits, adhérer à un kit, ou obtenir des conseils personnalisés sur l'opportunité d'affaire Longrich ? Nous sommes disponibles pour vous aider.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-brand-teal"><Phone className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">TÉLÉPHONE / WHATSAPP</p>
                    <p className="font-bold text-white text-base">+221 77 000 00 00</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-brand-teal"><Mail className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">EMAIL</p>
                    <p className="font-bold text-white text-base">contact@longrich-aicha.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-brand-teal"><MapPin className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">ADRESSE DU BUREAU</p>
                    <p className="font-bold text-white text-sm leading-relaxed">Dakar, Plateau, Rue de Thiong, Sénégal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="lg:col-span-7 bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-xl font-black text-white">Envoyez-nous un message</h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Message envoyé ! Nous vous recontacterons très rapidement.");
                  (e.target as any).reset();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nom Complet</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Fatou Sow"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="Ex: +221 77 123 45 67"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sujet d'intérêt</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal text-sm text-white font-medium"
                  >
                    <option value="buy">Acheter des produits Longrich</option>
                    <option value="join">S'inscrire comme distributeur (Kits)</option>
                    <option value="info">Demander des informations générales</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Votre message</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Écrivez votre message ici..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal text-sm text-white resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-brand-teal/20"
                >
                  Envoyer ma demande par mail
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <p className="font-bold text-slate-400">Longrich Stockiste Aicha Sénégal</p>
            <p>&copy; {new Date().getFullYear()} Longrich Aicha. Tous droits réservés. Bureau Stockiste Officiel.</p>
          </div>

          <div className="flex items-center space-x-6">
            <a href="#accueil" className="hover:text-white transition-colors">Accueil</a>
            <a href="#kits" className="hover:text-white transition-colors">Kits</a>
            <a href="#catalogue" className="hover:text-white transition-colors">Catalogue</a>
            <Link href="/login" className="hover:text-white transition-colors flex items-center">
              <LogIn className="w-3.5 h-3.5 mr-1" />
              Connexion Admin
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
