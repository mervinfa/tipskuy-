import React from 'react';
import { FaTimes, FaCamera, FaSmile, FaPaperPlane } from 'react-icons/fa';

const PopUpChat = ({ isOpen, onClose, driverName = "Ardi Poke" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
      
      {/* Container Chat */}
      <div className="w-full max-w-md bg-white border-[3px] border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* --- HEADER CHAT --- */}
        <div className="flex justify-between items-center p-3 border-b-[3px] border-black bg-white">
          <div className="flex items-center gap-3">
            {/* Avatar Driver */}
            <div className="w-12 h-12 rounded-full border-[2px] border-black overflow-hidden bg-white">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driverName}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            {/* Info Driver */}
            <div className="flex flex-col">
              <span className="font-extrabold text-black text-lg leading-tight">{driverName}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2.5 h-2.5 bg-[#22C55E] rounded-full border border-black"></div>
                <span className="text-xs font-bold text-black">Online</span>
              </div>
            </div>
          </div>
          {/* Tombol Close */}
          <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white p-1 border-[3px] border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
            <FaTimes size={20} />
          </button>
        </div>

        {/* --- BODY CHAT (Tempat Balasan) --- */}
        {/* Tinggi scrollable disesuaikan agar pas di layar HP */}
        <div className="bg-[#D1D5DB] p-4 flex flex-col gap-4 h-[50vh] md:h-[400px] overflow-y-auto">
          
          {/* Chat Masuk (Putih, Kiri) */}
          <div className="flex gap-2 items-end">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-[2px] border-black overflow-hidden flex-shrink-0 bg-white">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driverName}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white border-[2px] border-black rounded-xl rounded-bl-none px-4 py-2 min-w-[120px] max-w-[80%] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-semibold text-sm">
              Halo kak, sesuai aplikasi ya.
            </div>
          </div>

          {/* Chat Keluar (Biru, Kanan) */}
          <div className="flex gap-2 items-end flex-row-reverse">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-[2px] border-black overflow-hidden flex-shrink-0 bg-white">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mervin" alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="bg-[#A5F3FC] border-[2px] border-black rounded-xl rounded-br-none px-4 py-2 min-w-[120px] max-w-[80%] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-semibold text-sm text-right">
              Oke mas, ditunggu ya. Jangan ngebut-ngebut.
            </div>
          </div>

          {/* Chat Masuk (Putih, Kiri) */}
          <div className="flex gap-2 items-end">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-[2px] border-black overflow-hidden flex-shrink-0 bg-white">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driverName}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white border-[2px] border-black rounded-xl rounded-bl-none px-4 py-2 min-w-[120px] max-w-[80%] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-semibold text-sm">
              Siap meluncurrr! 🚀
            </div>
          </div>

        </div>

        {/* --- FOOTER CHAT (Input Pesan) --- */}
        <div className="p-3 border-t-[3px] border-black bg-white flex items-center gap-3">
          
          {/* Kolom Ketik */}
          <div className="flex-1 flex items-center border-[2px] border-black rounded-full pl-4 pr-1 py-1 bg-white">
            <input type="text" placeholder="Type a Message..." className="flex-1 outline-none text-black font-semibold bg-transparent text-sm md:text-base" />
            {/* Tombol Kirim Panah Biru */}
            <button className="bg-[#A5F3FC] p-2 border-[2px] border-black rounded-full ml-2 hover:bg-[#67E8F9] active:scale-95 transition-all flex items-center justify-center">
              <FaPaperPlane className="text-black" size={14} />
            </button>
          </div>

          {/* Ikon Kamera & Emotikon */}
          <button className="text-black hover:scale-110 active:scale-95 transition-all">
            <FaCamera size={26} />
          </button>
          <button className="text-black hover:scale-110 active:scale-95 transition-all">
            <FaSmile size={26} />
          </button>

        </div>

      </div>
    </div>
  );
};

export default PopUpChat;