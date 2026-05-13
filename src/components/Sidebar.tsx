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
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Stock", href: "/products", icon: Package },
  { name: "Ventes", href: "/sales", icon: ShoppingCart },
  { name: "Kits Longrich", href: "/kits", icon: Layers },
  { name: "Historique", href: "/history", icon: History },
];

export default function Sidebar({ 
  expanded, 
  setExpanded 
}: { 
  expanded: boolean; 
  setExpanded: (v: boolean) => void 
}) {
  const pathname = usePathname();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-slate-900 text-slate-300 sidebar-transition z-50 overflow-hidden border-r border-slate-800",
        expanded ? "w-64" : "w-20"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="w-10 h-10 bg-white rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img src="/logo.jpg" alt="Longrich Logo" className="w-full h-full object-contain" />
          </div>
          {expanded && (
            <span className="ml-3 font-bold text-lg text-white tracking-tight truncate">
              Longrich <span className="text-brand-teal">Stockiste</span>
            </span>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
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
                {expanded && (
                  <span className="ml-4 font-medium truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {expanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
