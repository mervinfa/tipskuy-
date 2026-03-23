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
      <div className="grid grid-cols-4 gap-4 bg-[#D1D5DB] p-3 rounded-md border border-gray-400 mb-4 text-sm font-bold text-gray-800">
        <div className="text-center">Driver</div>
        <div>Berangkat</div>
        <div className="text-center">Durasi</div>
        <div>Tiba</div>
      </div>

      {/* List Driver */}
      <div className="flex flex-col gap-3">
        {drivers.map((driver) => (
          <div 
            key={driver.id} 
            className={`grid grid-cols-4 items-center gap-4 p-3 rounded-lg border border-gray-400 shadow-sm transition-all
              ${driver.status === 'disabled' ? 'bg-[#DCFCE7] opacity-60' : 'bg-[#D1D5DB] hover:bg-gray-300'}`}
          >
            {/* Kolom Driver */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full border-2 border-gray-400 overflow-hidden bg-white">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} 
                  alt="avatar" 
                />
              </div>
              <span className="text-xs font-bold text-gray-700">{driver.name}</span>
            </div>

            {/* Kolom Berangkat */}
            <div className="text-[10px] sm:text-xs text-gray-800">
              <p>{driver.origin}</p>
              <p className="font-bold">{driver.time}</p>
              <p>{driver.date}</p>
            </div>

            {/* Kolom Durasi */}
            <div className="text-center font-bold text-xs text-gray-800">
              {driver.duration}
            </div>

            {/* Kolom Tiba + Button */}
            <div className="flex justify-between items-center pr-2">
              <div className="text-[10px] sm:text-xs text-gray-800">
                <p>{driver.dest}</p>
                <p className="font-bold">{driver.arrival}</p>
                <p>{driver.date}</p>
              </div>
              
              {/* 2. PASANG ONCLICK DI SINI */}
              <button 
                onClick={onTitipClick}
                className="bg-[#FEF08A] border border-gray-400 text-[10px] font-bold px-4 py-1.5 rounded shadow-sm hover:bg-yellow-200 active:scale-95 transition-all"
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