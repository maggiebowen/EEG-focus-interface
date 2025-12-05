
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
    const CHICKEN_SPAWN_INTERVAL = 10; // Spawn a new chicken every 10 seconds
    const MAX_CHICKENS = 20; // Cap at 20 chickens

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
                    top: "63%",
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

                    {/* Egg / Chicken Animation - Multiple Chickens */}
                    {elapsedSeconds > ALL_GROWN_TIME && (() => {
                        // Use precise time for smooth animation
                        const preciseElapsedSeconds = elapsedMs / 1000;
                        const timeSinceFirstChicken = preciseElapsedSeconds - ALL_GROWN_TIME;

                        // Calculate how many chickens should have spawned (capped at MAX_CHICKENS)
                        const numChickensSpawned = Math.min(
                            Math.floor(timeSinceFirstChicken / CHICKEN_SPAWN_INTERVAL) + 1,
                            MAX_CHICKENS
                        );

                        // Animation timing constants
                        const IDLE_DURATION = 2;
                        const WALK_DURATION = 5;
                        const TOTAL_ANIMATION_TIME = SLIDE_DURATION + IDLE_DURATION + WALK_DURATION;

                        // Egg spawn position
                        const startLeft = 50;
                        const startTop = 5;
                        const targetTop = startTop + 25;

                        // Chicken house bounds with 5% padding
                        // House: left 26.2%, top 20% (visual), width 47.6%, height 31.42%
                        const houseLeft = 26.2;
                        const houseTop = 20;
                        const houseWidth = 47.6;
                        const houseHeight = 31.42;
                        const padding = 5;

                        const houseExclusionZone = {
                            left: houseLeft - padding,
                            right: houseLeft + houseWidth + padding,
                            top: houseTop - padding,
                            bottom: houseTop + houseHeight + padding
                        };

                        // Track spawned chicken positions to avoid overlaps
                        const spawnedPositions: Array<{ x: number, y: number }> = [];

                        // Generate random positions with collision avoidance using Best Candidate Algorithm
                        const getChickenTarget = (chickenIndex: number) => {
                            // Valid area with 8% padding from edges
                            const padding = 8;
                            const xMin = padding;
                            const xMax = 100 - padding;
                            const yMin = padding + 10; // Extra offset from top for the house
                            const yMax = 100 - padding;

                            // Stratified sampling: divide area into a grid and assign each chicken to a cell
                            // This ensures more even distribution across the hill
                            const gridCols = 5;
                            const gridRows = 4;
                            const totalCells = gridCols * gridRows;

                            // Determine which grid cell this chicken belongs to
                            const cellIndex = chickenIndex % totalCells;
                            const cellCol = cellIndex % gridCols;
                            const cellRow = Math.floor(cellIndex / gridCols);

                            // Calculate cell boundaries
                            const cellWidth = (xMax - xMin) / gridCols;
                            const cellHeight = (yMax - yMin) / gridRows;
                            const cellXMin = xMin + cellCol * cellWidth;
                            const cellXMax = cellXMin + cellWidth;
                            const cellYMin = yMin + cellRow * cellHeight;
                            const cellYMax = cellYMin + cellHeight;

                            // Best candidate algorithm within the assigned cell
                            const numCandidates = 15;
                            let bestCandidate = null;
                            let maxMinDistance = -1;

                            // Pseudo-random number generator
                            const getRand = (seed: number) => {
                                const x = Math.sin(seed) * 10000;
                                return x - Math.floor(x);
                            };

                            for (let i = 0; i < numCandidates; i++) {
                                // Deterministic seed for this candidate
                                const seedBase = (chickenIndex * 1000) + i;
                                const r1 = getRand(seedBase * 12.9898);
                                const r2 = getRand(seedBase * 78.233);

                                // Random position within the assigned cell
                                const candidateX = cellXMin + r1 * (cellXMax - cellXMin);
                                const candidateY = cellYMin + r2 * (cellYMax - cellYMin);

                                // 1. Check Exclusion Zone (Chicken House)
                                // House is roughly: left 26%, top 20%, width 48%, height 32% (relative to hill div)
                                // Only check overlap if the candidate is somewhat high up (y < 60)
                                if (candidateY < 60) {
                                    if (candidateX >= houseExclusionZone.left && candidateX <= houseExclusionZone.right &&
                                        candidateY >= houseExclusionZone.top && candidateY <= houseExclusionZone.bottom) {
                                        continue;
                                    }
                                }

                                // 2. Calculate distance to nearest existing chicken
                                let minDistanceToExisting = Number.MAX_VALUE;

                                if (spawnedPositions.length === 0) {
                                    minDistanceToExisting = Number.MAX_VALUE;
                                } else {
                                    for (const existing of spawnedPositions) {
                                        const dx = candidateX - existing.x;
                                        // Adjust dy for aspect ratio if needed, but simple distance is usually fine for distribution
                                        // Hill aspect ratio is width 33% vs height 50% of parent 3:2. 
                                        // 33% of 1200 = 396px. 50% of 800 = 400px. Almost square 1:1 in pixels!
                                        // So percentage distance is roughly isotropic.
                                        const dy = candidateY - existing.y;
                                        const dist = Math.sqrt(dx * dx + dy * dy);
                                        if (dist < minDistanceToExisting) {
                                            minDistanceToExisting = dist;
                                        }
                                    }
                                }

                                if (minDistanceToExisting > maxMinDistance) {
                                    maxMinDistance = minDistanceToExisting;
                                    bestCandidate = { x: candidateX, y: candidateY };
                                }
                            }

                            // If we found a valid candidate (even if close to others), use it.
                            if (bestCandidate) {
                                spawnedPositions.push(bestCandidate);
                                return bestCandidate;
                            }

                            // Fallback: place in center of assigned cell
                            const fallbackX = cellXMin + cellWidth / 2;
                            const fallbackY = cellYMin + cellHeight / 2;
                            spawnedPositions.push({ x: fallbackX, y: fallbackY });
                            return { x: fallbackX, y: fallbackY };
                        };

                        // Count chickens that have completed their walk
                        let completedChickens = 0;
                        for (let i = 0; i < numChickensSpawned; i++) {
                            const chickenAnimTime = timeSinceFirstChicken - (i * CHICKEN_SPAWN_INTERVAL);
                            if (chickenAnimTime >= TOTAL_ANIMATION_TIME) {
                                completedChickens++;
                            }
                        }

                        // Render all active chickens
                        const chickens = [];
                        for (let i = 0; i < numChickensSpawned; i++) {
                            const chickenAnimTime = timeSinceFirstChicken - (i * CHICKEN_SPAWN_INTERVAL);
                            if (chickenAnimTime < 0) continue; // Not spawned yet

                            const target = getChickenTarget(i);

                            if (chickenAnimTime < SLIDE_DURATION) {
                                // Slide Phase - Egg sliding down
                                const progress = chickenAnimTime / SLIDE_DURATION;
                                const currentTop = startTop + (targetTop - startTop) * progress;

                                chickens.push(
                                    <img
                                        key={`chicken-${i}`}
                                        src="/assets/Egg_item.png"
                                        alt="Egg"
                                        style={{
                                            position: "absolute",
                                            width: "12%", height: "auto",
                                            left: `${startLeft}%`,
                                            top: `${currentTop}%`,
                                            transform: "translate(-50%, -50%)",
                                            imageRendering: "pixelated",
                                            zIndex: 25 + i
                                        }}
                                    />
                                );
                            } else if (chickenAnimTime < SLIDE_DURATION + IDLE_DURATION) {
                                // Idle Phase 1 - Just hatched, idle animation
                                const idleTime = chickenAnimTime - SLIDE_DURATION;
                                const isFrame1 = Math.floor(idleTime / 0.5) % 2 === 0;

                                chickens.push(
                                    <img
                                        key={`chicken-${i}`}
                                        src={isFrame1 ? "/assets/chicken1.png" : "/assets/chicken2.png"}
                                        alt="Chicken"
                                        style={{
                                            position: "absolute",
                                            width: "15%", height: "auto",
                                            left: `${startLeft}%`,
                                            top: `${targetTop}%`,
                                            transform: "translate(-50%, -50%)",
                                            imageRendering: "pixelated",
                                            zIndex: 25 + i
                                        }}
                                    />
                                );
                            } else if (chickenAnimTime < TOTAL_ANIMATION_TIME) {
                                // Walking Phase
                                const walkTime = chickenAnimTime - SLIDE_DURATION - IDLE_DURATION;
                                const walkProgress = walkTime / WALK_DURATION;

                                // Interpolate position
                                const currentX = startLeft + (target.x - startLeft) * walkProgress;
                                const currentY = targetTop + (target.y - targetTop) * walkProgress;

                                // Cycle through walking sprites (chicken3-6)
                                const walkFrames = [
                                    "/assets/chicken3.png",
                                    "/assets/chicken4.png",
                                    "/assets/chicken5.png",
                                    "/assets/chicken6.png"
                                ];
                                const frameIndex = Math.floor(walkTime / 0.5) % 4;

                                chickens.push(
                                    <img
                                        key={`chicken-${i}`}
                                        src={walkFrames[frameIndex]}
                                        alt="Chicken Walking"
                                        style={{
                                            position: "absolute",
                                            width: "15%", height: "auto",
                                            left: `${currentX}%`,
                                            top: `${currentY}%`,
                                            transform: "translate(-50%, -50%)",
                                            imageRendering: "pixelated",
                                            zIndex: 25 + i
                                        }}
                                    />
                                );
                            } else {
                                // Idle Phase 2 - At target, back to idle animation
                                const idleTime = chickenAnimTime - TOTAL_ANIMATION_TIME;
                                const isFrame1 = Math.floor(idleTime / 0.5) % 2 === 0;

                                chickens.push(
                                    <img
                                        key={`chicken-${i}`}
                                        src={isFrame1 ? "/assets/chicken1.png" : "/assets/chicken2.png"}
                                        alt="Chicken"
                                        style={{
                                            position: "absolute",
                                            width: "15%", height: "auto",
                                            left: `${target.x}%`,
                                            top: `${target.y}%`,
                                            transform: "translate(-50%, -50%)",
                                            imageRendering: "pixelated",
                                            zIndex: 25 + i
                                        }}
                                    />
                                );
                            }
                        }

                        // Store completed chicken count for counter
                        (window as any).__completedChickens = completedChickens;

                        return <>{chickens}</>;
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
                        color: "#664C5A",
                        fontFamily: "'Pixelify Sans', sans-serif",
                        fontSize: "1.5rem",
                        fontWeight: "bold",
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
                    backgroundImage: "url('/assets/counter.png')",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                    padding: "30px 32px",
                    minWidth: "250px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "'Pixelify Sans', sans-serif",
                    color: "white",
                    fontWeight: "regular",
                    fontSize: "1rem",
                    zIndex: 40,
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
                        Chickens: {(window as any).__completedChickens || 0} / {MAX_CHICKENS}
                    </div>
                </div>

            </div>
        </div>
    );
};
