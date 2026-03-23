"use client"; 
import React, { useState } from 'react';
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa"; 
export default function Navbar(){
    const [isOpen, setIsOpen] = useState(false);
    
    const handleScroll = (e, path) => {
        if (path.includes('#')) {
            const id = path.split('#')[1]; 
            const element = document.getElementById(id);
            if (element) {
                e.preventDefault(); 
                element.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
                setIsOpen(false); 
            }
        } else {
            setIsOpen(false);
        }
    };

    const menuList = [
        { name: "Home", path: "/#main-page"},
        { name: "About", path: "/#about"},
        { name: "Cari Driver", path: "/caridriver"},
        { name: "Contact", path: "/#contact"}
    ];

    return (
        <header className="fixed top-4 left-4 right-4 md:left-6 md:right-6 z-50">
            <div className="bg-[#FFFFAF] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full p-2 md:p-3 flex items-center justify-between relative z-50">
                
                <h1 className="font-extrabold text-2xl md:text-4xl pl-4 md:pl-10 text-black">Tipskuy!</h1>

                <div className="hidden md:flex gap-8 font-extrabold text-2xl">
                    {menuList.map((item, index) => (
                        <Link 
                        href={item.path}
                        key={index}
                        onClick={(e) => handleScroll(e, item.path)}
                        className="hover:text-[#FFAE4C] transition-colors text-black"
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-2 md:gap-4 pr-2 md:pr-0">
                    
                    <div className="hidden sm:flex gap-2 font-bold">
                        <Link href="/auth/register"> 
                            <button className="bg-[#FFAE4C] hover:bg-[#FF9B51] px-4 py-2 md:px-7 md:py-4 rounded-full border-2 border-black text-sm md:text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
                                Register
                            </button>
                        </Link>
                    </div>

                    <div className="flex font-bold">
                        <Link href="/auth/login">     
                            <button className="bg-[#9EF7FF] hover:bg-[#5A7ACD] px-5 py-2 md:px-9 md:py-4 rounded-full border-2 border-black text-sm md:text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
                                Log in
                            </button>
                        </Link>
                    </div>

                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden flex items-center justify-center p-2 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black transition-transform active:scale-95"
                    >
                        {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                    </button>

                </div>
            </div>

            {isOpen && (
                <div className="md:hidden absolute top-[110%] left-0 right-0 bg-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200">
                    
                    <div className="flex flex-col">
                        {menuList.map((item, index) => (
                            <Link 
                                href={item.path}
                                key={index}
                                onClick={() => setIsOpen(false)} 
                                className="font-extrabold text-xl text-black py-4 px-6 border-b-2 border-black hover:bg-[#FFFFAF] transition-colors"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    <div className="sm:hidden p-4 bg-[#E5E5E5] flex flex-col">
                        <Link href="/auth/register" onClick={() => setIsOpen(false)}> 
                            <button className="w-full bg-[#FFAE4C] hover:bg-[#FF9B51] py-3 rounded-full border-2 border-black text-base font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
                                Register
                            </button>
                        </Link>
                    </div>

                </div>
            )}

        </header>
    );
}