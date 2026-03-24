import React from 'react';
import { FaTimes } from 'react-icons/fa';

const PopUpSuccess = ({ isOpen, onClose }) => {
  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
      
      {/* Container Utama Oranye */}
      <div className="relative w-full max-w-2xl bg-[#FFB041] border-[4px] border-black rounded-xl p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Tombol Close */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 bg-red-600 hover:bg-red-700 text-white p-1 border-[3px] border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all z-10"
        >
          <FaTimes size={24} />
        </button>

        {/* Kartu Putih Dalam */}
        <div className="bg-white border-[4px] border-black rounded-xl w-full p-8 md:p-12 flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4 relative">
          
          {/* Ikon Sukses (Green Starburst/Badge dengan Ceklis Putih) */}
          <div className="mb-6 flex justify-center items-center">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Bentuk Bintang Segi-Banyak (Badge) */}
              <path d="M12 2.25l2.3 1.83 2.92-.56 1.16 2.73 2.8 1.1-.73 2.89.98 2.81-2.43 1.63-1.37 2.63-2.9-.3-2.14 2.01L12 21.75l-2.3-1.83-2.92.56-1.16-2.73-2.8-1.1.73-2.89-.98-2.81 2.43-1.63 1.37-2.63 2.9.3 2.14-2.01L12 2.25z" fill="#10B981" stroke="black" strokeWidth="0.5"/>
              {/* Tanda Ceklis */}
              <path d="M8 12.5l3 3 5-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 className="font-extrabold text-2xl md:text-3xl text-black mb-2 text-center">
            Pembayaran Berhasil
          </h2>
          <p className="font-medium text-black text-sm md:text-base text-center mb-8">
            Mohon antarkan barang ke alamat :
          </p>

          {/* Rincian Driver (Rata Kiri, Titik Dua Sejajar) */}
          <div className="w-full max-w-[360px] flex flex-col gap-2 font-bold text-black text-sm md:text-lg mb-8">
            <div className="grid grid-cols-[120px_10px_1fr]">
              <div>Nama Driver</div><div>:</div><div>Ardi Poke</div>
            </div>
            <div className="grid grid-cols-[120px_10px_1fr]">
              <div>Alamat</div><div>:</div><div>Jl. Mawar No. 12, Semarang</div>
            </div>
            <div className="grid grid-cols-[120px_10px_1fr]">
              <div>No Hp</div><div>:</div><div>081234567890</div>
            </div>
          </div>

          {/* Link Gmaps */}
          <div className="w-full max-w-[360px] flex flex-col font-bold text-black text-sm md:text-lg mb-4">
            <p>Gmaps</p>
            <a href="https://maps.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 break-all font-medium mt-1">
              https://maps.com
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PopUpSuccess;