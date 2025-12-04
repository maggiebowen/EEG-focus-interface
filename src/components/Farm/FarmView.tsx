
import React from 'react';

interface FarmViewProps {
    isPlaying: boolean;
    toggleTimer: () => void;
    elapsedMs: number;
}

export const FarmView: React.FC<FarmViewProps> = ({ isPlaying, toggleTimer, elapsedMs }) => {
    const elapsedSeconds = Math.floor(elapsedMs / 1000);



    // Corn Config
    const cornImages = [
        "/assets/corn1.png",
        "/assets/corn2.png",
        "/assets/corn3.png",
        "/assets/corn4.png",
        "/assets/corn5.png"
    ];


    // Cherry Config
    const cherryImages = [
        "/assets/cherry1.png",
        "/assets/cherry2.png",
        "/assets/cherry3.png",
        "/assets/cherry4.png",
        "/assets/cherry5.png"
    ];

    const CORN_GROWTH_SEC = 20;
    const CORN_STAGGER_SEC = 3;

    // Animation Config
    const LAST_PLANT_START = 19 * CORN_STAGGER_SEC;
    const ALL_GROWN_TIME = LAST_PLANT_START + CORN_GROWTH_SEC;
    const SLIDE_DURATION = 2.5;

    return (
        <div className="w-full h-full relative group overflow-hidden flex items-center justify-center"
            style={{
                backgroundImage: "url('/assets/Water.png')",
                backgroundRepeat: "repeat",
                imageRendering: "pixelated",
                backgroundSize: "5.33% 32%" // 64px/1200px, 256px/800px
            }}
        >
            {/* Game Stage Container - Aspect Ratio 3:2 (1200x800) */}
            <div style={{
                width: "100%",
                maxWidth: "150vh", // Ensures width doesn't exceed 1.5x height (maintaining 3:2 aspect ratio within viewport)
                aspectRatio: "3/2",
                position: "relative",
            }}>

                {/* Farm Plot Container (Increased size by ~5%) */}
                <div style={{
                    position: "absolute",
                    width: "55%", // Increased from 50%
                    height: "80%", // Increased from 75%
                    left: "2%",
                    top: "50%",
                    transform: "translate(10%, -50%)" // Kept user's adjustment
                }}>
                    {/* Grass Background */}
                    <img
                        src="/assets/focus-farm-grass.png"
                        alt="Grass"
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            left: 0,
                            top: 0,
                            imageRendering: "pixelated"
                        }}
                    />

                    {/* Fences */}
                    {/* Vertical Fences: 70x500 relative to 600x600 => 11.66% x 83.33% */}
                    {/* Left */}
                    <img src="/assets/Fences-vertical.png" style={{
                        position: "absolute", width: "11.66%", height: "83.33%",
                        left: 0, top: "8.33%", // (100-83.33)/2
                        imageRendering: "pixelated", zIndex: 5
                    }} />

                    {/* Right */}
                    <img src="/assets/Fences-vertical.png" style={{
                        position: "absolute", width: "11.66%", height: "83.33%",
                        right: 0, top: "8.33%",
                        imageRendering: "pixelated", zIndex: 5
                    }} />

                    {/* Horizontal Fences: 500x70 relative to 600x600 => 83.33% x 11.66% */}
                    {/* Top */}
                    <img src="/assets/Fences-horizontal.png" style={{
                        position: "absolute", width: "83.33%", height: "11.66%",
                        left: "8.33%", top: 0,
                        imageRendering: "pixelated", zIndex: 5
                    }} />

                    {/* Bottom */}
                    <img src="/assets/Fences-horizontal.png" style={{
                        position: "absolute", width: "83.33%", height: "11.66%",
                        left: "8.33%", bottom: 0,
                        imageRendering: "pixelated", zIndex: 5
                    }} />

                    {/* Plants Grid */}
                    {/* 
                        CornXStart: 110/600 = 18.33%
                        CornY: 110/600 = 18.33%
                        Spacing: 100/600 = 16.66%
                        Row Spacing: 90/600 = 15%
                        Size: 64/600 = 10.66%
                    */}
                    {Array.from({ length: 5 }).map((_, rowIndex) => {
                        return Array.from({ length: 4 }).map((_, colIndex) => {
                            const globalIndex = rowIndex * 4 + colIndex;

                            let plantImages: string[] = [];
                            if (rowIndex === 0 || rowIndex === 2 || rowIndex === 4) {
                                plantImages = cornImages;
                            } else if (rowIndex === 1 || rowIndex === 3) {
                                plantImages = cherryImages;
                            }

                            const maxStage = plantImages.length - 1;
                            const startTime = globalIndex * CORN_STAGGER_SEC;

                            if (elapsedSeconds < startTime) return null;

                            const localTime = elapsedSeconds - startTime;
                            const stage = Math.min(maxStage, Math.floor((localTime / CORN_GROWTH_SEC) * (maxStage + 1)));

                            return (
                                <img
                                    key={`plant-${rowIndex}-${colIndex}`}
                                    src={plantImages[stage]}
                                    alt={`Plant ${rowIndex}-${colIndex}`}
                                    style={{
                                        position: "absolute",
                                        width: "10.66%", height: "auto", // Maintain aspect ratio
                                        left: `${18.33 + colIndex * 16.66}%`,
                                        top: `${18.33 + rowIndex * 15}%`,
                                        imageRendering: "pixelated",
                                        zIndex: 10 + rowIndex
                                    }}
                                />
                            );
                        });
                    })}
                </div>

                {/* Hill and Chicken House Section (Increased size by ~5%) */}
                <div style={{
                    position: "absolute",
                    right: "5%",
                    top: "50%",
                    transform: "translate(0, -50%)",
                    width: "33%", // Increased from 26.25%
                    height: "50%", // Increased from 39.375%
                    zIndex: 15
                }}>
                    {/* Hill */}
                    <img
                        src="/assets/hill1.png"
                        alt="Hill"
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            imageRendering: "pixelated"
                        }}
                    />
                    {/* Chicken House */}
                    <img
                        src="/assets/Chicken_House.png"
                        alt="Chicken House"
                        style={{
                            position: "absolute",
                            width: "47.6%",
                            height: "auto",
                            left: "50%",
                            top: "20%",
                            transform: "translate(-50%, -100%)",
                            imageRendering: "pixelated",
                            zIndex: 20
                        }}
                    />

                    {/* Egg / Chicken Animation */}
                    {elapsedSeconds > ALL_GROWN_TIME && (() => {
                        // Use precise time for smooth animation
                        const preciseElapsedSeconds = elapsedMs / 1000;
                        const animTime = preciseElapsedSeconds - ALL_GROWN_TIME;

                        // Egg Spawn Logic based on ratios relative to Chicken House
                        // Hill Container: Width 33% (396px), Height 50% (400px) -> Ratio 0.99 (approx 1:1)
                        // House Width: 47.6% of Hill Width
                        // House Height: Auto (Square image) -> Height in px = Width in px
                        // House Height % of Hill Height = 47.6 * (HillWidth/HillHeight) = 47.6 * (33/50) = 31.42%

                        // House Position:
                        // Left: 50% - (47.6%/2) = 26.2%
                        // Top (Visual): 20% - 31.42% = -11.42% (due to translate -100%)

                        // Egg Offsets (Ratios of House Dimensions):
                        // X Ratio: 70/150 = 0.4666
                        // Y Ratio: 107/150 = 0.7133

                        // Egg Start X = 26.2 + (47.6 * 0.4666) = 48.41%
                        // Egg Start Y = -11.42 + (31.42 * 0.7133) = -11.42 + 22.41 = 10.99%

                        const startLeft = 48.41;
                        const startTop = 10.99;

                        // Slide Distance: 25% of House Height
                        // Dist = 31.42 * 0.25 = 7.855%
                        const targetTop = startTop + 7.855;

                        if (animTime < SLIDE_DURATION) {
                            // Slide Phase
                            const progress = animTime / SLIDE_DURATION;
                            const currentTop = startTop + (targetTop - startTop) * progress;

                            return (
                                <img
                                    src="/assets/Egg_item.png"
                                    alt="Egg"
                                    style={{
                                        position: "absolute",
                                        width: "10%", height: "auto", // Approx size
                                        left: `${startLeft}%`,
                                        top: `${currentTop}%`,
                                        transform: "translate(-50%, -50%)",
                                        imageRendering: "pixelated",
                                        zIndex: 25
                                    }}
                                />
                            );
                        } else {
                            // Chicken Phase
                            const chickenTime = animTime - SLIDE_DURATION;
                            const isFrame1 = Math.floor(chickenTime / 0.5) % 2 === 0; // Toggle every 0.5s

                            return (
                                <img
                                    src={isFrame1 ? "/assets/chicken1.png" : "/assets/chicken2.png"}
                                    alt="Chicken"
                                    style={{
                                        position: "absolute",
                                        width: "15%", height: "auto", // Approx size
                                        left: `${startLeft}%`,
                                        top: `${targetTop}%`,
                                        transform: "translate(-50%, -50%)",
                                        imageRendering: "pixelated",
                                        zIndex: 25
                                    }}
                                />
                            );
                        }
                    })()}
                </div>

                {/* Start/Stop Button */}
                <button
                    onClick={toggleTimer}
                    style={{
                        position: "absolute",
                        left: "37%", // Centered relative to Farm Plot (2% + 20% offset + 55%/2 width approx)
                        top: "92%",
                        transform: "translate(50%, -15%)",
                        backgroundImage: `url('${isPlaying ? '/assets/stop-btn.png' : '/assets/start-btn.png'}')`,
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        width: "15%", // Scaled up
                        height: "12%", // Scaled up
                        border: "none",
                        cursor: "pointer",
                        imageRendering: "pixelated",
                        zIndex: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontFamily: "'Pixelify Sans', sans-serif", // Assuming this font is available globally
                        fontSize: "1.5rem",
                        textShadow: "2px 2px 0 #000",
                        outline: "none"
                    }}
                >
                    {isPlaying ? 'Stop' : 'Start'}
                </button>

                {/* Counters */}
                <div style={{
                    position: "absolute",
                    top: "2%",
                    right: "2%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontFamily: "'Pixelify Sans', sans-serif",
                    color: "white",
                    textShadow: "2px 2px 0 #000",
                    zIndex: 40,
                    fontSize: "1.2rem"
                }}>
                    <div>
                        Plants: {(() => {
                            let count = 0;
                            const totalRows = 5;
                            const totalCols = 4;
                            for (let r = 0; r < totalRows; r++) {
                                for (let c = 0; c < totalCols; c++) {
                                    const gIndex = r * 4 + c;
                                    const sTime = gIndex * CORN_STAGGER_SEC;
                                    if (elapsedSeconds >= sTime + CORN_GROWTH_SEC) {
                                        count++;
                                    }
                                }
                            }
                            return count;
                        })()} / 20
                    </div>
                    <div>
                        Chickens: {elapsedSeconds > ALL_GROWN_TIME + SLIDE_DURATION ? 1 : 0}
                    </div>
                </div>

            </div>
        </div>
    );
};

