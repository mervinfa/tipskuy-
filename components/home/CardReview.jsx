import PhotoCard from "@/components/home/PhotoCard"

const CardReview = () => {
    return (
        <main>
            <div className="px-5 pt-30 pb-5">
                <div className="bg-[#9FFFFD] border-2 border-black rounded-xl p-8 md:p-12 min-h-[50vh]">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        <div className="flex flex-col justify-center gap-6">
                            <PhotoCard />
                            <PhotoCard />
                        </div>

                        <div className="flex flex-col h-full">
                            
                            <h1 className="font-extrabold text-5xl md:text-6xl self-end mb-8">
                                Ulasan
                            </h1>
                            
                            <div className="flex-1 flex items-center justify-center">
                                <PhotoCard />
                            </div>
                            
                        </div>
                        
                    </div>
                    
                </div>
            </div>
        </main>
    );
};

export default CardReview;