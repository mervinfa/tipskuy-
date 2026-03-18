import Navbar from "@/components/Navbar";
import CardAdvertising from "@/components/home/CardAdvertising"
import CardTips from "@/components/home/CardTips"
import CardReview from "@/components/home/CardReview"
import Footer from "@/components/Footer"
import CardAbout from "@/components/home/CardAbout"
import CardAboutInfo from "@/components/home/CardAboutInfo"
import ContactUs from "@/components/home/ContactUs"

export default function Home() {
  return (
    <div id="main-page" className="min-h-screen bg-white flex flex-col">
      
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-1">
        <Navbar/> 
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-1 mt-1">
          <CardAdvertising/>
          <div className="flex flex-col gap-3">
            <CardTips/>
            <CardReview/>
          </div>
        </div>
        <div className="">
          <CardAbout />
        </div>

          <CardAboutInfo />
          <ContactUs />

      </main>

      <Footer/>
      
    </div>
  );
}