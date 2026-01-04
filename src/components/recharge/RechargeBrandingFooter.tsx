'use client';

import Image from 'next/image';

export default function RechargeBrandingFooter() {
    return (
        <div className="mt-16 mb-8 pt-10 border-t border-gray-100">
            <div className="flex flex-col items-center justify-center space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-center md:space-x-8 space-y-4 md:space-y-0">
                    {/* Powered By Section */}
                    <div className="flex flex-col md:flex-row items-center group space-y-2 md:space-y-0">
                        <span className="text-sm text-gray-400 font-medium uppercase tracking-wider md:mr-4">Powered By</span>
                        <div className="flex items-center bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-orange-100 group">
                            <div className="relative w-10 h-10 mr-3 transform transition-transform group-hover:scale-110">
                                <Image
                                    src="/vignaharta.png"
                                    alt="Vighnaharta Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 tracking-tight italic">
                                    Vighnaharta
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.1em] text-gray-500 font-bold mt-0.5">Online Services</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block h-12 w-px bg-gray-200"></div>

                    {/* Bharat Connect Branding */}
                    <div className="flex items-center space-x-4 bg-gradient-to-br from-white to-gray-50 px-6 py-3 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-blue-100 group">
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Payment Partner</span>
                            <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Bharat Connect</span>
                        </div>
                        <div className="relative w-24 h-10 transform transition-transform group-hover:scale-110">
                            <Image
                                src="/bharatconnect.png"
                                alt="Bharat Connect Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Tagline */}
                <div className="relative w-full max-w-md">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-4 bg-transparent text-[11px] text-gray-400 uppercase tracking-[0.3em] font-bold text-center">
                            Secure digital payments via BBPS
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
