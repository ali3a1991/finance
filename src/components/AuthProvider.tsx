"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { requestJson } from "@/lib/requestJson";
import type { ActionPermission } from "@/lib/actionPermissions";

type CurrentUser = {
  accessLevel: "owner" | "readonly" | "readwrite";
  ownerId: string;
  username: string;
  permissions: ActionPermission[];
};

type AuthContextValue = {
  canWrite: boolean;
  can: (permission: ActionPermission) => boolean;
  user: CurrentUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
      setUser(null);
      return;
    }

    if (user) {
      return;
    }

    requestJson<CurrentUser>("/api/me")
      .then(setUser)
      .catch(() => setUser(null));
  }, [pathname, user]);

  const value = useMemo(
    () => ({
      can: (permission: ActionPermission) => user?.accessLevel === "owner" || Boolean(user?.permissions.includes(permission)),
      canWrite: user?.accessLevel === "owner" || Boolean(user?.permissions.length),
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
