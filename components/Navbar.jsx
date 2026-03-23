import Link from "next/link";

export default function Navbar(){
    
    const menuList = [
        { name: "Home", path: "/"},
        { name: "About", path: "#about"},
        { name: "Cari Driver", path: "/caridriver"},
        { name: "Contact", path: "#contact"}
    ];

    return (
        <header className="fixed top-4 left-4 right-4 md:left-6 md:right-6 z-50">
            <div className="bg-[#FFFFAF] rounded-full p-3 flex items-center justify-between">
                <h1 className="font-extrabold text-4xl pl-10">Tipskuy!</h1>

                <div className="flex flex gap-8 font-extrabold text-2xl">
                    {menuList.map((item, index) => (
                        <Link 
                        href={item.path}
                        key={index}
                        className="hover:text-[#FFAE4C] transition-colors"
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                <div className="flex gap-2 font-bold">
                    <Link href="/auth/register"> 
                        <button className="bg-[#FFAE4C] hover:bg-[#FF9B51] px-7 py-4 rounded-full border-2 border-black">
                            Register
                        </button>
                    </Link>

                    <Link href="/auth/login">     
                        <button className="bg-[#9EF7FF] hover:bg-[#5A7ACD] px-9 py-4 rounded-full border-2 border-black">
                            Log in
                        </button>
                    </Link>
                </div>

            </div>


        </header>
    )
}