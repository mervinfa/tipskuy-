import Image from 'next/image'

export default function Auth() { 
    return (
        <main className="flex items-center p-5 gap-3"> 
            <Image 
                src="/midlogo.png" 
                alt="Logo" 
                width={50} 
                height={30} 
            />
            <h1 className="text-xl font-bold p-1">Login</h1>
        </main>
    )
}