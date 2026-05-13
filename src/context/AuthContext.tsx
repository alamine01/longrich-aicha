"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isTwoFactorVerified: boolean;
  verifyTwoFactor: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isTwoFactorVerified: false,
  verifyTwoFactor: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTwoFactorVerified, setIsTwoFactorVerified] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // If not logged in and not on login page, redirect to login
      if (!user && pathname !== "/login") {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const verifyTwoFactor = () => setIsTwoFactorVerified(true);

  return (
    <AuthContext.Provider value={{ user, loading, isTwoFactorVerified, verifyTwoFactor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
