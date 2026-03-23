import PhotoCard from "@/components/home/PhotoCard"

const CardReview = () => {
    return (
        <div className="w-full h-full pt-5 flex flex-col">
            
            <div className="flex-1 bg-[#9FFFFD] border-2 border-black rounded-xl p-1  flex flex-col justify-center items-center">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center w-full max-w-xl">
                    
                    <div className="flex flex-col gap-1 justify-center items-center md:items-start">
                        <PhotoCard />
                        <PhotoCard />
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 h-full">
                        
                        <h1 className="font-extrabold text-3xl md:text-4xl text-black">
                            Ulasan
                        </h1>
                        
                        <div className="w-full flex justify-center md:justify-end">
                            <PhotoCard />
                        </div>
                        
                    </div>
                    
                </div>
                
            </div>
            
        </div>
    );
};

export default CardReview;