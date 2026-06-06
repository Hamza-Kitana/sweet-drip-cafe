import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type PendingConfirm = ConfirmRequest & { resolve: (value: boolean) => void };

const ConfirmContext = createContext<((request: ConfirmRequest) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((request: ConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...request, resolve });
    });
  }, []);

  const finish = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) finish(false);
        }}
      >
        <AlertDialogContent className="rounded-3xl border-border/80 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-primary">
              {pending?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {pending?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-full">
              {pending?.cancelLabel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                finish(true);
              }}
            >
              {pending?.confirmLabel ?? "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
