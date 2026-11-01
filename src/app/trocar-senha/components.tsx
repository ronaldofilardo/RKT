'use client';

import Link from 'next/link';
import { PasswordInput } from '@/components/ui/password-input';

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
  currentPassword, setCurrentPassword, newPassword, setNewPassword,
  confirmPassword, setConfirmPassword, error, loading, hasToken, onSubmit,
}: TrocarSenhaFormProps) {
  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}
      {!hasToken && (
        <PasswordInput
          id="trocar-current-password"
          name="currentPassword"
          placeholder="Senha atual"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="p-3 text-sm"
        />
      )}
      <PasswordInput
        id="trocar-new-password"
        name="newPassword"
        placeholder="Nova senha (mínimo 8 caracteres)"
        autoComplete="new-password"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="p-3 text-sm"
      />
      <div>
        <PasswordInput
          id="trocar-confirm-password"
          name="confirmPassword"
          placeholder="Confirmar nova senha"
          autoComplete="new-password"
          required
          minLength={8}
          error={!passwordsMatch}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="p-3 text-sm"
        />
        {!passwordsMatch && (
          <span className="text-xs text-red-500 mt-1 block font-medium">As senhas não conferem</span>
        )}
      </div>
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

export function TrocarSenhaSuccess({ onLoginClick }: { onLoginClick: () => void }) {
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
