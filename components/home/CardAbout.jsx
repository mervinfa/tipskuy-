"use client";

import React, { useState } from 'react';

const CardAbout = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const images = [
    "https://images.unsplash.com/photo-1617155093730-a8bf47be792d?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop"
  ];

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; 
    const isRightSwipe = distance < -50; 

    if (isLeftSwipe && currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1); 
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1); 
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="w-full flex justify-center p-5">
      
      <div className="bg-[#FFFBFB] border-2 border-gray-200 rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 w-full shadow-sm">
        
        <div className="w-full md:w-1/2 flex flex-col justify-center text-center px-2 md:px-6">
          <p className="text-slate-600 text-lg font-bold leading-relaxed mb-6">
            TipSkuy hadir sebagai solusi cerdas untuk kamu yang sering lupa. Melalui sistem pengantaran berbasis komunitas, barangmu yang tertinggal akan sampai kembali ke tanganmu dengan aman, cepat, dan biaya yang sangat terjangkau.
          </p>
          
          <hr className="w-full border-t-2 border-gray-400 mb-4" />
          
          <p className="text-slate-800 text-lg">
            Bawa Untung bagi yang Antar, Tenang bagi yang Titip.
          </p>
        </div>


        <div className="w-full md:w-1/2 flex flex-col">
          
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-md bg-white">
            
            <div 
              className="relative w-full aspect-video overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="flex w-full h-full transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {images.map((img, index) => (
                  <img 
                    key={index} 
                    src={img} 
                    alt={`Slide ${index + 1}`} 
                    className="w-full h-full object-cover flex-shrink-0 cursor-grab active:cursor-grabbing" 
                  />
                ))}
              </div>
            </div>

            <div className="flex w-full h-3">
              {images.map((_, index) => (
                <div 
                  key={index} 
                  onClick={() => setCurrentIndex(index)} 
                  className={`flex-1 transition-colors duration-300 cursor-pointer ${
                    currentIndex === index ? 'bg-[#00E5FF]' : 'bg-[#C2F7FF]'
                  }`}
                />
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CardAbout;