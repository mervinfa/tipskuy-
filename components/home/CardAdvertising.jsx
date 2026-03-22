import Image from "next/image";

const CardAdvertising = () => {
    return(
        <main>
             <div className="grid h-full p-5 pt-10  ">
                <div className="h-full min-h-[500px] w-full border-2 border-black rounded-xl shadow-lg overflow-hidden relative group p-5">
                    <img 
                        src="/images/blog/about.png"
                        alt="Ilustrasi TipSkuy Titip Barang" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />

                    <div className="absolute top-8 right-8 z-10 max-w-lg ">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md">
                            Tipskuy!
                        </h1>
                        <p className="mt-3 text-lg md:text-xl font-bold text-white drop-shadow-md">
                            Barang Ketinggalan? TipSkuy-in Aja! <br />Titipnya Murah, <br />yang Bawa Untung
                        </p>
                    </div>

                    <button className="absolute bottom-8 left-8 bg-[#B7FF8E] border-2 border-black hover:bg-[#6FAF4F] px-8 py-4 rounded-2xl font-bold text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all z-10">
                    Coba Sekarang
                    </button>                
                </div>
             </div>
        </main>
    );
};

export default CardAdvertising;