import React from 'react';

const InputR = () => {
  return (
    <div className='container overflow-y-auto'>
      <div className="w-full md:h-min-screen flex flex-col justify-center p-8 lg:p-12 bg-white">
        <div className="mb-3">
          <h2 className="text-3xl font-black text-black">Register</h2>
          <p className="text-gray-400 font-medium text-sm mt-1">
            Create an account to get started.
          </p>
        </div>

        <form className="space-y-3">

          <input 
            type="text" 
            placeholder="Full Name" 
            className="w-full p-3 bg-[#f3f4f6] border-2 border-transparent focus:border-black rounded-lg outline-none transition-all"
          />
 
          <input 
            type="email" 
            placeholder="E-mail" 
            className="w-full p-3 bg-[#f3f4f6] border-2 border-transparent focus:border-black rounded-lg outline-none transition-all"
          />
          <div className="relative">
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full p-3 bg-[#f3f4f6] border-2 border-transparent focus:border-black rounded-lg outline-none transition-all"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-[#ffb443] border-2 border-black rounded-md shadow-[2px_2px_0px_black]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div className="relative">
            <input 
              type="password" 
              placeholder="Confirm Password" 
              className="w-full p-3 bg-[#f3f4f6] border-2 border-transparent focus:border-black rounded-lg outline-none transition-all"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-[#ffb443] border-2 border-black rounded-md shadow-[2px_2px_0px_black]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <button className="w-full py-3 mt-4 bg-[#ff9248] text-black font-bold border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
            Register
          </button>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or, Register with</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="space-y-2">
            <button className="w-full py-2.5 border-2 border-gray-200 rounded-lg flex items-center justify-center gap-2 font-bold text-sm hover:bg-gray-50 transition-colors">
              <span>G</span> Google
            </button>
            <button className="w-full py-2.5 border-2 border-gray-200 rounded-lg flex items-center justify-center gap-2 font-bold text-sm hover:bg-gray-50 transition-colors">
              <span>f</span> Facebook
            </button>
          </div>

          <p className="text-center text-sm font-medium mt-4">
            Already have an account? <a href="/auth/login" className="text-[#ff9248] font-bold hover:underline">Login.</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default InputR;