import React from 'react';
import InputL from '@/components/InputL';

const Login = () => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-white bg-[radial-gradient(#e5e7eb_2px,transparent_2px)] [background-size:32px_32px]">
      
      {/* CARD UTAMA */}
      <div className="flex w-full max-w-4xl h-[550px] bg-white border-2 rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] mx-4">
        
        {/* KOLOM KIRI (Welcome Section) */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-[#fefc99] p-10 border-r-2 ">
          <h1 className="text-2xl font-black mb-12 text-black text-center">
            Welcome To TipSkuy!
          </h1>
          
          {/* Ilustrasi Mobil/Karakter Simple */}
          <div className="relative w-32 h-12 bg-[#ff9248] border-[3px] border-black rounded-full">
            <div className="absolute -bottom-3 -left-1 w-10 h-10 bg-[#e5e7eb] border-[3px] border-black rounded-full shadow-[2px_2px_0px_black]"></div>
            <div className="absolute -bottom-3 -right-1 w-10 h-10 bg-[#e5e7eb] border-[3px] border-black rounded-full shadow-[2px_2px_0px_black]"></div>
          </div>
        </div>
        
      <InputL />

      </div>
    </div>
  );
};

export default Login;