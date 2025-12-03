
import React from 'react';
import clsx from 'clsx';

interface FarmViewProps {
    isPlaying: boolean;
    toggleTimer: () => void;
    elapsedMs: number;
}

export const FarmView: React.FC<FarmViewProps> = ({ isPlaying, toggleTimer, elapsedMs }) => {
    // Corn growth logic
    const cornImages = [
        "/assets/corn1.png",
        "/assets/corn2.png",
        "/assets/corn3.png",
        "/assets/corn4.png",
        "/assets/corn5.png"
    ];
    // Stage 0 to 4 based on time (approx 20s to full growth)
    const stage = Math.min(4, Math.floor((elapsedMs / 1000) / 4));

    return (
        <div className="w-full h-full relative group overflow-hidden"
            style={{
                backgroundImage: "url('/assets/Water.png')",
                backgroundRepeat: "repeat",
                imageRendering: "pixelated",
                backgroundSize: "64px 256px"
            }}
        >
            {/* Grass Container (600x600 Centered) */}
            <div style={{
                position: "absolute",
                width: 600,
                height: 600,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)"
            }}>
                {/* Grass Background */}
                <img
                    src="/assets/focus-farm-grass.png"
                    alt="Grass"
                    style={{
                        position: "absolute",
                        width: 600,
                        height: 600,
                        left: 0,
                        top: 0,
                        imageRendering: "pixelated"
                    }}
                />

                {/* Fences */}
                {/* Left Fence */}
                <img
                    src="/assets/Fences-vertical.png"
                    alt="Fence Left"
                    style={{
                        position: "absolute",
                        width: "70px",
                        height: "500px",
                        left: "25px",
                        top: "50px",
                        zIndex: 5,
                        imageRendering: "pixelated"
                    }}
                />
                {/* Right Fence */}
                <img
                    src="/assets/Fences-vertical.png"
                    alt="Fence Right"
                    style={{
                        position: "absolute",
                        width: "70px",
                        height: "500px",
                        left: `${600 - 70 - 25} px`, // 505px
                        top: "50px",
                        zIndex: 5,
                        imageRendering: "pixelated"
                    }}
                />
                {/* Top Fence */}
                <img
                    src="/assets/Fences-horizontal.png"
                    alt="Fence Top"
                    style={{
                        position: "absolute",
                        width: "500px",
                        height: "70px",
                        left: "50px",
                        top: "25px",
                        zIndex: 5,
                        imageRendering: "pixelated"
                    }}
                />
                {/* Bottom Fence */}
                <img
                    src="/assets/Fences-horizontal.png"
                    alt="Fence Bottom"
                    style={{
                        position: "absolute",
                        width: "500px",
                        height: "70px",
                        left: "50px",
                        top: `${600 - 70 - 25} px`, // 505px
                        zIndex: 5,
                        imageRendering: "pixelated"
                    }}
                />

                {/* Corn Growth */}
                <img
                    src={cornImages[stage]}
                    alt={`Corn Stage ${stage + 1} `}
                    style={{
                        position: "absolute",
                        width: 64,
                        height: 64,
                        left: 110,
                        top: 90,
                        zIndex: 10,
                        imageRendering: "pixelated"
                    }}
                />
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
