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
                    <button className="bg-[#FFAE4C] px-7 py-4 rounded-full border-1">Register</button>
                    <button className="bg-[#9EF7FF] px-9 py-4 rounded-full border-1">Login</button>
                </div>

            </div>


        </main>
    )
}