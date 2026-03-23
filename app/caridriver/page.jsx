"use client"; 
import { useState } from 'react';
import Navbar from "@/components/Navbar";
import ModalPesan from "@/components/caridriver/PaymentMethode"; 

export default function CariDriver() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-32 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-extrabold text-black mb-8">Pilih Driver Favoritmu</h1>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#B7FF8E] hover:bg-[#6FAF4F] border-[3px] border-black px-8 py-4 rounded-xl font-bold text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          Pesan Sekarang
        </button>
      </div>

      <ModalPesan 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
    </div>
  );
}