import React from 'react';

// 1. Tambahkan props onTitipClick di sini
const DriverList = ({ onTitipClick }) => {
  // Data dummy tetap sama
  const drivers = [
    { id: 1, name: "Ardi Poke", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 2, name: "Penur", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 3, name: "Suzy", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 4, name: "Epin", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 5, name: "Perju", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "active" },
    { id: 6, name: "Bowo", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "disabled" },
    { id: 7, name: "Rey", origin: "Pekalongan", dest: "Semarang", time: "16:45", arrival: "17:55", date: "20 Maret 2026", duration: "1j 10m", status: "disabled" },
  ];

  return (
    <div className="bg-[#D1FAE5] p-6 p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg max-w-5xl mx-auto font-sans">
      {/* Header Tabel */}
      <div className="grid grid-cols-4 gap-4 bg-[#D1D5DB] p-3 rounded-md border border-gray-400 mb-4 text-xl font-bold text-gray-800">
        <div className="text-left px-8">Driver</div>
        <div>Berangkat</div>
        <div className="text-center">Durasi</div>
        <div>Tiba</div>
      </div>

      {/* List Driver */}
      <div className="flex flex-col gap-2">
        {drivers.map((driver) => (
          <div 

            className={`grid grid-cols-4 items-center gap-4 p-8 rounded-lg border border-gray-400 shadow-sm transition-all
              ${driver.status === 'disabled' ? 'bg-[#DCFCE7] opacity-60' : 'bg-[#D1D5DB] hover:bg-gray-300'}`}
          >
           {/* Kolom Driver - Diubah ke flex-col dan items-center */}
<div className="flex flex-col items-left gap-2 justify-left p-2">
  <div className="w-14 h-14 rounded-full border-2 border-black overflow-hidden bg-white shadow-sm">
    <img 
      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} 
      alt="avatar" 
      className="w-full h-full object-cover"
    />
  </div>
  <div className="text-xl font-extrabold text-black text-left p-1 leading-tight">
    {driver.name}
  </div>
</div>

            {/* Kolom Berangkat */}
            <div className="text-[10px] sm:text-xl text-gray-800">
              <p>{driver.origin}</p>
              <p className="font-bold">{driver.time}</p>
              <p>{driver.date}</p>
            </div>

            {/* Kolom Durasi */}
            <div className="text-center font-bold text-xl text-gray-800">
              {driver.duration}
            </div>

            {/* Kolom Tiba + Button */}
            <div className="flex justify-between items-center pr-2">
              <div className="text-[10px] sm:text-xl text-gray-800">
                <p>{driver.dest}</p>
                <p className="font-bold">{driver.arrival}</p>
                <p>{driver.date}</p>
              </div>
              
              {/* 2. PASANG ONCLICK DI SINI */}
              <button 
                onClick={onTitipClick}
                className="bg-[#FEF08A] border border-gray-400 text-[20px] font-bold px-4 py-1.5 rounded shadow-sm hover:bg-yellow-200 active:scale-95 transition-all"
              >
                Titip
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriverList;