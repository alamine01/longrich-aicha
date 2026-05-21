"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, isTwoFactorVerified } = useAuth();

  const isLoginPage = pathname === "/login";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-brand-teal" />
      </div>
    );
  }

  // If on login page, just show children (the login form)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If logged in but 2FA not verified, we should technically be redirected or handled in login page
  // But as a fallback, if we are not on login and not verified, don't show the admin UI yet
  if (user && !isTwoFactorVerified) {
    return <>{children}</>; // The login page handles the 2FA step
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar 
        expanded={sidebarExpanded} 
        setExpanded={setSidebarExpanded} 
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen sidebar-transition w-full overflow-x-hidden",
          sidebarExpanded ? "md:ml-64" : "md:ml-20"
        )}
      >
        <Header setMobileMenuOpen={setMobileMenuOpen} />
        
        <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-hidden">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
