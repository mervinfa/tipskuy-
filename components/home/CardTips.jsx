const CardTips = () => {
    return (
        <div className="w-full h-full pt-10">
            <div className="flex flex-col h-full"> 
                
                <div className="flex-1 bg-[#FF9FD2] border-2 border-black rounded-xl p-6 flex flex-col items-center justify-center">
                    
                    <h1 className="font-extrabold text-4xl md:text-5xl mb-6 tracking-wide text-center text-black">
                        Panduan Titip
                    </h1>
                    
                    <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-xl">
                        
                        {[
                            { title: "Foto Barang", img: "/images/blog/foto-barang.png" },
                            { title: "Atur Penjemputan", img: "/images/blog/atur-penjemputan.png" },
                            { title: "Sampai Tujuan", img: "/images/blog/sampai-tujuan.png" }
                        ].map((item, index) => (
                            
                            <div key={index} className="bg-white border-2 border-black rounded-xl p-2 flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                
                                <div className="w-full aspect-[4/5] bg-gray-200 border-2 border-black rounded-lg mb-2 overflow-hidden">
                                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                
                                <p className="font-bold text-xs md:text-sm text-center pb-1 text-black">
                                    {item.title}
                                </p>
                            </div>

                        ))}

                    </div>

                </div>
            </div>
        </div>
    );
};

export default CardTips;