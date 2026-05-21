"use client";

import React from "react";
import { User, LogOut, Menu } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Header({ setMobileMenuOpen }: { setMobileMenuOpen?: (v: boolean) => void }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Mobile Menu Toggle */}
      <div className="flex items-center md:hidden">
        <button 
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(true)}
          className="p-2 -ml-2 mr-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-slate-900 dark:text-white">Longrich</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-6 ml-auto">
        
        <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Admin Stockiste</p>
            <p className="text-xs text-slate-500">Longrich Sénégal</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            <User className="h-6 w-6" />
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
