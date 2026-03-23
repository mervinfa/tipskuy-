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
    <div id="main-page" className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-1">
        <Navbar/> 
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 mt-14 md:mt-16">
          <CardAdvertising/>
          <div className="flex flex-col">
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