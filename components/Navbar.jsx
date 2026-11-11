"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { FaBars, FaTimes } from "react-icons/fa";
import { LogOut } from "lucide-react";
import { NotificationBell } from "@/components/app/NotificationBell";
import { notifyMeChanged } from "@/components/app/useMe";
import { useMe } from "@/components/app/useMe";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { me, loading } = useMe();

  const handleScroll = (e, path) => {
    if (path.includes("#")) {
      const id = path.split("#")[1];
      const element = document.getElementById(id);
      if (element) {
        e.preventDefault();
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const isDriver = me?.role === "DRIVER";

  const menuList = isDriver
    ? [
        { name: "Dashboard", path: "/driver" },
        { name: "Postingan Terbuka", path: "/driver#postingan-terbuka" },
      ]
    : [
        { name: "Home", path: "/#main-page" },
        { name: "About", path: "/#about" },
        { name: "Cari Driver", path: "/caridriver" },
        { name: "Contact", path: "/#contact" },
      ];

  async function handleLogout() {
    await signOut({ callbackUrl: "/" });
    notifyMeChanged();
  }

  return (
    <header className="fixed left-4 right-4 top-4 z-50 md:left-6 md:right-6">
      <div className="relative z-50 flex items-center justify-between rounded-full border-2 border-black bg-[#FFFFAF] p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:p-3">
        <Link
          href={isDriver ? "/driver" : "/"}
          className="flex items-center gap-2 pl-4 text-2xl font-extrabold text-black md:pl-6 md:text-4xl"
        >
          <Image
            src="/midlogo.webp"
            alt="Logo Tipskuy"
            width={88}
            height={43}
            priority
            className="h-7 w-auto md:h-9"
          />
          <span>Tipskuy!</span>
        </Link>

        <div className="hidden gap-6 text-lg font-extrabold lg:flex">
          {menuList.map((item) => (
            <Link
              href={item.path}
              key={item.name}
              onClick={(e) => handleScroll(e, item.path)}
              className="text-black transition-colors hover:text-[#FFAE4C]"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 pr-2 md:gap-3 md:pr-0">
          {me ? (
            <>
              <NotificationBell role={me.role} />
              <div className="hidden text-right sm:block">
                <p className="max-w-32 truncate text-sm font-extrabold text-black">{me.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
                  {me.role === "DRIVER" ? "Driver" : "Customer"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex items-center gap-1 rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none md:px-4 md:text-sm"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </>
          ) : loading ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-white/70" />
          ) : (
            <>
              <Link href="/auth/register" className="hidden font-bold sm:block">
                <button className="rounded-full border-2 border-black bg-[#FFAE4C] px-4 py-2 text-sm text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FF9B51] md:px-7 md:py-3 md:text-base">
                  Register
                </button>
              </Link>
              <Link href="/auth/login" className="font-bold">
                <button className="rounded-full border-2 border-black bg-[#9EF7FF] px-5 py-2 text-sm text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#5A7ACD] md:px-7 md:py-3 md:text-base">
                  Log in
                </button>
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center rounded-full border-2 border-black bg-white p-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:scale-95 lg:hidden"
            aria-label="Menu"
          >
            {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[110%] flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] lg:hidden">
          <div className="flex flex-col">
            {menuList.map((item) => (
              <Link
                href={item.path}
                key={item.name}
                onClick={() => setIsOpen(false)}
                className="border-b-2 border-black px-6 py-4 text-xl font-extrabold text-black transition-colors hover:bg-[#FFFFAF]"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {!me ? (
            <div className="flex flex-col gap-2 bg-[#E5E5E5] p-4">
              <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                <button className="w-full rounded-full border-2 border-black bg-[#FFAE4C] py-3 text-base font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FF9B51]">
                  Register
                </button>
              </Link>
              <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                <button className="w-full rounded-full border-2 border-black bg-[#9EF7FF] py-3 text-base font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#5A7ACD]">
                  Login
                </button>
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
