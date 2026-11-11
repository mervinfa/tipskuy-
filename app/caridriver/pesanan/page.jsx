import React from "react";
import Navbar from "@/components/Navbar";
import { PesananSayaApp } from "@/components/caridriver/PesananSayaApp";

const PesananSaya = () => {
  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 pb-12 pt-28 md:px-6 md:pt-32">
        <PesananSayaApp />
      </main>
    </div>
  );
};

export default PesananSaya;
