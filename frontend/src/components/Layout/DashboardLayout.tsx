import React, { useState } from 'react';
import { Settings, Info, BarChart3 } from 'lucide-react';
import { StatsPanel } from '../Stats/StatsPanel';
import { FarmView } from '../Farm/FarmView';
import { CalibrationOverlay } from './CalibrationOverlay';
import { useEEGData } from '../../hooks/useEEGData';

export const DashboardLayout: React.FC = () => {
    const {
        isPlaying,
        toggleSession,
        focusScore,
        sessionStats,
        alphaHistory,
        focusTimeMs,
        elapsedMs,
        isCalibrating,
        calibrationProgress,
        isConnected,
        hasReceivedData,
        calibrationComplete,
        channelValues
    } = useEEGData();
    // Fallback: when not connected OR haven't received data yet, use mock data for visuals
    const displayFocusScore = focusScore;
    const displaySessionStats = sessionStats;
    const displayAlphaHistory = alphaHistory;
    const displayFocusTimeMs = focusTimeMs;
    const [showStats, setShowStats] = useState(true);

    // Format time for display
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const formattedTime = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Determine status message
    const statusMessage = !isConnected ? 'Connecting...' :
        isCalibrating ? 'Calibrating...' :
            !hasReceivedData ? 'Waiting for data...' :
                'Monitoring Focus';

    return (
        <div className="h-screen w-screen bg-[#9F7EB1] text-black p-4 flex flex-col gap-4 overflow-hidden relative">
            {/* Calibration Overlay - show only while calibrating and not complete */}
            {isCalibrating && !calibrationComplete && <CalibrationOverlay progress={calibrationProgress} />}

            {/* Header */}
            <header className="flex justify-between items-center px-2 shrink-0 h-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <img
                            src="/assets/chicken3.png"
                            alt="Logo"
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white">FocusFarm</h1>
                        <p className="text-sm text-white font-medium">
                            Grow your concentration
                        </p>
                    </div>
                </div>
                <div className="flex gap-4" style={{ color: '#54407F' }}>
                    <button
                        className="hover:text-black transition-colors"
                        onClick={() => setShowStats(!showStats)}
                        title={showStats ? 'Hide Stats' : 'Show Stats'}
                        style={{ color: showStats ? 'white' : '#54407F' }}
                    >
                        <BarChart3 size={18} />
                    </button>
                    <button className="hover:text-black transition-colors"><Info size={18} /></button>
                    <button className="hover:text-black transition-colors"><Settings size={18} /></button>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className={`flex-1 grid ${showStats ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-4 min-h-0`}>
                {/* Farm View (Left - 2 cols) */}
                <div className={`${showStats ? 'lg:col-span-2' : 'col-span-1'} bg-white/20 rounded-2xl overflow-hidden border border-black/5 relative h-full`}>
                    <FarmView
                        isPlaying={isPlaying}
                        toggleTimer={toggleSession}
                        elapsedMs={elapsedMs}
                    />
                </div>

                {/* Stats Panel (Right - 1 col) */}
                {showStats && (
                    <div className="lg:col-span-1 flex flex-col gap-4 h-full overflow-hidden">
                        <StatsPanel
                            focusScore={displayFocusScore}
                            sessionStats={{ ...displaySessionStats, duration: formattedTime }}
                            alphaHistory={displayAlphaHistory}
                            focusTimeMs={displayFocusTimeMs}
                            statusMessage={statusMessage}
                            channelValues={channelValues}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};
