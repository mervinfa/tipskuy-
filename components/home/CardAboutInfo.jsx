import React from 'react';

const CardAboutInfo = () => {
  return (
    // Wadah utama yang membatasi lebar maksimal agar tidak terlalu melar di layar besar
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 p-6 mt-10">
      
      {/* Judul Utama */}
      <h1 className="font-extrabold text-3xl md:text-4xl text-black">
        About
      </h1>

      {/* Kotak Besar Atas (Hijau) */}
      {/* Perhatikan border berwarna biru sesuai gambarmu */}
      <div className="w-full bg-[#BAFF8C] border-2 border-[#00A3FF] rounded-xl p-6 md:p-8 min-h-[200px] shadow-sm">
        <h2 className="font-bold text-2xl md:text-3xl text-black">
          Tentang Tipskuy!
        </h2>
        {/* Kamu bisa menambahkan paragraf teks deskripsi panjang di sini nantinya */}
      </div>

      {/* Wadah 3 Kotak Bawah (Grid) */}
      {/* grid-cols-1 di HP agar menumpuk ke bawah, grid-cols-3 di PC agar sejajar */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kotak 1: Pink */}
        <div className="w-full bg-[#FFA3D4] border border-gray-600 rounded-xl min-h-[140px] shadow-sm flex items-center justify-center p-4">
            {/* Isi konten kotak pink di sini */}
        </div>

        {/* Kotak 2: Kuning */}
        <div className="w-full bg-[#FFF89A] border border-gray-600 rounded-xl min-h-[140px] shadow-sm flex items-center justify-center p-4">
            {/* Isi konten kotak kuning di sini */}
        </div>

        {/* Kotak 3: Biru Muda / Cyan */}
        <div className="w-full bg-[#9AFFFF] border border-gray-600 rounded-xl min-h-[140px] shadow-sm flex items-center justify-center p-4">
            {/* Isi konten kotak biru muda di sini */}
        </div>

      </div>

    </div>
  );
};

export default CardAboutInfo;