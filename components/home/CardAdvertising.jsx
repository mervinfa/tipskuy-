import Image from "next/image";

const CardAdvertising = () => {
    return(
        <main>
             <div className="grid h-full p-5 pt-10  ">
                <div className="h-full min-h-[500px] w-full border-2 border-black rounded-xl shadow-lg overflow-hidden relative group p-5">
                    <img 
                        src="https://images.unsplash.com/photo-1617155093730-a8bf47be792d?q=80&w=1000&auto=format&fit=crop"
                        alt="Ilustrasi TipSkuy Titip Barang" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <button className="absolute bottom-8 left-8 bg-[#B7FF8E] border-2 border-black hover:bg-[#6FAF4F] px-8 py-4 rounded-2xl font-bold text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all z-10">
                    Coba Sekarang
                    </button>                
                </div>
             </div>
        </main>
    );
};

export default CardAdvertising;