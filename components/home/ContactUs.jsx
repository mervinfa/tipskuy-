import React from 'react';
import { Youtube, Facebook, Music, MessageCircle } from 'lucide-react';

const ContactUs = () => {
  return (
    // Wadah utama dengan background pink pastel dan border atas-bawah warna biru (menyesuaikan gambar)
    <div className="-mx-4 md:-mx-6 w-screen w-full bg-[#FFEBEB] border-y-2 border-[#00A3FF] py-16 px-6 flex justify-center mt-10">
      
      {/* Container pembatas lebar agar tidak melar di layar besar */}
      <div className="w-full max-w-5xl flex flex-col items-center">
        
        {/* Judul Utama */}
        <h2 className="font-extrabold text-4xl mb-12 text-black">
          Contact Us
        </h2>

        {/* Grid 2 Kolom (Kiri: Form, Kanan: Sosial Media) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          
          {/* ========================================== */}
          {/* KOLOM KIRI: Form Input                     */}
          {/* ========================================== */}
          <div className="flex flex-col gap-4">
            
            {/* Input Name */}
            <div className="flex bg-[#F5F5F5] border border-gray-200 rounded-md overflow-hidden h-12 shadow-sm">
              <div className="bg-[#DFDFDF] w-24 flex items-center justify-center text-sm font-medium text-gray-500">
                Name
              </div>
              <input type="text" className="flex-1 bg-transparent px-4 outline-none text-gray-700" />
            </div>

            {/* Input E-mail */}
            <div className="flex bg-[#F5F5F5] border border-gray-200 rounded-md overflow-hidden h-12 shadow-sm">
              <div className="bg-[#DFDFDF] w-24 flex items-center justify-center text-sm font-medium text-gray-500">
                E-mail
              </div>
              <input type="email" className="flex-1 bg-transparent px-4 outline-none text-gray-700" />
            </div>

            {/* Input Textarea Message */}
            <div className="flex bg-[#F5F5F5] border border-gray-200 rounded-md overflow-hidden min-h-[140px] shadow-sm">
              <div className="bg-[#DFDFDF] w-24 flex items-start justify-center pt-4 text-sm font-medium text-gray-500 text-center leading-tight">
                Your<br />Message
              </div>
              <textarea className="flex-1 bg-transparent p-4 outline-none resize-none text-gray-700"></textarea>
            </div>

          </div>

          {/* ========================================== */}
          {/* KOLOM KANAN: Kotak Sosial Media (Kupon)    */}
          {/* ========================================== */}
          <div className="bg-[#F5F5F5] border border-gray-200 rounded-md p-6 flex justify-center items-center shadow-sm">
            
            {/* Wadah Garis Putus-Putus Luar */}
            <div className="border border-dashed border-gray-500 w-full flex py-8 px-4 md:px-8">
              
              {/* Sisi Kiri: Ikon (dengan garis putus-putus pembatas di kanannya) */}
              <div className="flex flex-col gap-6 items-center border-r border-dashed border-gray-500 pr-6">
                <Youtube size={28} strokeWidth={2.5} className="text-black" />
                <Facebook size={28} strokeWidth={2.5} className="text-black" />
                {/* Pakai Music untuk TikTok dan MessageCircle untuk WA */}
                <Music size={28} strokeWidth={2.5} className="text-black" /> 
                <MessageCircle size={28} strokeWidth={2.5} className="text-black" />
              </div>

              {/* Sisi Kanan: Teks */}
              <div className="flex flex-col gap-6 pl-6 justify-center">
                <p className="font-extrabold text-lg md:text-xl text-black leading-none flex items-center h-[28px]">tipskuy official</p>
                <p className="font-extrabold text-lg md:text-xl text-black leading-none flex items-center h-[28px]">tipskuy official</p>
                <p className="font-extrabold text-lg md:text-xl text-black leading-none flex items-center h-[28px]">tipskuy official</p>
                <p className="font-extrabold text-lg md:text-xl text-black leading-none flex items-center h-[28px]">+6288888888</p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactUs;