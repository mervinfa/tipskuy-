import React from 'react';
import { FaTimes } from 'react-icons/fa';

const PaymentMethode = ({ isOpen, onClose, onBack, onNext }) => {
  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
      
      <div className="relative w-full max-w-4xl bg-[#FFB041] border-[4px] border-black rounded-xl p-6 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-8 max-h-[85vh] md:max-h-[100vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-1 right-3 bg-red-600 hover:bg-red-700 text-white p-1 border-[3px] border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          <FaTimes size={24} />
        </button>

        <div className="flex flex-col gap-4 w-full md:w-1/2 mt-8 md:mt-0">
          
          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-sm md:text-base">Nama Pengirim</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-8 md:h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-10 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Nama" className="flex-1 px-3 outline-none text-black font-medium text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-sm md:text-base">No Handphone</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-8 md:h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-10 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="No Handphone" className="flex-1 px-3 outline-none text-black font-medium text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-sm md:text-base">Alamat</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-8 md:h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-10 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Alamat" className="flex-1 px-3 outline-none text-black font-medium text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-sm md:text-base">Nama Barang</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-8 md:h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-10 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Nama Barang" className="flex-1 px-3 outline-none text-black font-medium text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label className="font-extrabold text-black text-sm md:text-base">Nama Penerima</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-8 md:h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-10 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Nama" className="flex-1 px-3 outline-none text-black font-medium text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-sm md:text-base">No Handphone</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-8 md:h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-10 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="No Handphone" className="flex-1 px-3 outline-none text-black font-medium text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-sm md:text-base">Alamat Penerima</label>
            <div className="flex border-[3px] border-black rounded-md overflow-hidden bg-white h-8 md:h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-10 bg-[#D9D9D9] border-r-[3px] border-black flex-shrink-0"></div>
              <input type="text" placeholder="Alamat" className="flex-1 px-3 outline-none text-black font-medium text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-extrabold text-black text-base md:text-lg">Foto</label>
            <div className="flex gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="w-12 h-12 md:w-14 md:h-14 bg-white border-[3px] border-black rounded-md flex items-start p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm cursor-pointer hover:bg-gray-100">
                  {num}
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input type="checkbox" className="w-4 h-4 md:w-5 md:h-5 accent-orange-500 border-2 border-black" />
            <span className="text-black font-medium text-xs md:text-sm">
              Saya telah menyetujui <strong className="font-extrabold">S&K yang berlaku</strong>
            </span>
          </label>

          <div className="hidden md:flex gap-4 mt-4">
            <button onClick={onBack} className="bg-white hover:bg-gray-200 text-black font-extrabold text-xl py-2 px-8 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
              Kembali
            </button>
            <button onClick={onNext} className="bg-[#B7FF8E] hover:bg-[#6FAF4F] text-black font-extrabold text-xl py-2 px-10 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all w-max">
              Bayar
            </button>
          </div>

        </div>

        <div className="flex flex-col gap-4 w-full md:w-1/2 pt-6 md:pt-0">
          
          {/* --- TOTAL PEMBAYARAN --- */}
          <div className="flex flex-col gap-2">
            <h3 className="font-extrabold text-black text-lg md:text-xl">Total Pembayaran</h3>
            <div className="bg-white border-[3px] border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black font-medium text-sm md:text-base">
              <p>Harga 1 kg : Rp.6.000</p>
              <p>Total 2,5 kg : 2,5 * Rp.6.000</p>
              <hr className="border-t-[3px] border-black my-3" />
              <p className="text-right font-extrabold text-lg">Rp. 15.000</p>
            </div>
          </div>

          {/* --- METODE PEMBAYARAN --- */}
          <div className="flex flex-col gap-2 mt-2">
            <h3 className="font-extrabold text-black text-lg md:text-xl">Metode Pembayaran</h3>

            {/* Kotak Transfer Bank */}
            <div className="bg-[#F5F5F5] border-[3px] border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <h4 className="font-bold text-black text-sm mb-2">Transfer Bank</h4>
              <div className="flex gap-2 flex-wrap">
               {[
                  { id: 'bri', src: '/images/avatars/bri.svg', alt: 'BRI' },
                  { id: 'mandiri', src: '/images/avatars/mandiri.png', alt: 'Mandiri' },
                  { id: 'bca', src: '/images/avatars/bca.png', alt: 'BCA' },
                  { id: 'bni', src: '/images/avatars/bni.png', alt: 'BNI' }
                ].map((bank) => (
                  <label key={bank.id} className="w-[60px] h-[45px] md:w-[70px] md:h-[50px] border-[2px] border-black bg-white rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-200 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <input type="radio" name="payment" className="absolute top-1 left-1 w-2.5 h-2.5 accent-blue-600" />
                    
                    <img 
                      src={bank.src} 
                      alt={bank.alt} 
                      className="w-7 h-auto object-contain mt-2" 
                    />
                    
                  </label>
                ))}
              </div>
            </div>

            {/* Kotak E-wallet */}
            <div className="bg-[#F5F5F5] border-[3px] border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-2">
              <h4 className="font-bold text-black text-sm mb-2">E-wallet</h4>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'gopay', src: '/images/avatars/gopay.png', alt: 'GoPay' },
                  { id: 'ovo', src: '/images/avatars/ovo.png', alt: 'OVO' },
                  { id: 'dana', src: '/images/avatars/dana.png', alt: 'DANA' },
                  { id: 'qris', src: '/images/avatars/qris.png', alt: 'QRIS' },
                ].map((ewallet) => (
                  <label key={ewallet.id} className="w-[60px] h-[45px] md:w-[70px] md:h-[50px] border-[2px] border-black bg-white rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-200 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                     <input type="radio" name="payment" className="absolute top-1 left-1 w-2.5 h-2.5 accent-blue-600" />
                     <img src={ewallet.src} alt={ewallet.alt} className="w-10 h-auto object-contain mt-2" />
                  </label>
                ))}
              </div>
            </div>

            {/* Kotak Bayar di Gerai */}
            <div className="bg-[#F5F5F5] border-[3px] border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-2">
              <h4 className="font-bold text-black text-sm mb-2">Bayar di Gerai</h4>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'gopay', src: '/images/avatars/alfamart.svg', alt: 'alfamart' },
                  { id: 'ovo', src: '/images/avatars/indomaret.png', alt: 'indomaret' },
                ].map((ewallet) => (
                  <label key={ewallet.id} className="w-[60px] h-[45px] md:w-[70px] md:h-[50px] border-[2px] border-black bg-white rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-200 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                     <input type="radio" name="payment" className="absolute top-1 left-1 w-2.5 h-2.5 accent-blue-600" />
                     <img src={ewallet.src} alt={ewallet.alt} className="w-10 h-auto object-contain mt-2" />
                  </label>
                ))}
              </div>
            </div>

          </div>

         <div className="md:hidden flex flex-col gap-4 mt-6">
            <button onClick={onNext} className="bg-[#B7FF8E] hover:bg-[#6FAF4F] text-black font-extrabold text-xl py-3 px-10 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all w-full text-center">
              Bayar
            </button>
            <button onClick={onBack} className="bg-white hover:bg-gray-200 text-black font-extrabold text-xl py-3 px-10 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all w-full text-center">
              Kembali
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PaymentMethode;