import React from 'react';
import { FaTimes } from 'react-icons/fa';

const PopUpTitip = ({ isOpen, onClose, onNext }) => {
  if (!isOpen) return null;

  return (
    // 1. Overlay (Background Gelap) Disamakan persis z-[100]
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
      
      {/* 2. Container Utama Disamakan (bg-[#FFB041], border-[4px], rounded-xl) */}
      <div className="relative w-full max-w-4xl bg-[#FFB041] border-[4px] border-black rounded-xl p-6 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-8 max-h-[100vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* 3. Tombol X (Close) Disamakan persis warnanya dan letaknya */}
        <button 
          onClick={onClose}
          className="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-white p-1 border-[3px] border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          <FaTimes size={24} />
        </button>

        {/* --- KOLOM KIRI (FORM INPUT) --- */}
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
          
          <p className="text-xs font-bold italic text-black">*Noted : Berat tidak boleh dari 1 kg,jika lebih maka akan ada biaya tambahan</p>
          
          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-base md:text-lg">Nama Penerima</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-10 md:h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Nama Penerima" className="flex-1 px-3 outline-none text-black font-medium" />
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
            <label className="font-extrabold text-black text-base md:text-lg">Alamat Penerima</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-10 md:h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Alamat" className="flex-1 px-3 outline-none text-black font-medium" />
            </div>
          </div>

          {/* TOMBOL DESKTOP */}
          <button onClick={onNext} className="hidden md:block bg-[#A0522D] hover:bg-[#8B4513] text-black font-extrabold text-xl py-2 px-10 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all mt-4 w-max">
            Next
          </button>
        </div>

        {/* --- KOLOM KANAN (UPLOAD FOTO) --- */}
        <div className="flex flex-col w-full md:w-1/2 pt-4 md:pt-0 h-100">
          <label className="font-extrabold text-black text-base md:text-lg mb-2">Unggah Foto</label>
          
          <div className="bg-gray-300 border-[3px] border-black rounded-xl p-4 md:p-6 flex-grow flex flex-col gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
             <div className="flex-grow bg-white border-[3px] border-dashed border-black rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="mb-2">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-black">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                   </svg>
                </div>
                <p className="text-xs font-extrabold text-black">Ketuk atau Seret Foto</p>
                <p className="text-[10px] mt-1 text-black font-semibold">(Maks 3 file, 10MB)</p>
                <button className="mt-4 bg-[#FF9F43] border-[2px] border-black px-4 py-1.5 rounded-md text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                  Pilih File
                </button>
              </div>

              <div className="flex gap-2 justify-center">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="w-10 h-10 bg-white border-[2px] border-black rounded flex items-center justify-center text-xs font-bold text-gray-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {num}
                  </div>
                ))}
              </div>
          </div>

          {/* TOMBOL MOBILE */}
          <button onClick={onNext} className="md:hidden bg-[#A0522D] hover:bg-[#8B4513] text-black font-extrabold text-xl py-3 px-10 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all mt-6 w-full text-center">
            Next
          </button>
        </div>

      </div>
    </div>
  );
};

export default PopUpTitip;