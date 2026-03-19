"use client";
import React, { useState } from 'react';

const CardAbout = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800"
  ];

  return (
    <div className="-mx-4 md:-mx-6 w-screen w-full bg-[#FFF1F1] border-2 border-gray-100 rounded-2xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-sm">
      
      <div className="w-full md:w-1/2 flex flex-col items-center text-center">
        <p className="text-[#5B6B7E] text-xl md:text-2xl font-medium leading-relaxed mb-8">
          TipSkuy hadir sebagai solusi cerdas untuk kamu yang sering lupa. Melalui sistem pengantaran berbasis komunitas, barangmu yang tertinggal akan sampai kembali ke tanganmu dengan aman, cepat, dan biaya yang sangat terjangkau.
        </p>
        <hr className="w-full border-t-2 border-gray-300 mb-6" />
        <p className="text-black font-semibold text-lg">
          Bawa Untung bagi yang Antar, Tenang bagi yang Titip.
        </p>
      </div>

      <div className="w-full md:w-1/2">
        <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <img 
            src={images[currentIndex]} 
            alt="Slider" 
            className="w-full aspect-video object-cover"
          />
          <div className="flex h-3 w-full">
            {images.map((_, i) => (
              <div 
                key={i}
                className={`flex-1 ${i === currentIndex ? 'bg-[#00E5FF]' : 'bg-[#D1F9FF]'} transition-colors duration-500`}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CardAbout;