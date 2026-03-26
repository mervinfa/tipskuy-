import React from 'react';
import { FaTimes } from 'react-icons/fa';

const PopUpCancel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all">
      
      {/* Container Box Abu-abu */}
      <div className="relative w-full max-w-2xl bg-[#D1D5DB] border-[3px] border-black rounded-xl p-8 md:p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
        
        {/* Tombol Close (Silang Merah) */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 bg-red-600 hover:bg-red-700 text-white p-1 border-[3px] border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          <FaTimes size={24} />
        </button>

        {/* Teks Pesan Batal */}
        <p className="font-extrabold text-black text-center text-lg md:text-2xl leading-relaxed mt-4 md:mt-2 px-2 md:px-6">
          Mohon maaf, Driver terpaksa membatalkan pesanan Anda. Jangan khawatir, dana akan segera dikembalikan ke saldo/rekening Anda secara otomatis. Silakan cek berkala, ya!
        </p>

      </div>
    </div>
  );
};

export default PopUpCancel;