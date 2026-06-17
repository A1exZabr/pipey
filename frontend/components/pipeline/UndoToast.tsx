'use client';

import { useEffect } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function UndoToast({ message, onUndo, onDismiss, duration = 4000 }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl animate-slide-up">
      <span className="text-sm">{message}</span>
      <button
        onClick={onUndo}
        className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
      >
        Undo
      </button>
    </div>
  );
}
