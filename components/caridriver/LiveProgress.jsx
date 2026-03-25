"use client"; 
import React, { useState } from 'react';
import PopUpChat from "@/components/caridriver/PopUpChat";

const LiveProgress = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto bg-[#FFB041] border-[4px] border-black rounded-xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in slide-in-from-top-4 duration-500 mt-24">

      {/* Judul */}
      <h2 className="text-2xl md:text-4xl font-extrabold text-black text-center mb-10 md:mb-12 mt-2 md:mt-0">
        Live Progress Titip
      </h2>

      {/* Wrapper Progress Bar */}
      <div className="relative w-full max-w-3xl mx-auto px-4 md:px-10">
        
        {/* Garis Tengah (Background Line) */}
        <div className="absolute top-4 md:top-5 left-14 right-14 md:left-24 md:right-24 h-3 md:h-4 bg-[#84CC16] border-[2px] border-black z-0 rounded-full"></div>

        {/* Titik-titik Node (Bulatan) */}
        <div className="relative z-10 flex justify-between items-start">
          
          {/* Node 1: Sedang Dikirim */}
          <div className="flex flex-col items-center gap-2 w-24 md:w-32">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#22C55E] border-[3px] border-black rounded-full "></div>
            <span className="font-extrabold text-black text-xs md:text-lg text-center leading-tight">Sedang Dikirim</span>
          </div>

          {/* Node 2: Menuju Tempat */}
          <div className="flex flex-col items-center gap-2 w-24 md:w-32">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#22C55E] border-[3px] border-black rounded-full "></div>
            <span className="font-extrabold text-black text-xs md:text-lg text-center leading-tight">Menuju Tempat</span>
          </div>

          {/* Node 3: Paket Tiba */}
          <div className="flex flex-col items-center gap-2 w-24 md:w-32">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#22C55E] border-[3px] border-black rounded-full "></div>
            <span className="font-extrabold text-black text-xs md:text-lg text-center leading-tight">Paket Tiba</span>
          </div>

        </div>
      </div>
      
     
      <div className="mt-8 flex justify-end md:absolute md:top-6 md:right-6 md:mt-0">
        <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-black font-extrabold text-sm md:text-base py-2 px-4 md:px-6 border-[3px] border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
          Chat Driver
        </button>
      </div>
        <PopUpChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />  
    </div>
  );
};

export default LiveProgress;