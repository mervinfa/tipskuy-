"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar'; 
import CariDrv from '@/components/caridriver/Caridrvatas'; 
import CariDrvB from '@/components/caridriver/Caridrvbawah'; 
import PopUpTitip from '@/components/caridriver/PopUpTitip';
import Footer from '@/components/Footer';

const CariDriver = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-white flex flex-col font-sans overflow-x-hidden"> 
      <PopUpTitip isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Header: Dibuat ramping dan terpusat */}
          <Navbar />

      {/* Main Content: Mengatur lebar maksimal agar seragam */}
      <main className="flex-grow flex flex-col items-center px-4 py-8 space-y-10">
        
        {/* Section Biru */}
        <section className="w-full max-w-6x">
          <CariDrv />
        </section>

        {/* Section Hijau */}
        <section className="w-full max-w-5xl">
          <CariDrvB onTitipClick={() => setIsModalOpen(true)} />
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default CariDriver;