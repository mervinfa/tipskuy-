"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { apiGet, apiErrorMessage } from "@/components/app/api";
import { notifyMeChanged } from "@/components/app/useMe";
import type { Me } from "@/components/app/types";

const inputClass =
  "w-full rounded-lg border-2 border-transparent bg-[#f3f4f6] p-3 text-black outline-none transition-all focus:border-black";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError("Email atau kata sandi salah");
        return;
      }
      notifyMeChanged();
      const me = await apiGet<Me>("/api/me");
      router.push(me.role === "DRIVER" ? "/driver" : "/caridriver");
      router.refresh();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="flex w-full flex-col justify-center bg-white p-8 md:h-full lg:p-12">
        <div className="mb-6">
          <h2 className="text-3xl font-black text-black">Login</h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Masuk dengan email dan kata sandi akun Tipskuy Anda.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />

          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />

          {error ? (
            <p role="alert" className="rounded-md border-2 border-red-500 bg-red-50 p-2 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#ff9248] py-3 font-bold text-black shadow-[4px_4px_0px_0px_black] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Masuk..." : "Login"}
          </button>

          <p className="mt-4 text-center text-sm font-medium">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="font-bold text-[#ff9248] hover:underline">
              Register.
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
