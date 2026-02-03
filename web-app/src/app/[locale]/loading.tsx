export default function Loading() {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full"
                >
                    <style>
                        {`
              .health-pulse {
                stroke: url(#health-gradient);
                stroke-dasharray: 100;
                stroke-dashoffset: 100;
                animation: draw 2s ease-in-out infinite;
              }

              @keyframes draw {
                0% { stroke-dashoffset: 100; }
                50% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -100; }
              }
            `}
                    </style>
                    <defs>
                        <linearGradient id="health-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                    <path d="M2 12h3l2-3 3 10 4-14 3 7h5" className="health-pulse" />
                </svg>
            </div>

            <div className="animate-pulse flex flex-col items-center">
                {/* Texto con efecto redondeado y .ai resaltado */}
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                        Vital
                    </span>
                    <span className="ml-1 px-3 rounded bg-blue-400 text-white text-xl md:text-2xl font-bold inline-flex items-center justify-center pb-1.5 pt-1.5 pl-2 leading-none">
                        ai
                    </span>
                </h1>
                <div className="mt-4 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                </div>
            </div>
        </div>
    );
}