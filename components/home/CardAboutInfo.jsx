import React from 'react';

const CardAboutInfo = () => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 p-6 mt-10">
      
      <h1 className="font-extrabold text-3xl md:text-4xl text-black">
        About
      </h1>

      <div className="w-full bg-[#BAFF8C] border-2 border-[#00A3FF] rounded-xl p-6 md:p-8 min-h-[200px] shadow-sm">
        <h2 className="font-bold text-2xl md:text-3xl text-black">
          Tentang Tipskuy!
        </h2>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="w-full bg-[#FFA3D4] border border-gray-600 rounded-xl min-h-[140px] shadow-sm flex items-center justify-center p-4">
        </div>

        <div className="w-full bg-[#FFF89A] border border-gray-600 rounded-xl min-h-[140px] shadow-sm flex items-center justify-center p-4">
        </div>

        <div className="w-full bg-[#9AFFFF] border border-gray-600 rounded-xl min-h-[140px] shadow-sm flex items-center justify-center p-4">
        </div>

      </div>

    </div>
  );
};

export default CardAboutInfo;