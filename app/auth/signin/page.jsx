import React from 'react';

const Signin = () => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-white bg-[radial-gradient(#c5c6c7_1.5px,transparent_1.5px)] [background-size:24px_24px] p-4">
      
      {/* 1. Menghapus min-w-[900px] agar tidak overflow di mobile.
          2. Menggunakan w-full dan max-w-4xl untuk membatasi lebar di desktop.
          3. Padding disesuaikan (p-6 di mobile, p-10 di desktop).
      */}
      <div className="flex w-full max-w-[900px] min-h-[500px] md:min-h-[640px] bg-[#FEFFB6] border border-black rounded-xl overflow-hidden shadow-2xl p-6 md:p-10 flex-col items-center justify-center">
        
        <h1 className="text-2xl font-bold mb-8 text-black text-center">Welcome To TipSkuy!</h1>
        
        <div className="profile mb-8">
          <img 
            src="/Assets/profile.png" 
            alt="Profile" 
            className="w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-black object-cover"
          />
        </div>

        {/* 1. flex-col secara default (mobile).
            2. md:flex-row untuk layar tablet/desktop ke atas.
        */}
        <div className="flex flex-col md:flex-row w-full gap-4 max-w-md md:max-w-none">
          <a 
            href="/auth/login" 
            className="flex-1 bg-[#a8c5ff] py-3 rounded-md border border-black font-medium hover:bg-[#97b4f0] transition-colors text-center block"
          >
            Login
          </a>
          <a 
            href="/auth/register" 
            className="flex-1 bg-[#FFA458] py-3 rounded-md border border-black font-medium hover:bg-[#e8934d] transition-colors text-center block"
          >
            Register
          </a>
        </div>

      </div>
    </div>
  );
};

export default Signin;