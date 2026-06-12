"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
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
  const [isTwoFactorVerified, setIsTwoFactorVerified] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setUser(user);
          setLoading(false);
          
          // If not logged in, redirect to login unless it is a public page (login or welcome)
          const isPublicPage = pathname === "/login" || pathname === "/welcome";
          if (!user && !isPublicPage) {
            router.push("/login");
          }
        },
        (error) => {
          console.error("Firebase Auth Error:", error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Firebase Initialization Error:", err);
      Promise.resolve().then(() => setLoading(false));
    }
  }, [pathname, router]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const logoutUser = async () => {
      if (user) {
        try {
          await signOut(auth);
          router.push("/login");
        } catch (error) {
          console.error("Erreur de déconnexion après inactivité:", error);
        }
      }
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 30 minutes d'inactivité
      timeoutId = setTimeout(logoutUser, 30 * 60 * 1000);
    };

    if (user) {
      resetTimer();

      const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
      events.forEach((event) => {
        window.addEventListener(event, resetTimer);
      });

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        events.forEach((event) => {
          window.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [user, router]);

  const verifyTwoFactor = () => {
    setIsTwoFactorVerified(true);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isTwoFactorVerified, verifyTwoFactor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
