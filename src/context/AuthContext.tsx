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

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const verified = sessionStorage.getItem("isTwoFactorVerified") === "true";
      if (verified) setIsTwoFactorVerified(true);
    }
  }, []);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setUser(user);
          setLoading(false);
          
          const verified = typeof window !== "undefined" && sessionStorage.getItem("isTwoFactorVerified") === "true";
          
          // If not logged in, or logged in but 2FA not verified, redirect to login
          if ((!user || !verified) && pathname !== "/login") {
            router.push("/login");
          }
        },
        (error) => {
          console.error("Firebase Auth Error:", error);
          setError(error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error("Firebase Initialization Error:", err);
      setError(err);
      setLoading(false);
    }
  }, [pathname, router]);

  const verifyTwoFactor = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isTwoFactorVerified", "true");
    }
    setIsTwoFactorVerified(true);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isTwoFactorVerified, verifyTwoFactor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
