import React from "react";
import Link from "next/link";
import { Facebook, MessageCircle, Music, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-[#E5E5E5] px-4 py-8 md:px-12 md:py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <h2 className="text-2xl font-extrabold tracking-wide text-black md:text-3xl">
            TipSkuy!
          </h2>
          <p className="max-w-xs text-sm font-medium text-gray-600">
            Jasa titip dan antar jemput dari driver terverifikasi di sekitar Anda.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="rounded-md border-2 border-black bg-white p-2 text-black"
              aria-label="YouTube"
            >
              <Youtube size={18} />
            </a>
            <a
              href="#"
              className="rounded-md border-2 border-black bg-white p-2 text-black"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
            <a
              href="#"
              className="rounded-md border-2 border-black bg-white p-2 text-black"
              aria-label="WhatsApp"
            >
              <MessageCircle size={18} />
            </a>
            <a
              href="#"
              className="rounded-md border-2 border-black bg-white p-2 text-black"
              aria-label="TikTok"
            >
              <Music size={18} />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm font-bold">
          <h3 className="text-base font-extrabold text-black">Navigasi</h3>
          <Link href="/#main-page" className="text-black hover:underline">
            Home
          </Link>
          <Link href="/#about" className="text-black hover:underline">
            About
          </Link>
          <Link href="/#contact" className="text-black hover:underline">
            Contact
          </Link>
        </div>

        <div className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          <h3 className="text-base font-extrabold text-black">Kontak</h3>
          <a href="mailto:TipSkuyOfficial@gmail.com" className="break-all hover:underline">
            TipSkuyOfficial@gmail.com
          </a>
          <a href="tel:089630427670" className="hover:underline">
            0896-3042-7670
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
