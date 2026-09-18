"use client";

import React from "react";

interface EditScoreModalFooterProps {
  isConfirming: boolean;
  canConfirm: boolean;
  hasErrors: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function EditScoreModalFooter({
  isConfirming,
  canConfirm,
  hasErrors,
  onCancel,
  onConfirm,
}: EditScoreModalFooterProps) {
  const isConfirmDisabled = !canConfirm || hasErrors || isConfirming;

  return (
    <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isConfirming}
        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isConfirmDisabled}
        className="flex-1 px-4 py-2.5 bg-sky-700 text-white font-medium rounded-lg hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isConfirming ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Salvando...
          </span>
        ) : (
          "Confirmar"
        )}
      </button>
    </div>
  );
}
