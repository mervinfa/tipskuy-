"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar'; 
import CariDrv from '@/components/caridriver/Caridrvatas'; 
import CariDrvB from '@/components/caridriver/Caridrvbawah'; 
import PopUpTitip from '@/components/caridriver/PopUpTitip';
import Footer from '@/components/Footer';
import LiveProgress from "@/components/caridriver/LiveProgress";

const CariDriver = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  return (
    <div className="relative min-h-screen bg-white flex flex-col font-sans"> 
      <PopUpTitip isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          <Navbar />
      <main className="flex-grow flex flex-col items-center px-4 py-8 space-y-10">
        
       {isTracking && (
          <section className="w-full max-w-5xl sticky top-[100px] animate-in fade-in slide-in-from-top-8 duration-500 z-[80]">
            <LiveProgress />
          </section>
        )}

        <section className="w-full max-w-6x">
          <CariDrv />
        </section>

        <section className="w-full max-w-5xl">
          <CariDrvB onTransactionSuccess={() => setIsTracking(true)} />
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default CariDriver;