const CardTips = () => {
    return (
        <main>
             <div className="grid h-[50vh] px-5 pt-10">
                <div className="flex flex-col h-full"> 
                    
                    <div className="flex-1 bg-[#FF9FD2] border-2 border-black rounded-xl p-6 flex flex-col items-center justify-center">
                        
                        <h1 className="font-extrabold text-5xl mb-6 tracking-wide">
                            Tips & Trick
                        </h1>
                        
                        <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                            
                            <div className="bg-white border-2 border-black rounded-xl p-3 flex flex-col items-center shadow-md">
                                <div className="w-full aspect-[3/4] bg-gray-200 border-2 border-black rounded-lg mb-3 overflow-hidden">
                                </div>
                                <p className="font-bold text-lg text-center pb-1">
                                    Foto Barang
                                </p>
                            </div>

                            <div className="bg-white border-2 border-black rounded-xl p-3 flex flex-col items-center shadow-md">
                                <div className="w-full aspect-[3/4] bg-gray-200 border-2 border-black rounded-lg mb-3 overflow-hidden">
                                </div>
                                <p className="font-bold text-lg text-center pb-1">
                                    Atur Penjemputan
                                </p>
                            </div>

                            <div className="bg-white border-2 border-black rounded-xl p-3 flex flex-col items-center shadow-md">
                                <div className="w-full aspect-[3/4] bg-gray-200 border-2 border-black rounded-lg mb-3 overflow-hidden">
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