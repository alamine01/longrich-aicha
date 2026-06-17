import React, { useState, useEffect } from "react";
import { User, X, Loader2, Calendar, MapPin, Phone, Hash, ShieldCheck, Activity, ShoppingBag, Clock } from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CustomerDetailsModalProps {
  customerSN: string | null;
  transactionCustomerName?: string;
  fallbackData?: any;
  onClose: () => void;
}

export default function CustomerDetailsModal({ customerSN, transactionCustomerName, fallbackData, onClose }: CustomerDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [error, setError] = useState("");

  // States for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editBirthPlace, setEditBirthPlace] = useState("");
  const [editNIN, setEditNIN] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editSponsorCode, setEditSponsorCode] = useState("");
  const [editPlacementCode, setEditPlacementCode] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    async function fetchCustomerData() {
      if (!customerSN) {
        setLoading(false);
        setLoadingPurchases(false);
        setError("Identifiant du client introuvable.");
        return;
      }

      setLoading(true);
      setLoadingPurchases(true);

      // 1. Charger le profil
      try {
        const docRef = doc(db, "customers", customerSN);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomer({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Ce client n'a pas été trouvé dans la base de données.");
        }
      } catch (err) {
        console.error("Erreur de chargement du client :", err);
        setError("Erreur lors du chargement des informations.");
      } finally {
        setLoading(false);
      }

      // 2. Charger l'historique d'achats (sales)
      try {
        const qSales = query(
          collection(db, "sales"),
          where("customerSN", "==", customerSN)
        );
        const snap = await getDocs(qSales);
        const fetchedSales = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds 
            ? a.createdAt.seconds * 1000 
            : a.createdAt 
              ? new Date(a.createdAt).getTime() 
              : 0;
          const timeB = b.createdAt?.seconds 
            ? b.createdAt.seconds * 1000 
            : b.createdAt 
              ? new Date(b.createdAt).getTime() 
              : 0;
          return timeB - timeA;
        });
        setPurchases(fetchedSales);
      } catch (err) {
        console.error("Erreur de chargement des achats :", err);
      } finally {
        setLoadingPurchases(false);
      }
    }

    fetchCustomerData();
  }, [customerSN]);

  const nin = customer?.nin || fallbackData?.nin;
  const phone = customer?.phone || fallbackData?.phone;
  const address = customer?.address || fallbackData?.address;
  const birthDate = customer?.birthDate || fallbackData?.birthDate;
  const birthPlace = customer?.birthPlace || fallbackData?.birthPlace;
  const sponsorCode = customer?.sponsorCode || fallbackData?.sponsorCode;
  const placementCode = customer?.placementCode || fallbackData?.placementCode;

  const startEditing = () => {
    setEditName(customer?.name || transactionCustomerName || "");
    setEditBirthDate(birthDate || "");
    setEditBirthPlace(birthPlace || "");
    setEditNIN(nin || "");
    setEditPhone(phone || "");
    setEditAddress(address || "");
    setEditSponsorCode(sponsorCode || "");
    setEditPlacementCode(placementCode || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!customerSN) return;
    setSavingEdit(true);
    try {
      const { setDoc, doc, serverTimestamp } = await import("firebase/firestore");
      const customerRef = doc(db, "customers", customerSN);
      
      const updatedData = {
        name: editName.trim(),
        birthDate: editBirthDate,
        birthPlace: editBirthPlace.trim(),
        nin: editNIN.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        sponsorCode: editSponsorCode.trim(),
        placementCode: editPlacementCode.trim(),
        updatedAt: serverTimestamp()
      };

      await setDoc(customerRef, updatedData, { merge: true });
      
      // Mettre à jour l'état local
      setCustomer((prev: any) => ({
        ...prev,
        ...updatedData
      }));
      setIsEditing(false);
      alert("Informations du membre mises à jour avec succès !");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col scale-in-center">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center text-slate-900 dark:text-white font-bold text-lg">
            <div className="w-10 h-10 bg-brand-teal/10 rounded-full flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-brand-teal" />
            </div>
            Détails du Membre
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-teal mb-4" />
              <p className="text-sm font-medium text-slate-500">Chargement des informations...</p>
            </div>
          ) : error && !customer && !fallbackData ? (
            <div className="text-center py-8">
              <p className="text-rose-500 font-medium mb-2">{error}</p>
              <p className="text-sm text-slate-500">Nom dans la transaction : <span className="font-bold text-slate-700 dark:text-slate-300">{transactionCustomerName}</span></p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* En-tête profil */}
              <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                {isEditing ? (
                  <div className="max-w-xs mx-auto mb-2 text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nom complet du membre</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full font-bold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 dark:text-white"
                      placeholder="Nom complet"
                    />
                  </div>
                ) : (
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                    {customer?.name || transactionCustomerName}
                  </h3>
                )}
                <span className="inline-flex items-center px-3 py-1 bg-brand-teal/10 text-brand-teal font-bold rounded-full text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  {customer?.sn || customerSN}
                </span>
                
                {customer?.totalPV > 0 && (
                  <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center">
                    <Activity className="w-4 h-4 mr-1 text-emerald-500" />
                    Cumul : <span className="text-emerald-500 ml-1">{customer.totalPV} PV</span>
                  </p>
                )}
                {!customer && fallbackData && (
                  <p className="mt-2 text-xs font-medium text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md inline-block">
                    Informations issues de l'historique de vente (profil non synchronisé).
                  </p>
                )}
              </div>

              {/* Infos perso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Date de naissance</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 dark:text-white"
                    />
                  ) : (
                    <p className="font-bold text-slate-700 dark:text-slate-200">{birthDate ? new Date(birthDate).toLocaleDateString("fr-FR") : "Non renseignée"}</p>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Lieu de naissance</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editBirthPlace}
                      onChange={(e) => setEditBirthPlace(e.target.value)}
                      placeholder="Lieu de naissance"
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 dark:text-white"
                    />
                  ) : (
                    <p className="font-bold text-slate-700 dark:text-slate-200">{birthPlace || "Non renseigné"}</p>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center"><ShieldCheck className="w-3 h-3 mr-1" /> NIN (Identité)</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editNIN}
                      onChange={(e) => setEditNIN(e.target.value)}
                      placeholder="Numéro National d'Identité"
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 dark:text-white"
                    />
                  ) : (
                    <p className="font-bold text-slate-700 dark:text-slate-200">{nin || "Non renseigné"}</p>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center"><Phone className="w-3 h-3 mr-1" /> Téléphone</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Téléphone"
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 dark:text-white"
                    />
                  ) : (
                    <p className="font-bold text-slate-700 dark:text-slate-200">{phone || "Non renseigné"}</p>
                  )}
                </div>
                <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Adresse</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Adresse complète"
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 dark:text-white"
                    />
                  ) : (
                    <p className="font-bold text-slate-700 dark:text-slate-200">{address || "Non renseignée"}</p>
                  )}
                </div>
              </div>

              {/* Réseau Longrich */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Informations Réseau</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Code Parrain</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editSponsorCode}
                        onChange={(e) => setEditSponsorCode(e.target.value)}
                        placeholder="Ex: Code Parrain"
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-850 rounded outline-none focus:ring-2 focus:ring-indigo-400 text-indigo-900 dark:text-indigo-300 font-bold"
                      />
                    ) : (
                      <p className="font-bold text-indigo-700 dark:text-indigo-300">{sponsorCode || "Aucun"}</p>
                    )}
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Code Placement</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editPlacementCode}
                        onChange={(e) => setEditPlacementCode(e.target.value)}
                        placeholder="Ex: Code Placement"
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-850 rounded outline-none focus:ring-2 focus:ring-purple-400 text-purple-900 dark:text-purple-300 font-bold"
                      />
                    ) : (
                      <p className="font-bold text-purple-700 dark:text-purple-300">{placementCode || "Aucun"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Historique des Achats */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-1.5 text-brand-teal" />
                  Historique des Achats ({purchases.length})
                </h4>
                
                {loadingPurchases ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
                  </div>
                ) : purchases.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun achat enregistré pour ce membre.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {purchases.map((sale) => {
                      const date = sale.createdAt?.seconds 
                        ? new Date(sale.createdAt.seconds * 1000) 
                        : sale.createdAt 
                          ? new Date(sale.createdAt) 
                          : new Date();
                      const dateStr = date.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' });
                      
                      const itemsStr = sale.items && Array.isArray(sale.items)
                        ? sale.items.map((it: any) => `${it.quantity}x ${it.name}`).join(", ")
                        : sale.kitName ? `Kit ${sale.kitName}` : "Achat inconnu";

                      const saleTypeLabel = sale.saleType === "upgrade" 
                        ? "Rehaussement" 
                        : "Détail";

                      const paymentStatusLabel = sale.paymentStatus === "paid" || sale.status === "paid"
                        ? "Payé"
                        : sale.paymentStatus === "partial" || sale.status === "partial"
                          ? "Avance"
                          : "Non payé";

                      return (
                        <div key={sale.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {dateStr}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">ID: {sale.id.slice(0, 8)}</span>
                          </div>
                          
                          <p className="font-medium text-slate-650 dark:text-slate-300 break-words">
                            {itemsStr}
                          </p>

                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-x-1">
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-bold">
                                {saleTypeLabel}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                paymentStatusLabel === "Payé" 
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                                  : paymentStatusLabel === "Avance"
                                    ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                                    : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                              }`}>
                                {paymentStatusLabel}
                              </span>
                            </div>
                            <div className="text-right flex items-center space-x-1.5">
                              <span className="font-black text-slate-900 dark:text-white">
                                {Number(sale.totalAmount || 0).toLocaleString()} F
                              </span>
                              <span className="font-bold text-brand-teal bg-brand-teal/10 px-1.5 py-0.5 rounded text-[10px]">
                                {sale.totalPV || 0} PV
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-3 shrink-0">
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                disabled={savingEdit}
                className="px-5 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                disabled={savingEdit}
                className="px-6 py-2 bg-brand-teal text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center text-sm shadow-md cursor-pointer"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Enregistrer
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={startEditing}
                className="px-5 py-2 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg transition-colors text-sm cursor-pointer"
              >
                Modifier
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity text-sm shadow-sm cursor-pointer"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
