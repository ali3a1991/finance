"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { requestJson } from "@/lib/requestJson";

type CurrentUser = {
  accessLevel: "owner" | "readonly" | "readwrite";
  ownerId: string;
  username: string;
};

type AuthContextValue = {
  canWrite: boolean;
  user: CurrentUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (pathname === "/login") {
      setUser(null);
      return;
    }

    requestJson<CurrentUser>("/api/me")
      .then(setUser)
      .catch(() => setUser(null));
  }, [pathname]);

  const value = useMemo(
    () => ({
      canWrite: user?.accessLevel === "owner" || user?.accessLevel === "readwrite",
      user
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
