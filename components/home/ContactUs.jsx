import React from 'react';
import { FaWhatsapp, FaTiktok, FaFacebook, FaYoutube } from "react-icons/fa";

const ContactUs = () => {
  return (
    <div className="relative w-full mt-10 md:mt-16">
      
      <div className="absolute inset-y-0 left-[-50vw] right-[-50vw] bg-[#FFEBEB]"></div>

      <div className="relative w-full flex flex-col items-center py-16">
        
        <h2 className="font-extrabold text-5xl mb-12 text-black">
          Contact Us
        </h2>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          
          <div className="flex flex-col gap-4">
            
            <div className="flex bg-[#F5F5F5] border border-gray-200 rounded-md overflow-hidden h-12 shadow-sm">
              <div className="bg-[#DFDFDF] w-24 flex items-center justify-center text-sm font-medium text-gray-500">
                Name
              </div>
              <input type="text" className="flex-1 bg-transparent px-4 outline-none text-gray-700" />
            </div>

            <div className="flex bg-[#F5F5F5] border border-gray-200 rounded-md overflow-hidden h-12 shadow-sm">
              <div className="bg-[#DFDFDF] w-24 flex items-center justify-center text-sm font-medium text-gray-500">
                E-mail
              </div>
              <input type="email" className="flex-1 bg-transparent px-4 outline-none text-gray-700" />
            </div>

            <div className="flex bg-[#F5F5F5] border border-gray-200 rounded-md overflow-hidden flex-1 shadow-sm min-h-[180px]">
              <div className="bg-[#DFDFDF] w-24 flex items-start justify-center pt-4 text-sm font-medium text-gray-500 text-center leading-tight">
                Your<br />Message
              </div>
              <textarea className="flex-1 bg-transparent p-4 outline-none resize-none text-gray-700"></textarea>
            </div>

          <button className="bg-[#DFDFDF] hover:bg-[#6FAF4F] border-[3px] border-black text-black font-extrabold text-lg py-3 px-10 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] self-start mt-2">
              Submit
            </button>

          </div>

          <div className="bg-[#F5F5F5] border border-gray-200 rounded-md p-6 flex justify-center items-center shadow-sm">
            
            <div className="border-[3px] border-black rounded-md w-full h-full flex bg-white px-4 md:px-8">
              
              <div className="flex flex-col gap-6 items-center border-r-[3px] border-black pr-6 py-8 justify-center">
                <FaYoutube size={36} strokeWidth={2.5} className="text-black" />
                <FaFacebook size={36} strokeWidth={2.5} className="text-black" />
                <FaTiktok size={34} strokeWidth={2.5} className="text-black" />
                <FaWhatsapp size={36} strokeWidth={2.5} className="text-black" />
              </div>

              <div className="flex flex-col gap-6 justify-center w-full items-center">
                <p className="font-bold text-xl md:text-3xl text-black leading-none flex items-center h-[36px]">tipskuy official</p>
                <p className="font-bold text-xl md:text-3xl text-black leading-none flex items-center h-[36px]">tipskuy official</p>
                <p className="font-bold text-xl md:text-3xl text-black leading-none flex items-center h-[36px]">tipskuy official</p>
                <p className="font-bold text-xl md:text-3xl text-black leading-none flex items-center h-[36px]">+6288888888</p>
              </div>
              
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactUs;