import React from 'react';
import { FaTimes } from 'react-icons/fa';

const PopUpQR = ({ isOpen, onClose }) => {
  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
      
      {/* Background Oranye Luar */}
      <div className="relative w-full max-w-2xl bg-[#FFB041] border-[4px] border-black rounded-xl p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Tombol Close (Kanan Atas) */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 bg-red-600 hover:bg-red-700 text-white p-1 border-[3px] border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all z-10"
        >
          <FaTimes size={24} />
        </button>

        {/* Kartu Putih Dalam */}
        <div className="bg-white border-[4px] border-black rounded-xl w-full p-6 md:p-8 flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
          
          <h2 className="font-extrabold text-xl md:text-2xl text-black mb-6 text-center">
            Selesaikan Pembayaran Anda
          </h2>

          {/* Gambar QR Code (Ganti src dengan path gambarmu nanti) */}
          <div className="w-48 h-48 md:w-56 md:h-56 bg-white border-[3px] border-black rounded-xl mb-4 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" 
               alt="QRIS Code" 
               className="w-full h-full object-cover" 
             />
          </div>

          <p className="font-medium text-black text-sm md:text-base text-center mt-2">
            Mohon selesaikan pembayaran anda sebelum
          </p>
          
          <p className="font-extrabold text-2xl md:text-3xl text-black my-2 text-center">
            01 jam : 59 menit : 45 detik
          </p>
          
          <p className="font-medium text-black text-sm md:text-base mb-6 text-center">
            Kamis, 26 Maret 2026
          </p>

          {/* Garis Pembatas */}
          <hr className="w-full border-t-[3px] border-black my-2" />

          {/* Rincian Pembayaran (Dibuat Grid agar titik duanya sejajar rapi) */}
          <div className="w-full grid grid-cols-[140px_10px_1fr] md:grid-cols-[180px_10px_1fr] gap-y-3 font-extrabold text-black text-sm md:text-lg my-4">
            <div>Nomer Pesanan</div>
            <div>:</div>
            <div>#TSK-20260325-01</div>

            <div>Rute</div>
            <div>:</div>
            <div>Pekalongan - Semarang</div>

            <div>Total Tagihan</div>
            <div>:</div>
            <div>Rp. 15.000</div>

            <div>Metode Pembayaran</div>
            <div>:</div>
            <div>QRIS</div>
          </div>

          {/* Garis Pembatas Bawah */}
          <hr className="w-full border-t-[3px] border-black mt-2" />

        </div>

      </div>
    </div>
  );
};

export default PopUpQR;