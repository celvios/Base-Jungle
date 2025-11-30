import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalContainerProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  className?: string;
}

export function ModalContainer({
  children,
  onClose,
  title,
  className = "",
}: ModalContainerProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop with blur and dim */}
      <div
        className="fixed inset-0 backdrop-blur-[60px] bg-black/70 animate-backdrop-fade"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-modal-materialize scrollbar-hide ${className}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Modern glass panel with minimal design */}
        <div className="relative">
          {/* Main modal body */}
          <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
            {/* Subtle top glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            
            {/* Ambient glow effect */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

            {/* Content */}
            <div className="relative p-8 md:p-10">
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h2 className="text-2xl md:text-3xl font-light text-white tracking-wide">
                      {title}
                    </h2>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-blue-400 to-transparent" />
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2.5 hover:bg-white/5 rounded-full transition-all duration-200 hover:scale-110"
                    data-testid="button-close-modal"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-white" />
                  </button>
                </div>
              )}

              {/* Children */}
              <div className="relative">
                {children}
              </div>
            </div>
          </div>

          {/* Modern edge highlights */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none">
            <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 ring-inset" />
            <div className="absolute inset-0 rounded-3xl ring-1 ring-blue-500/20 ring-inset" />
          </div>
        </div>
      </div>
    </div>
  );
}
