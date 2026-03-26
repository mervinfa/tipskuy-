import React from 'react';

const PhotoCard= () => {
  return (
    <div className="bg-white rounded-xl border border-black p-2 m-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-[250px] h-full max-h-[150px]">
      <div className="flex gap-3">
        
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-gray-200">
            <img src="/images/avatars/profile.png" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="font-bold text-xs leading-tight">Ardi Poke</h3>
          <p className="text-xs mt-1 text-gray-800">
            Penyelamat buat si pelupa! Kunci ketinggalan di rumah, langsung beres lewat TipSkuy. Harganya murah, prosesnya sat-set sangat direkomendasikan!
          </p>
          
          <div className="flex justify-end gap-1 mt-1 text-yellow-400 text-sm">
            ⭐ ⭐ ⭐ ⭐ ⭐
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PhotoCard;