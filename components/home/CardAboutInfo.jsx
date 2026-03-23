import React from 'react';

const CardAboutInfo = () => {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-6 mt-13">
      
      <h1 className="font-extrabold text-5xl md:text-5xl text-black">
        About
      </h1>

      <div className="w-full bg-[#A3EFFF] border-2 border-gray-600 rounded-xl flex flex-col md:flex-row justify-between overflow-hidden shadow-sm p-5">
        
        <div className="p-6 md:p-8 w-full md:w-3/5 flex flex-col justify-center items-center md:items-start">
          <h2 className="font-extrabold text-2xl md:text-4xl text-black mb-4 ">
            Tentang Tipskuy!
          </h2>
          <hr className='w-full md:w-[340px] border-t-[4px] md:border-t-[6px] border-black mb-4 md:mb-6'/>
          <p className="text-black text-sm md:text-xl leading-relaxed">
            TipSkuy! hadir sebagai solusi cerdas untuk kamu yang sering lupa. Melalui sistem 
            pengantaran berbasis komunitas, barangmu yang tertinggal akan sampai kembali ke 
            tanganmu aman, cepat, dan biaya yang sangat terjangkau.
          </p>
        </div>

        {/* Bagian Gambar (Kanan) */}
        <div className="w-full md:w-2/5 flex items-center justify-center">
          <img 
            src="/images/blog/aboutinfo.png" 
            alt="Ilustrasi Tipskuy" 
            className="w-full max-w-[500px] h-auto object-contain"
          />
        </div>
      </div>

      <h2 className="font-extrabold text-5xl md:text-5xl text-black mt-3">
        Visi & Misi Kami
      </h2>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-4">
        
        <div className="w-full bg-[#FFA3D4] border-2 border-gray-600 rounded-xl shadow-sm flex flex-col p-5 md:p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white border border-gray-400 p-2 rounded-lg">
              <img src="https://cdn-icons-png.flaticon.com/512/1161/1161388.png" alt="Icon Aman" className="w-8 h-8 object-contain" />
            </div>
            <h3 className="font-extrabold text-xl md:text-2xl text-black">Aman</h3>
          </div>
          <p className="text-black font-medium text-md md:text-xl leading-snug">
            Keamanan Utama. Setiap pengantar diverifikasi.
          </p>
        </div>

        <div className="w-full bg-[#FFF89A] border-2 border-gray-600 rounded-xl shadow-sm flex flex-col p-5 md:p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white border border-gray-400 p-2 rounded-lg">
              <img src="https://cdn-icons-png.flaticon.com/512/3284/3284615.png" alt="Icon Cepat" className="w-8 h-8 object-contain" />
            </div>
            <h3 className="font-extrabold text-xl md:text-2xl text-black">Cepat</h3>
          </div>
          <p className="text-black font-medium text-md md:text-xl leading-snug">
            Kecepatan Komunitas. Temukan yang searah, barang sampai lebih cepat.
          </p>
        </div>

        <div className="w-full bg-[#B9FF9A] border-2 border-gray-600 rounded-xl shadow-sm flex flex-col p-5 md:p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white border border-gray-400 p-2 rounded-lg">
              <img src="https://cdn-icons-png.flaticon.com/512/2953/2953363.png" alt="Icon Hemat" className="w-8 h-8 object-contain" />
            </div>
            <h3 className="font-extrabold text-xl md:text-2xl text-black">Hemat</h3>
          </div>
          <p className="text-black font-medium text-md md:text-xl leading-snug">
            Biaya Transparan. Lebih hemat karena searah.
          </p>
        </div>

      </div>

    </div>
  );
};

export default CardAboutInfo;