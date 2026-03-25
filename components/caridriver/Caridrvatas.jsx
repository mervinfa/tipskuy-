"use client";
import {useState} from "react";
import React from 'react';
import PopUpTitip from "@/components/caridriver/PopUpTitip";
import PaymentMethode from "@/components/caridriver/PaymentMethode"; 

const TipskuySearch = () => {

  const [isTitipOpen, setIsTitipOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const handleNextStep = () => {
    setIsTitipOpen(false);   
    setIsPaymentOpen(true);  
  };

  return (
    <div className="bg-[#A5F3FC] p-8 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-5xl mx-auto font-sans mt-4">
      <h2 className="text-3xl font-extrabold mb-6 text-black">Titip di Tipskuy!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
        <div className="flex flex-col gap-2">
          <label className="font-bold text-xl text-black">Kota Asal</label>
          <div className="flex border-2 border-black rounded-md overflow-hidden bg-white h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-12 bg-[#D1D5DB] border-r-2 border-black"></div>
            <input 
              type="text" 
              placeholder="Kota Asal" 
              className="flex-1 px-4 outline-none placeholder-gray-400 text-lg"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-xl text-black">Kota Tujuan</label>
          <div className="flex border-2 border-black rounded-md overflow-hidden bg-white h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-12 bg-[#D1D5DB] border-r-2 border-black"></div>
            <input 
              type="text" 
              placeholder="Kota Tujuan" 
              className="flex-1 px-4 outline-none placeholder-gray-400 text-lg"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-xl text-black">Tanggal Berangkat</label>
          <div className="flex border-2 border-black rounded-md overflow-hidden bg-white h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-12 bg-[#D1D5DB] border-r-2 border-black"></div>
            <input 
              type="text" 
              defaultValue="20-Maret-2026" 
              className="flex-1 px-4 outline-none text-lg font-medium"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button 
              onClick={() => setIsTitipOpen(true)} // Tombol ini membuka Popup Pertama
              className="bg-[#FEF08A] border-[3px] border-black text-black font-extrabold py-2 px-8 rounded-md hover:bg-yellow-300 transition-transform active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg h-12"
          >
            Cari Ekspedisi
          </button>
        </div>
      </div>
      <PopUpTitip 
        isOpen={isTitipOpen} 
        onClose={() => setIsTitipOpen(false)} 
        onNext={handleNextStep} 
      />
      <PaymentMethode 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
      />
    </div>
  );
};

export default TipskuySearch;