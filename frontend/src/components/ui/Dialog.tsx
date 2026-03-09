import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type DialogSize = 'sm' | 'md' | 'lg';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  className?: string;
}

const sizeStyles: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Dialog({ open, onClose, title, children, footer, size = 'md', className = '' }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the dialog container for keyboard navigation
      dialogRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-950/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative glass rounded-xl shadow-xl ${sizeStyles[size]} w-full mx-4 animate-scale-in ${className}`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700/50">
            <h2 className="text-h2 text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700/50 transition-base"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-3">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-1.5 px-3 py-2 border-t border-surface-700/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
