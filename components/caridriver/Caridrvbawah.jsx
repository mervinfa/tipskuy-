"use client"; 
import React, { useState } from 'react';
import PopUpTitip from "@/components/caridriver/PopUpTitip"; 
import PaymentMethode from "@/components/caridriver/PaymentMethode"; 

const DriverList = () => {
  const [isTitipOpen, setIsTitipOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const handleNextStep = () => {
    setIsTitipOpen(false);
    setIsPaymentOpen(true);
  };

  const handleBackStep = () => {
    setIsPaymentOpen(false); // Tutup form pembayaran
    setIsTitipOpen(true);    // Buka kembali form data barang
  };

  const drivers = [
    { id: 1, name: "Ardi Poke", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 2, name: "Penur", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 3, name: "Suzy", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 4, name: "Epin", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 5, name: "Perju", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 6, name: "Bowo", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "disabled" },
    { id: 7, name: "Rey", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "disabled" },
  ];

  return (
    <div className="bg-[#D1FAE5] p-6 md:p-8 rounded-xl border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-5xl mx-auto font-sans mt-5">
      
      <div className="grid grid-cols-4 gap-4 bg-[#D1D5DB] p-3 rounded-lg border-[3px] border-black mb-6 text-base md:text-xl font-extrabold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hidden md:grid">
        <div className="text-left px-8">Driver</div>
        <div>Berangkat</div>
        <div className="text-center">Durasi</div>
        <div>Tiba</div>
      </div>

      <div className="flex flex-col gap-4 ">
        {drivers.map((driver) => (
          <div 
            key={driver.id}
            className={`grid grid-cols-1 md:grid-cols-4  items-center gap-4 p-4 md:p-6 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all
              ${driver.status === 'disabled' ? 'bg-[#DCFCE7] opacity-60 grayscale' : 'bg-[#D1D5DB] hover:-translate-y-1'}`}
          >
            <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-2 justify-start p-2 ">
              <div className="w-14 h-14 rounded-full border-[3px] border-black overflow-hidden bg-white flex-shrink-0">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xl font-extrabold text-black md:text-left leading-tight">
                {driver.name}
              </div>
            </div>

            <div className="text-sm md:text-lg text-black">
              <p className="font-medium">{driver.origin}</p>
              <p className="font-extrabold text-xl">{driver.time}</p>
              <p className="font-medium">{driver.date}</p>
            </div>

            <div className="text-left md:text-center font-extrabold text-xl text-black">
              <span className="md:hidden text-sm font-medium mr-2">Durasi:</span>
              {driver.duration}
            </div>

            <div className="flex justify-between items-center w-full">
              <div className="text-sm md:text-lg text-black">
                <p className="font-medium">{driver.dest}</p>
                <p className="font-extrabold text-xl">{driver.arrival}</p>
                <p className="font-medium">{driver.date}</p>
              </div>
              
              {driver.status === 'active' ? (
                <button 
                  onClick={() => setIsTitipOpen(true)}
                  className="bg-[#B7FF8E] border-[3px] border-black text-black text-lg md:text-xl font-extrabold px-6 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#6FAF4F] active:translate-y-1 active:shadow-none transition-all ml-4"
                >
                  Titip
                </button>
              ) : (
                <div className="text-red-600 font-extrabold text-lg px-4 ml-4 border-2 border-red-600 rounded-lg bg-white rotate-[-5deg] shrink-0 whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]">
                  Penuh
                </div>
              )}
            </div>
            
          </div>
        ))}
      </div>

      <PopUpTitip 
        isOpen={isTitipOpen} 
        onClose={() => setIsTitipOpen(false)} 
        onNext={handleNextStep} 
      />

      <PaymentMethode 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        onBack={handleBackStep} // 2. OPER FUNGSINYA KE SINI
      />

    </div>
  );
};

export default DriverList;