import React from 'react';
import { FaWhatsapp, FaTiktok, FaFacebook, FaYoutube } from "react-icons/fa";
import { Youtube, Facebook, MessageCircle, Music } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#E5E5E5] py-16 px-8 md:px-30 w-full mt-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10 md:gap-4">
        <div className="flex flex-col gap-4 items-center justify-center">
          <h1 className="font-extrabold text-5xl text-black tracking-wide">
            TipSkuy!
          </h1>
          <div className="flex gap-4 items-center mt-2">
            <a href="#" className=" flex items-center justify-center">
              <FaYoutube size={30} strokeWidth={2.5} />
            </a>
            <a href="#" className=" flex items-center justify-center">
              <FaFacebook size={30} strokeWidth={2.5} />
            </a>
            <a href="#" className=" flex items-center justify-center">
              <FaWhatsapp size={30} strokeWidth={2.5} />
            </a>
            <a href="#" className=" flex items-center justify-center">
              <FaTiktok size={30} strokeWidth={2.5} />
            </a>

          </div>
        </div>

        <div className="flex flex-col gap-2 text-gray-600 text-xl font-medium">
          <p>TipSkuyOfficial@gmail.com</p>
          <p>0896-3042-7670</p>
        </div>

        <div className="flex flex-col gap-3 text-lg">
          <h3 className="font-extrabold text-black text-xl mb-1">Navigation</h3>
          <a href="#" className="text-black hover:text-gray-500 hover:underline transition-all">Home</a>
          <a href="#" className="text-black hover:text-gray-500 hover:underline transition-all">About</a>
          <a href="#" className="text-black hover:text-gray-500 hover:underline transition-all">Content</a>
          <a href="#" className="text-black hover:text-gray-500 hover:underline transition-all">Contact</a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;