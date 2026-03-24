import React from 'react';
import { FaTimes } from 'react-icons/fa';

const PaymentMethode = ({ isOpen, onClose, onBack }) => {
  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
      
      <div className="relative w-full max-w-4xl bg-[#FFB041] border-[4px] border-black rounded-xl p-6 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-white p-1 border-[3px] border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          <FaTimes size={24} />
        </button>

        <div className="flex flex-col gap-4 w-full md:w-1/2 mt-8 md:mt-0">
          
          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-base md:text-lg">Nama Pengirim</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-10 md:h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Nama" className="flex-1 px-3 outline-none text-black font-medium" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-base md:text-lg">No Handphone</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-10 md:h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="No Handphone" className="flex-1 px-3 outline-none text-black font-medium" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-base md:text-lg">Alamat</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-10 md:h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Alamat" className="flex-1 px-3 outline-none text-black font-medium" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-base md:text-lg">Nama Barang</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-10 md:h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Nama Barang" className="flex-1 px-3 outline-none text-black font-medium" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-base md:text-lg">Foto</label>
            <div className="flex gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="w-12 h-12 md:w-14 md:h-14 bg-white border-[3px] border-black rounded-md flex items-start p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm cursor-pointer hover:bg-gray-100">
                  {num}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:flex gap-4 mt-4">
            <button onClick={onBack} className="bg-white hover:bg-gray-200 text-black font-extrabold text-xl py-2 px-8 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
              Kembali
            </button>
            <button className="bg-[#B7FF8E] hover:bg-[#6FAF4F] text-black font-extrabold text-xl py-2 px-10 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all w-max">
              Bayar
            </button>
          </div>

        </div>

        <div className="flex flex-col gap-4 w-full md:w-1/2 pt-8 md:pt-0">
          <h3 className="font-extrabold text-black text-xl md:text-2xl mb-2">Metode Pembayaran</h3>

          <div className="bg-[#F5F5F5] border-[3px] border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="font-bold text-black text-base mb-3">Transfer Bank</h4>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="w-10 h-10 md:w-12 md:h-12 border-[3px] border-black bg-white rounded-md flex items-start p-1 cursor-pointer hover:bg-gray-200">
                  <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-black"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#F5F5F5] border-[3px] border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="font-bold text-black text-base mb-3">E-wallet</h4>
            <div className="flex gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="w-10 h-10 md:w-12 md:h-12 border-[3px] border-black bg-white rounded-md flex items-start p-1 cursor-pointer hover:bg-gray-200">
                  <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-black"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#F5F5F5] border-[3px] border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="font-bold text-black text-base mb-3">Bayar di Gerai</h4>
            <div className="flex gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="w-10 h-10 md:w-12 md:h-12 border-[3px] border-black bg-white rounded-md flex items-start p-1 cursor-pointer hover:bg-gray-200">
                  <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-black"></div>
                </div>
              ))}
            </div>
          </div>

         <div className="md:hidden flex flex-col gap-4 mt-6">
            <button className="bg-[#B7FF8E] hover:bg-[#6FAF4F] text-black font-extrabold text-xl py-3 px-10 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all w-full text-center">
              Bayar
            </button>
            <button onClick={onBack} className="bg-white hover:bg-gray-200 text-black font-extrabold text-xl py-3 px-10 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all w-full text-center">
              Kembali
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PaymentMethode;