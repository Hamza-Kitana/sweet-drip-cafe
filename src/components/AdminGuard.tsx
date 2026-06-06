import { Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAdmin } from "@/lib/store";
import { getAdminToken, isApiMode } from "@/lib/api/client";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, setAdmin } = useAdmin();
  const hasApiSession = !isApiMode || Boolean(getAdminToken());

  useEffect(() => {
    if (isAdmin && isApiMode && !getAdminToken()) setAdmin(false);
  }, [isAdmin, setAdmin]);

  if (!isAdmin || !hasApiSession) return <Navigate to="/" />;
  return <>{children}</>;
}