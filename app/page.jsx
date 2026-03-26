import Navbar from "@/components/Navbar";
import CardAdvertising from "@/components/home/CardAdvertising"
import CardTips from "@/components/home/CardTips"
import CardReview from "@/components/home/CardReview"
import Footer from "@/components/Footer"
import CardAbout from "@/components/home/CardAbout"
import CardAboutInfo from "@/components/home/CardAboutInfo"
import ContactUs from "@/components/home/ContactUs"
import Advertising from "@/components/home/Advertising"

export default function Home() {
  return (
    <div id="main-page" className="min-h-screen bg-white flex flex-col overflow-x-hidden scroll-smooth">
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pt-4 pb-0 md:px-6 md:pt-6 md:pb-0 flex flex-col gap-1">
        <Navbar/> 
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 mt-14 md:mt-16">
          <CardAdvertising/>
          <div className="flex flex-col">
            <CardTips/>
            <CardReview/>
          </div>
        </div>
        <Advertising/>

        <div id="about" className="scroll-mt-28 md:scroll-mt-14">
            <CardAboutInfo />
        </div>

        <div className="">
          <CardAbout />
        </div>
        
        <div id="contact" className="scroll-mt-28 md:scroll-mt-32">
          <ContactUs />
        </div>

      </main>
      <Footer/>

      
    </div>
  );
}