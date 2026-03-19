import Link from "next/link";

export default function Navbar(){
    
    const menuList = [
        { name: "Home", path: "/"},
        { name: "About", path: "/"},
        { name: "Content", path: "/"},
        { name: "Contact", path: "/"}
    ];

    return (
        <main>
            <div className="bg-[#FFFFAF] rounded-full p-3 flex items-center justify-between">
                <h1 className="font-bold text-3xl pl-10">Tipskuy!</h1>

                <div className="flex flex gap-8 font-bold text-lg">
                    {menuList.map((item, index) => (
                        <a 
                        href={item.path}
                        key={index}
                        >
                            {item.name}
                        </a>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Link href="/auth/register"> 
                        <button className="bg-[#FFAE4C] hover:bg-[#FF9B51] px-7 py-4 rounded-full border-2 border-black">
                            Register
                        </button>
                    </Link>

                    <Link href="/auth/login">     
                        <button className="bg-[#9EF7FF] hover:bg-[#5A7ACD] px-9 py-4 rounded-full border-2 border-black">
                            Login
                        </button>
                    </Link>
                </div>

            </div>


        </main>
    )
}