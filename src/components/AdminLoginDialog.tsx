import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/lib/store";
import { isApiMode, setAdminToken } from "@/lib/api/client";
import * as api from "@/lib/api/backend";
import { refreshAdminDataFromApi } from "@/lib/api/hydrate";
import { loadAdminProfileFromApi } from "@/lib/api/admin-actions";

export function AdminLoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { isAdmin, setAdmin, setUsername, login } = useAdmin();
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);

  const signOut = () => {
    setAdminToken(null);
    setAdmin(false);
    toast.success("Signed out");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isApiMode) {
        const result = await api.loginAdmin(u, p);
        setAdminToken(result.token);
        setUsername(result.username);
        setAdmin(true);
        await refreshAdminDataFromApi();
        await loadAdminProfileFromApi();
        toast.success("Welcome back, Admin");
        onOpenChange(false);
        navigate({ to: "/admin" });
        setU("");
        setP("");
        return;
      }

      if (login(u, p)) {
        toast.success("Welcome back, Admin");
        onOpenChange(false);
        navigate({ to: "/admin" });
        setU("");
        setP("");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full gradient-choco flex items-center justify-center text-primary-foreground mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <DialogTitle className="text-center">Admin Access</DialogTitle>
          <DialogDescription className="text-center">Sign in to manage your cafe.</DialogDescription>
        </DialogHeader>
        {isAdmin ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">You are signed in.</p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => { onOpenChange(false); navigate({ to: "/admin" }); }}>Open dashboard</Button>
              <Button variant="outline" onClick={signOut}>Sign out</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="u">Username</Label>
              <Input id="u" value={u} onChange={e => setU(e.target.value)} autoFocus />
            </div>
            <div>
              <Label htmlFor="p">Password</Label>
              <Input id="p" type="password" value={p} onChange={e => setP(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : "Sign in"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
