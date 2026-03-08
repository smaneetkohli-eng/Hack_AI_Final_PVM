"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-surface border border-border rounded-xl w-full max-w-sm overflow-hidden"
          >
            <div className="flex items-start gap-3 p-5">
              {variant === "danger" && (
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted mt-1.5 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={onCancel}
                className="p-1 rounded-lg hover:bg-surface-light text-muted flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 pb-5">
              <Button variant="ghost" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  variant === "danger"
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-primary/20 text-primary-light hover:bg-primary/30"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
