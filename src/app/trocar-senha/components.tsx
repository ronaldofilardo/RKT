"use client";

import Link from 'next/link';

interface TrocarSenhaFormProps {
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  error: string | null;
  loading: boolean;
  hasToken?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function TrocarSenhaForm({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  loading,
  hasToken,
  onSubmit,
}: TrocarSenhaFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}
      {!hasToken && (
        <input
          type="password"
          placeholder="Senha atual"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm"
        />
      )}
      <input
        type="password"
        placeholder="Nova senha (mínimo 8 caracteres)"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm"
      />
      <input
        type="password"
        placeholder="Confirmar nova senha"
        required
        minLength={8}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-sky-700 text-white font-semibold py-3 rounded-lg hover:bg-sky-800 disabled:opacity-50"
      >
        {loading ? 'Alterando senha...' : 'Trocar Senha'}
      </button>
      <div className="text-center text-xs text-gray-500 mt-3 border-t pt-3">
        Já possui conta? <Link href="/login" className="text-sky-700 font-semibold hover:underline">Fazer login</Link>
      </div>
    </form>
  );
}

interface TrocarSenhaSuccessProps {
  onLoginClick: () => void;
}

export function TrocarSenhaSuccess({ onLoginClick }: TrocarSenhaSuccessProps) {
  return (
    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-center">
      <p className="font-semibold mb-2">Senha alterada com sucesso!</p>
      <p className="text-sm mb-4">Você já pode acessar a plataforma com sua nova senha.</p>
      <Link href="/login" onClick={onLoginClick} className="inline-block bg-sky-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-800">
        Ir para o Login
      </Link>
    </div>
  );
}
