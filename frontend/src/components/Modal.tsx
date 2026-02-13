import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
  const portalNode = useMemo(() => document.createElement("div"), []);

  useEffect(() => {
    document.body.appendChild(portalNode);
    return () => {
      if (document.body.contains(portalNode)) {
        document.body.removeChild(portalNode);
      }
    };
  }, [portalNode]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" />

      <div className="tp-modal-base">
        <div className="tp-modal-header">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-lg font-black">{title}</h2>
            ) : (
              <div className="h-6" />
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="tp-modal-close"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="tp-modal-body">{children}</div>
      </div>
    </div>,
    portalNode,
  );
}
