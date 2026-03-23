import React from 'react';

const PopUpTitip = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      {/* Container Utama Pop-up */}
      <div className="relative w-full max-w-4xl bg-[#FFB347] rounded-[30px] border-2 border-black p-6 md:p-10 shadow-2xl">
        
        {/* Tombol Close (X) - Menggunakan SVG Manual */}
        <button 
          onClick={onClose}
          className="absolute -top-4 -left-4 bg-white rounded-full hover:scale-110 transition-transform shadow-lg border border-gray-200"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-12 h-12 text-red-600"
          >
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* SISI KIRI: Form Input */}
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-black mb-1">Nama Pengirim</label>
              <input type="text" placeholder="Nama" className="w-full p-2 border-2 border-gray-400 rounded-md bg-white shadow-inner focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">No Handphone</label>
              <input type="text" placeholder="No Handphone" className="w-full p-2 border-2 border-gray-400 rounded-md bg-white shadow-inner focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Alamat</label>
              <input type="text" placeholder="Alamat" className="w-full p-2 border-2 border-gray-400 rounded-md bg-white shadow-inner focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Nama Barang</label>
              <input type="text" placeholder="Nama Barang" className="w-full p-2 border-2 border-gray-400 rounded-md bg-white shadow-inner focus:outline-none focus:border-blue-400" />
            </div>
            <p className="text-xs font-bold italic text-black">*Noted : Barang tidak boleh lebih dari 5kg</p>
            
            <button className="bg-[#A0522D] text-white font-bold py-2 px-12 rounded-lg border border-black hover:bg-[#8B4513] transition-colors mt-4">
              Next
            </button>
          </div>

          {/* SISI KANAN: Unggah Foto */}
          <div className="flex flex-col">
            <label className="block font-bold text-black mb-2 text-lg">Unggah Foto</label>
            <div className="bg-gray-300 border-2 border-gray-500 rounded-xl p-6 flex-grow flex flex-row gap-4 items-start">
              
              {/* Dropzone Area */}
              <div className="flex-grow bg-white border-2 border-dashed border-black rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="mb-2">
                   {/* Icon Kamera/Upload Manual */}
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-black">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                   </svg>
                </div>
                <p className="text-[10px] font-bold text-black">Ketuk atau Seret Foto ke Sini</p>
                <p className="text-[8px] mt-1 text-black font-semibold">(Maksimal 3 file, total 10MB, format JPG/PNG)</p>
                <button className="mt-4 bg-[#FF9F43] border border-black px-6 py-1 rounded-md text-xs font-bold shadow-sm">
                  Pilih File
                </button>
              </div>

              {/* Slot Preview 1, 2, 3 */}
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="w-12 h-12 bg-white border border-black rounded flex items-center justify-center text-[10px] font-bold text-gray-500">
                    {num}
                  </div>
                ))}
                {/* Tombol Plus (+) Manual */}
                <button className="w-12 h-12 flex items-center justify-center text-black hover:scale-110 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                   </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopUpTitip;