"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginPayloadSchema } from "@/schemas/contracts";
import { writeToSessionOnly } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const parsed = LoginPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      setError("Dados inválidos. Verifique o formulário.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao fazer login");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      writeToSessionOnly({
        accessToken: data.accessToken,
        userId: data.user.id,
        userRole: data.user.role,
      });

      const isSecure = window.location.protocol === "https:";
      document.cookie = `access_token=${data.accessToken}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
      document.cookie = `user_role=${data.user.role}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax${isSecure ? "; Secure" : ""}`;

      router.push("/dashboard");
    } catch {
      setError("Erro de conexão");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Entrar
        </h1>

        <p className="text-xs text-center text-gray-400 mb-4">
          Demo: <code className="text-gray-600">play@email.com</code> /{" "}
          <code className="text-gray-600">12345678</code>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              className="w-full px-3 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="password"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="w-full px-3 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 text-white font-semibold py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
