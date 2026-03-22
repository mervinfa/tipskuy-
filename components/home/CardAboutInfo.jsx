import React from 'react';

const CardAboutInfo = () => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 p-6 mt-10">
      
      {/* Judul About */}
      <h1 className="font-extrabold text-3xl md:text-4xl text-black">
        About
      </h1>

      {/* --- BANNER UTAMA --- */}
      {/* Ubah menjadi flex-row agar teks di kiri dan gambar di kanan */}
      <div className="w-full bg-[#A3EFFF] border border-gray-600 rounded-xl flex flex-col md:flex-row justify-between overflow-hidden shadow-sm">
        
        {/* Bagian Teks (Kiri) */}
        <div className="p-6 md:p-8 w-full md:w-3/5 flex flex-col justify-center">
          <h2 className="font-extrabold text-2xl md:text-3xl text-black mb-4">
            Tentang Tipskuy!
          </h2>
          <p className="text-black font-medium text-sm md:text-base leading-relaxed">
            TipSkuy! hadir sebagai solusi cerdas untuk kamu yang sering lupa. Melalui sistem 
            pengantaran berbasis komunitas, barangmu yang tertinggal akan sampai kembali ke 
            tanganmu aman, cepat, dan biaya yang sangat terjangkau.
          </p>
        </div>

        {/* Bagian Gambar (Kanan) */}
        <div className="w-full md:w-2/5 flex items-end justify-end pt-4 md:pt-0">
          <img 
            src="https://cdni.iconscout.com/illustration/premium/thumb/man-driving-car-illustration-download-in-svg-png-gif-file-formats--vehicle-transportation-transport-pack-people-illustrations-4982635.png" 
            alt="Ilustrasi Tipskuy" 
            className="w-full max-w-[300px] h-auto object-contain"
          />
        </div>
      </div>

      {/* Judul Visi & Misi */}
      <h2 className="font-extrabold text-2xl md:text-3xl text-black mt-6">
        Visi & Misi Kami
      </h2>

      {/* --- GRID 3 CARD --- */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Aman */}
        <div className="w-full bg-[#FFA3D4] border border-gray-600 rounded-xl shadow-sm flex flex-col p-5 md:p-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white border border-gray-400 p-2 rounded-lg">
              <img src="https://cdn-icons-png.flaticon.com/512/1161/1161388.png" alt="Icon Aman" className="w-8 h-8 object-contain" />
            </div>
            <h3 className="font-extrabold text-xl md:text-2xl text-black">Aman</h3>
          </div>
          <p className="text-black font-medium text-sm md:text-base leading-snug">
            Keamanan Utama. Setiap pengantar diverifikasi.
          </p>
        </div>

        {/* Card 2: Cepat */}
        <div className="w-full bg-[#FFF89A] border border-gray-600 rounded-xl shadow-sm flex flex-col p-5 md:p-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white border border-gray-400 p-2 rounded-lg">
              <img src="https://cdn-icons-png.flaticon.com/512/3284/3284615.png" alt="Icon Cepat" className="w-8 h-8 object-contain" />
            </div>
            <h3 className="font-extrabold text-xl md:text-2xl text-black">Cepat</h3>
          </div>
          <p className="text-black font-medium text-sm md:text-base leading-snug">
            Kecepatan Komunitas. Temukan yang searah, barang sampai lebih cepat.
          </p>
        </div>

        {/* Card 3: Hemat */}
        <div className="w-full bg-[#B9FF9A] border border-gray-600 rounded-xl shadow-sm flex flex-col p-5 md:p-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white border border-gray-400 p-2 rounded-lg">
              <img src="https://cdn-icons-png.flaticon.com/512/2953/2953363.png" alt="Icon Hemat" className="w-8 h-8 object-contain" />
            </div>
            <h3 className="font-extrabold text-xl md:text-2xl text-black">Hemat</h3>
          </div>
          <p className="text-black font-medium text-sm md:text-base leading-snug">
            Biaya Transparan. Lebih hemat karena searah.
          </p>
        </div>

      </div>

    </div>
  );
};

export default CardAboutInfo;