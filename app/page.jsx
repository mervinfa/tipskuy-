import Navbar from "@/components/Navbar";
import CardAdvertising from "@/components/home/CardAdvertising"
import CardTips from "@/components/home/CardTips"
import CardReview from "@/components/home/CardReview"

export default function Home() {
  return (
    <main id="main-page" className="min-h-screen bg-white p-4 md:p-6 flex flex-col gap-1">
      <Navbar/> 
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-1">
        <CardAdvertising/>
        <div className="flex flex-col gap-3">
          <CardTips/>
          <CardReview/>
        </div>

      </div>
    </main>
  );
}
