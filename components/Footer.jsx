import React from 'react';
// 1. Import ikon dari lucide-react
import { Youtube, Facebook, MessageCircle, Music } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#E5E5E5] py-16 px-8 md:px-20 w-full mt-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10 md:gap-4">
        
        {/* KOLOM 1: Logo & Social Media */}
        <div className="flex flex-col gap-4">
          <h1 className="font-extrabold text-5xl text-black tracking-wide">
            TipSkuy!
          </h1>
          
          {/* Baris Icon dengan Lucide */}
          <div className="flex gap-4 items-center mt-2">
            
            {/* YouTube */}
            <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-black rounded-md hover:bg-black hover:text-white transition-colors cursor-pointer">
              <Youtube size={20} strokeWidth={2.5} />
            </a>

            {/* Facebook */}
            <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors cursor-pointer">
              <Facebook size={20} strokeWidth={2.5} />
            </a>

            {/* WhatsApp (Pakai MessageCircle karena Lucide tidak ada logo WA) */}
            <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors cursor-pointer">
              <MessageCircle size={20} strokeWidth={2.5} />
            </a>

            {/* TikTok (Pakai Music karena Lucide tidak ada logo TikTok) */}
            <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-black rounded-md hover:bg-black hover:text-white transition-colors cursor-pointer">
              <Music size={20} strokeWidth={2.5} />
            </a>

          </div>
        </div>

        {/* KOLOM 2: Informasi Kontak */}
        <div className="flex flex-col gap-2 text-gray-600 text-xl font-medium">
          <p>TipSkuyOfficial@gmail.com</p>
          <p>0896-3042-7670</p>
        </div>

        {/* KOLOM 3: Navigasi */}
        <div className="flex flex-col gap-3 text-lg">
          <h3 className="font-extrabold text-black text-xl mb-1">Navigation</h3>
          <a href="#" className="text-black hover:text-gray-500 hover:underline transition-all">Home</a>
          <a href="#" className="text-black hover:text-gray-500 hover:underline transition-all">About</a>
          <a href="#" className="text-black hover:text-gray-500 hover:underline transition-all">Content</a>
          <a href="#" className="text-black hover:text-gray-500 hover:underline transition-all">Contact</a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;