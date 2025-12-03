import React from 'react';
import clsx from 'clsx';

interface FarmViewProps {
    isPlaying: boolean;
    toggleTimer: () => void;
    elapsedMs: number;
}

export const FarmView: React.FC<FarmViewProps> = ({ isPlaying, toggleTimer, elapsedMs }) => {
    const SESSION_DURATION_MS = 25 * 60 * 1000; // 25 minutes
    const progress = Math.min(1, elapsedMs / SESSION_DURATION_MS);

    return (
        <div className="w-full h-full relative group">

            {/* Background Layers */}
            <div className="absolute inset-0">
                {/* Empty Farm (Base Layer) */}
                <img
                    src="/assets/farm-empty.png"
                    alt="Empty Farm"
                    className="w-full h-full object-cover absolute inset-0"
                />

                {/* Full Farm (Overlay Layer with Opacity Transition) */}
                <img
                    src="/assets/farm-full.png"
                    alt="Full Farm"
                    className="w-full h-full object-cover absolute inset-0 transition-opacity duration-100 ease-linear"
                    style={{ opacity: progress }}
                />
            </div>

            {/* Overlay info - Crystals REMOVED */}
            <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex gap-4 text-sm font-medium border border-white/10 z-10">
                <span className="text-emerald-400">Plants: {Math.floor(progress * 100)}%</span>
            </div>

            {/* Start/Stop Button Overlay */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
                <button
                    onClick={toggleTimer}
                    className={clsx(
                        "font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 min-w-[140px]",
                        isPlaying
                            ? "bg-red-500 hover:bg-red-400 text-white hover:shadow-red-500/20"
                            : "bg-emerald-500 hover:bg-emerald-400 text-black hover:shadow-emerald-500/20"
                    )}
                >
                    {isPlaying ? 'Stop' : 'Start'}
                </button>
            </div>
        </div>
    );
};
