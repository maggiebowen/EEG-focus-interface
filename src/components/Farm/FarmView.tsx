
import React from 'react';
import clsx from 'clsx';

interface FarmViewProps {
    isPlaying: boolean;
    toggleTimer: () => void;
    elapsedMs: number;
}

export const FarmView: React.FC<FarmViewProps> = ({ isPlaying, toggleTimer, elapsedMs }) => {
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    // Helper for staggered growth
    const getStage = (elapsedSeconds: number, index: number, growthTime: number, stagger: number, maxStage: number) => {
        const localTime = Math.max(0, elapsedSeconds - index * stagger);
        // Calculate stage: (localTime / growthTime) gives 0 to 1 progress. 
        // Multiply by (maxStage + 1) to map to 0..maxStage indices.
        // However, the prompt logic "Math.floor((localTime / growthTime) * (maxStage + 1))" implies it reaches maxStage+1 at end of growthTime?
        // Let's stick exactly to the prompt's logic but clamp it.
        // Actually, usually growth is: stage = floor(progress * steps).
        // If growthTime is "time to reach full maturity", then at growthTime it should be maxStage.
        // Let's use the prompt's formula exactly:
        const raw = Math.floor((localTime / growthTime) * (maxStage + 1));
        return Math.min(maxStage, raw);
    };

    // Constants
    const FARM_SIZE = 600;
    const FENCE_V_WIDTH = 70;
    const FENCE_V_HEIGHT = 500;
    const FENCE_H_WIDTH = 500;
    const FENCE_H_HEIGHT = 70;

    // Corn Config
    const cornImages = [
        "/assets/corn1.png",
        "/assets/corn2.png",
        "/assets/corn3.png",
        "/assets/corn4.png",
        "/assets/corn5.png"
    ];
    const CORN_COUNT = 4;
    const CORN_GROWTH_SEC = 20;
    const CORN_STAGGER_SEC = 3;
    const CORN_MAX_STAGE = 4;
    const cornY = 110;
    const cornXStart = 110;
    const cornSpacing = 100;

    // Cherry Config
    const cherryImages = [
        "/assets/cherry1.png",
        "/assets/cherry2.png",
        "/assets/cherry3.png",
        "/assets/cherry4.png",
        "/assets/cherry5.png"
    ];
    const CHERRY_COUNT = 4;
    const CHERRY_GROWTH_SEC = 20;
    const CHERRY_STAGGER_SEC = 3;
    const CHERRY_MAX_STAGE = 4;
    const cherryY_Prompt = cornY + 90;
    const cherryXStart = cornXStart;
    const cherrySpacing = cornSpacing;

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
                width: FARM_SIZE,
                height: FARM_SIZE,
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
                        width: FARM_SIZE,
                        height: FARM_SIZE,
                        left: 0,
                        top: 0,
                        imageRendering: "pixelated"
                    }}
                />

                {/* Fences */}
                {/* Left */}
                <img src="/assets/Fences-vertical.png" style={{
                    position: "absolute", width: FENCE_V_WIDTH, height: FENCE_V_HEIGHT,
                    left: 0, top: (FARM_SIZE - FENCE_V_HEIGHT) / 2,
                    imageRendering: "pixelated", zIndex: 5
                }} />

                {/* Right */}
                <img src="/assets/Fences-vertical.png" style={{
                    position: "absolute", width: FENCE_V_WIDTH, height: FENCE_V_HEIGHT,
                    left: FARM_SIZE - FENCE_V_WIDTH, top: (FARM_SIZE - FENCE_V_HEIGHT) / 2,
                    imageRendering: "pixelated", zIndex: 5
                }} />

                {/* Top */}
                <img src="/assets/Fences-horizontal.png" style={{
                    position: "absolute", width: FENCE_H_WIDTH, height: FENCE_H_HEIGHT,
                    left: (FARM_SIZE - FENCE_H_WIDTH) / 2, top: 0,
                    imageRendering: "pixelated", zIndex: 5
                }} />

                {/* Bottom */}
                <img src="/assets/Fences-horizontal.png" style={{
                    position: "absolute", width: FENCE_H_WIDTH, height: FENCE_H_HEIGHT,
                    left: (FARM_SIZE - FENCE_H_WIDTH) / 2, top: FARM_SIZE - FENCE_H_HEIGHT,
                    imageRendering: "pixelated", zIndex: 5
                }} />

                {/* Corn Row */}
                {Array.from({ length: CORN_COUNT }).map((_, i) => {
                    const stage = getStage(elapsedSeconds, i, CORN_GROWTH_SEC, CORN_STAGGER_SEC, CORN_MAX_STAGE);
                    return (
                        <img
                            key={"corn-" + i}
                            src={cornImages[stage]}
                            alt={`Corn ${i}`}
                            style={{
                                position: "absolute",
                                width: 64, height: 64,
                                left: cornXStart + i * cornSpacing,
                                top: cornY,
                                imageRendering: "pixelated",
                                zIndex: 10
                            }}
                        />
                    );
                })}

                {/* Cherry Row */}
                {Array.from({ length: CHERRY_COUNT }).map((_, i) => {
                    const stage = getStage(elapsedSeconds, i, CHERRY_GROWTH_SEC, CHERRY_STAGGER_SEC, CHERRY_MAX_STAGE);
                    return (
                        <img
                            key={"cherry-" + i}
                            src={cherryImages[stage]}
                            alt={`Cherry ${i}`}
                            style={{
                                position: "absolute",
                                width: 64, height: 64,
                                left: cherryXStart + i * cherrySpacing,
                                top: cherryY_Prompt,
                                imageRendering: "pixelated",
                                zIndex: 10
                            }}
                        />
                    );
                })}
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
