"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Shield,
  Truck,
  User,
  X,
} from "lucide-react";
import { apiErrorMessage, apiSend } from "./api";
import { useMe } from "./useMe";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfileModal({ isOpen, onClose, onLogout }: ProfileModalProps) {
  const { me } = useMe();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !me) return null;

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Kata sandi baru minimal 8 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      await apiSend<{ message: string }>("/api/me/password", "POST", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setSuccess("Kata sandi berhasil diubah.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const isDriver = me.role === "DRIVER";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-all"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border-3 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md border-2 border-black bg-[#FFFFAF] p-1.5 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none"
          aria-label="Tutup modal profil"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 border-b-2 border-black pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-black bg-[#9EF7FF] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <User size={24} className="text-black" />
          </div>
          <div>
            <h2 id="profile-modal-title" className="text-xl font-extrabold text-black">
              Profil Pengguna
            </h2>
            <p className="text-xs font-semibold text-gray-600">Informasi akun dan pengaturan keamanan</p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg border-2 border-black bg-[#FFFFAF] p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-extrabold text-black">{me.name}</p>
                <p className="text-xs font-medium text-gray-700">{me.email}</p>
              </div>
              <span className="rounded-md border-2 border-black bg-white px-2.5 py-0.5 text-xs font-extrabold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {isDriver ? "Driver" : "Customer"}
              </span>
            </div>

            {isDriver && me.driverProfile ? (
              <div className="mt-3 border-t-2 border-black/40 pt-2 text-xs font-medium text-gray-800">
                <p className="flex items-center gap-1.5 font-bold">
                  <Truck size={14} /> WhatsApp Driver: {me.driverProfile.whatsappNumber}
                </p>
                <p className="mt-1 flex items-center gap-1.5">
                  <Shield size={14} /> Status verifikasi: {me.driverProfile.verificationStatus}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border-2 border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound size={18} className="text-black" />
              <h3 className="text-sm font-extrabold text-black">Ganti Kata Sandi</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Kata sandi saat ini
                <input
                  required
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama"
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:bg-[#FFFFAF]/30"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Kata sandi baru
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter, 1 huruf, 1 angka"
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:bg-[#FFFFAF]/30"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Konfirmasi kata sandi baru
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:bg-[#FFFFAF]/30"
                />
              </label>

              {error ? (
                <div className="flex items-center gap-2 rounded-md border-2 border-black bg-red-100 p-2.5 text-xs font-bold text-red-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {success ? (
                <div className="flex items-center gap-2 rounded-md border-2 border-black bg-green-100 p-2.5 text-xs font-bold text-green-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{success}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#9EF7FF] py-2.5 text-xs font-extrabold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:bg-[#83EBF5] active:translate-y-0.5 active:shadow-none disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={15} />
                    <span>Simpan Kata Sandi</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="border-t-2 border-black/20 pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-red-100 py-2.5 text-xs font-extrabold text-red-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:bg-red-200 active:translate-y-0.5 active:shadow-none"
            >
              <LogOut size={15} />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
