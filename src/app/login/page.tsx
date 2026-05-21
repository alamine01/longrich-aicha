"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck, ArrowRight, Loader2, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Login, 2: 2FA
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, verifyTwoFactor } = useAuth();

  React.useEffect(() => {
    if (user) {
      setStep(2);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStep(2); // Move to 2FA step
    } catch (err: any) {
      setError("Identifiants incorrects. Veuillez réessayer.");
      console.log("Login error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simple 2FA simulation for now (Code is 123456)
    // In production, this would verify an SMS or TOTP code
    if (twoFactorCode === "123456") {
      verifyTwoFactor();
      router.push("/");
    } else {
      setError("Code incorrect. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-xl p-2 mb-4">
            <img src="/logo.jpg" alt="Longrich Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Longrich <span className="text-brand-teal">Stockiste</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Portail de Gestion Sécurisé</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-600 text-sm font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email professionnel</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                    placeholder="admin@longrich.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-teal text-white font-black py-4 rounded-xl hover:bg-brand-teal-dark transition-all shadow-lg shadow-brand-teal/20 dark:shadow-none flex items-center justify-center group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    SE CONNECTER
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <Key className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Vérification 2FA</h2>
                <p className="text-sm text-slate-500">Un code de sécurité est requis pour accéder au back-office.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center block">Code de vérification</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full text-center text-3xl tracking-[1em] font-black py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-teal text-white font-black py-4 rounded-xl hover:bg-brand-teal-dark transition-all shadow-lg shadow-brand-teal/20 dark:shadow-none flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "VÉRIFIER LE CODE"}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
              >
                Retour à la connexion
              </button>
            </form>
          )}
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-8">
          &copy; 2024 Longrich Admin System. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
