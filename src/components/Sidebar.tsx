"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Layers, 
  History, 
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Stock", href: "/products", icon: Package },
  { name: "Ventes", href: "/sales", icon: ShoppingCart },
  { name: "Kits Longrich", href: "/kits", icon: Layers },
  { name: "Reliquats", href: "/reliquats", icon: ClipboardList },
  { name: "Historique", href: "/history", icon: History },
];

export default function Sidebar({ 
  expanded, 
  setExpanded,
  mobileOpen,
  setMobileOpen
}: { 
  expanded: boolean; 
  setExpanded: (v: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (v: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-[45] bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-slate-900 text-slate-300 sidebar-transition z-50 overflow-hidden border-r border-slate-800",
          expanded ? "md:w-64" : "md:w-20",
          "w-64 max-md:transform max-md:transition-transform",
          mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="w-10 h-10 bg-white rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Longrich Logo" className="w-full h-full object-contain" />
          </div>
          <span className={cn("ml-3 font-bold text-lg text-white tracking-tight truncate", !expanded && "md:hidden")}>
            Longrich <span className="text-brand-teal">Stockiste</span>
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-brand-teal text-white" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "w-6 h-6 flex-shrink-0",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-brand-teal"
                )} />
                <span className={cn("ml-4 font-medium truncate", !expanded && "md:hidden")}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {expanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
