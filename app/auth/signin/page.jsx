import React from 'react';

const Signin = () => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-white bg-[radial-gradient(#c5c6c7_1.5px,transparent_1.5px)] [background-size:24px_24px]">
      
      <div className="flex w-full max-w-lg min-h-[640px] min-w-[900px] bg-[#FEFFB6] border border-black rounded-xl overflow-hidden shadow-2xl mx-4 p-10 flex-col items-center justify-center">
        
        <h1 className="text-2xl font-bold mb-8 text-black">Welcome To TipSkuy!</h1>
        
        {/* Container Gambar */}
        <div className="profile mb-8">
          <img 
            src="/Assets/profile.png" 
            alt="Profile" 
            className="w-48 h-48 rounded-full border-2 border-black object-cover"
          />
        </div>

        {/* Container Tombol: Login di Kiri, Register di Kanan */}
        <div className="flex flex-row w-full gap-4">
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