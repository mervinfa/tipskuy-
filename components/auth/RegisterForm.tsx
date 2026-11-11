"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { apiErrorMessage, apiGet, apiSend } from "@/components/app/api";
import { notifyMeChanged } from "@/components/app/useMe";
import type { Me, Role } from "@/components/app/types";

const inputClass =
  "w-full rounded-lg border-2 border-transparent bg-[#f3f4f6] p-3 text-black outline-none transition-all focus:border-black";

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak sama");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Kata sandi minimal 8 karakter, mengandung huruf dan angka");
      return;
    }
    setLoading(true);
    try {
      await apiSend("/api/auth/register", "POST", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone,
        role,
        ...(role === "DRIVER"
          ? {
              driver: {
                vehicleType: vehicleType.trim(),
                ...(vehiclePlate.trim() ? { vehiclePlate: vehiclePlate.trim() } : {}),
                whatsappNumber,
              },
            }
          : {}),
      });

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError("Akun berhasil dibuat. Silakan masuk lewat halaman login.");
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
    <div className="container overflow-y-auto">
      <div className="flex w-full flex-col justify-center bg-white p-8 lg:p-12">
        <div className="mb-3">
          <h2 className="text-3xl font-black text-black">Register</h2>
          <p className="mt-1 text-sm font-medium text-gray-400">Buat akun untuk mulai menggunakan Tipskuy.</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("CUSTOMER")}
              className={`rounded-lg border-2 border-black py-2 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                role === "CUSTOMER" ? "bg-[#B7FF8E]" : "bg-white"
              }`}
            >
              Saya Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("DRIVER")}
              className={`rounded-lg border-2 border-black py-2 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                role === "DRIVER" ? "bg-[#9EF7FF]" : "bg-white"
              }`}
            >
              Saya Driver
            </button>
          </div>

          <input
            type="text"
            required
            minLength={2}
            placeholder="Nama lengkap"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
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
            type="tel"
            required
            pattern="08[0-9]{8,11}"
            placeholder="No HP, contoh 081234567890"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Password minimal 8 karakter"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Konfirmasi password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
          />

          {role === "DRIVER" ? (
            <div className="space-y-3 rounded-lg border-2 border-black bg-[#F0FDFA] p-3">
              <p className="text-sm font-extrabold text-black">Data driver</p>
              <input
                type="text"
                required
                placeholder="Jenis kendaraan, contoh Motor"
                value={vehicleType}
                onChange={(event) => setVehicleType(event.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Plat kendaraan, contoh H 1234 AB"
                value={vehiclePlate}
                onChange={(event) => setVehiclePlate(event.target.value)}
                className={inputClass}
              />
              <input
                type="tel"
                required
                pattern="62[0-9]{8,13}"
                placeholder="WhatsApp format 6281234567890"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                className={inputClass}
              />
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-md border-2 border-red-500 bg-red-50 p-2 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#ff9248] py-3 font-bold text-black shadow-[4px_4px_0px_0px_black] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Membuat akun..." : "Register"}
          </button>

          <p className="mt-4 text-center text-sm font-medium">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="font-bold text-[#ff9248] hover:underline">
              Login.
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
