import React from 'react';

const PopUpTitip = ({ isOpen, onClose, onNext }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-4xl bg-[#FFB347] rounded-[30px] border-2 border-black p-6 md:p-10 shadow-2xl">
        
        <button onClick={onClose} className="absolute -top-4 -left-4 bg-white rounded-full hover:scale-110 transition-transform shadow-lg border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-red-600">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          <div className="space-y-4">
            <div><label className="block font-bold text-black mb-1">Nama Pengirim</label><input type="text" placeholder="Nama" className="w-full p-2 border-2 border-gray-400 rounded-md bg-white shadow-inner focus:outline-none focus:border-blue-400" /></div>
            <div><label className="block font-bold text-black mb-1">No Handphone</label><input type="text" placeholder="No Handphone" className="w-full p-2 border-2 border-gray-400 rounded-md bg-white shadow-inner focus:outline-none focus:border-blue-400" /></div>
            <div><label className="block font-bold text-black mb-1">Alamat</label><input type="text" placeholder="Alamat" className="w-full p-2 border-2 border-gray-400 rounded-md bg-white shadow-inner focus:outline-none focus:border-blue-400" /></div>
            <div><label className="block font-bold text-black mb-1">Nama Barang</label><input type="text" placeholder="Nama Barang" className="w-full p-2 border-2 border-gray-400 rounded-md bg-white shadow-inner focus:outline-none focus:border-blue-400" /></div>
            <p className="text-xs font-bold italic text-black">*Noted : Barang tidak boleh lebih dari 5kg</p>
            
            <button onClick={onNext} className="bg-[#A0522D] text-white font-bold py-2 px-12 rounded-lg border border-black hover:bg-[#8B4513] transition-colors mt-4">
              Next
            </button>
          </div>

          <div className="flex flex-col">
            <label className="block font-bold text-black mb-2 text-lg">Unggah Foto</label>
            <div className="bg-gray-300 border-2 border-gray-500 rounded-xl p-6 flex-grow flex flex-row gap-4 items-start">
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopUpTitip;