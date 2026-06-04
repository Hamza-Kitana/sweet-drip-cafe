import { Navigate } from "@tanstack/react-router";
import { useAdmin } from "@/lib/store";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
}