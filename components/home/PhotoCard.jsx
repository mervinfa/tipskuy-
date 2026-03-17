import React from 'react';

const PhotoCard= () => {
  return (
    // Wadah Card dengan border, rounded, dan shadow
    <div className="bg-white rounded-xl border border-black p-3 shadow-lg w-full max-w-sm">
      <div className="flex gap-4">
        
        {/* Bagian Avatar (Kiri) */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full border-2 border-black overflow-hidden bg-gray-200">
            {/* Ganti src dengan link gambar avatar */}
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ardi" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Bagian Teks & Bintang (Kanan) */}
        <div className="flex flex-col">
          <h3 className="font-bold text-lg leading-tight">Ardi Poke</h3>
          <p className="text-sm mt-2 text-gray-800">
            Penyelamat buat si pelupa! Kunci ketinggalan di rumah, langsung beres lewat TipSkuy. Harganya murah, prosesnya sat-set, dan yang bantu bawain ramah banget. Sangat direkomendasikan!
          </p>
          
          {/* Bintang */}
          <div className="flex justify-end gap-1 mt-3 text-yellow-400 text-lg">
            ⭐ ⭐ ⭐ ⭐ ⭐
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PhotoCard;