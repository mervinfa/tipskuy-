const CardTips = () => {
    return (
        <main>
             <div className="grid h-[50vh] px-5 pt-10">
                {/* Tambahkan h-full di sini agar menyesuaikan tinggi 50vh */}
                <div className="flex flex-col h-full"> 
                    
                    {/* Kotak Pink Utama */}
                    <div className="flex-1 bg-[#FF9FD2] border-2 border-black rounded-xl p-6 flex flex-col items-center justify-center">
                        
                        {/* Judul */}
                        <h1 className="font-extrabold text-5xl mb-6 tracking-wide">
                            Tips & Trick
                        </h1>
                        
                        {/* Wadah 3 Kartu (Grid 3 Kolom) */}
                        <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                            
                            {/* --- Kartu 1 --- */}
                            <div className="bg-white border-2 border-black rounded-xl p-3 flex flex-col items-center shadow-md">
                                {/* Kotak Gambar (Aspek Rasio 3:4) */}
                                <div className="w-full aspect-[3/4] bg-gray-200 border-2 border-black rounded-lg mb-3 overflow-hidden">
                                    {/* Masukkan tag <img /> kamu di sini nanti */}
                                </div>
                                <p className="font-bold text-lg text-center pb-1">
                                    Foto Barang
                                </p>
                            </div>

                            {/* --- Kartu 2 --- */}
                            <div className="bg-white border-2 border-black rounded-xl p-3 flex flex-col items-center shadow-md">
                                <div className="w-full aspect-[3/4] bg-gray-200 border-2 border-black rounded-lg mb-3 overflow-hidden">
                                    {/* Masukkan tag <img /> kamu di sini nanti */}
                                </div>
                                <p className="font-bold text-lg text-center pb-1">
                                    Atur Penjemputan
                                </p>
                            </div>

                            {/* --- Kartu 3 --- */}
                            <div className="bg-white border-2 border-black rounded-xl p-3 flex flex-col items-center shadow-md">
                                <div className="w-full aspect-[3/4] bg-gray-200 border-2 border-black rounded-lg mb-3 overflow-hidden">
                                    {/* Masukkan tag <img /> kamu di sini nanti */}
                                </div>
                                <p className="font-bold text-lg text-center pb-1">
                                    Sampai Tujuan
                                </p>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
};

export default CardTips;