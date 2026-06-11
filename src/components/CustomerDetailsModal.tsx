import React, { useState, useEffect } from "react";
import { User, X, Loader2, Calendar, MapPin, Phone, Hash, ShieldCheck, Activity } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
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
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCustomer() {
      if (!customerSN) {
        setLoading(false);
        setError("Identifiant du client introuvable pour cette transaction.");
        return;
      }
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
        setError("Erreur lors du chargement des informations du client.");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [customerSN]);

  const nin = customer?.nin || fallbackData?.nin;
  const phone = customer?.phone || fallbackData?.phone;
  const address = customer?.address || fallbackData?.address;
  const birthDate = customer?.birthDate || fallbackData?.birthDate;
  const birthPlace = customer?.birthPlace || fallbackData?.birthPlace;
  const sponsorCode = customer?.sponsorCode || fallbackData?.sponsorCode;
  const placementCode = customer?.placementCode || fallbackData?.placementCode;

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
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                  {customer?.name || transactionCustomerName}
                </h3>
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
                  <p className="font-bold text-slate-700 dark:text-slate-200">{birthDate ? new Date(birthDate).toLocaleDateString("fr-FR") : "Non renseignée"}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Lieu de naissance</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{birthPlace || "Non renseigné"}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center"><ShieldCheck className="w-3 h-3 mr-1" /> NIN (Identité)</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{nin || "Non renseigné"}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center"><Phone className="w-3 h-3 mr-1" /> Téléphone</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{phone || "Non renseigné"}</p>
                </div>
                <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Adresse</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{address || "Non renseignée"}</p>
                </div>
              </div>

              {/* Réseau Longrich */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Informations Réseau</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Code Parrain</p>
                    <p className="font-bold text-indigo-700 dark:text-indigo-300">{sponsorCode || "Aucun"}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Code Placement</p>
                    <p className="font-bold text-purple-700 dark:text-purple-300">{placementCode || "Aucun"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
