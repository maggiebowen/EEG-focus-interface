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
        hasReceivedData
    } = useEEGData();
    // Fallback: when not connected OR haven't received data yet, use mock data for visuals
    const displayFocusScore = focusScore;
    const displaySessionStats = sessionStats;
    const displayAlphaHistory = alphaHistory;
    const displayFocusTimeMs = focusTimeMs;
    const [showStats, setShowStats] = useState(true);

    // Debug: log state changes
    React.useEffect(() => {
        console.log('[Dashboard] State:', { isCalibrating, hasReceivedData, focusScore, isPlaying });
    }, [isCalibrating, hasReceivedData, focusScore, isPlaying]);

    // Format time for display
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const formattedTime = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    return (
        <div className="h-screen w-screen bg-background text-white p-4 flex flex-col gap-4 overflow-hidden relative">
            {/* Calibration Overlay - hide if we've received running data */}
            {isCalibrating && !hasReceivedData && <CalibrationOverlay progress={calibrationProgress} />}
            
            {/* Debug Status Banner */}
            {isConnected && !hasReceivedData && !isCalibrating && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-300 text-sm z-50">
                    Connected to server - Waiting for EEG data... (Check if device is sending data)
                </div>
            )}
            
            {/* Header */}
            <header className="flex justify-between items-center px-2 shrink-0 h-12">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">FocusFarm</h1>
                        <p className="text-[10px] text-gray-400">
                            {!isConnected ? 'Connecting...' : 
                             isCalibrating ? 'Calibrating...' :
                             !hasReceivedData ? 'Waiting for data...' :
                             'Grow your concentration'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 text-gray-400">
                    <button
                        className={`hover:text-white transition-colors ${showStats ? 'text-green-400' : ''}`}
                        onClick={() => setShowStats(!showStats)}
                        title={showStats ? 'Hide Stats' : 'Show Stats'}
                    >
                        <BarChart3 size={18} />
                    </button>
                    <button className="hover:text-white transition-colors"><Info size={18} /></button>
                    <button className="hover:text-white transition-colors"><Settings size={18} /></button>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className={`flex-1 grid ${showStats ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-4 min-h-0`}>
                {/* Farm View (Left - 2 cols) */}
                <div className={`${showStats ? 'lg:col-span-2' : 'col-span-1'} bg-surface rounded-2xl overflow-hidden border border-white/5 relative h-full`}>
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
                        />
                    </div>
                )}
            </main>
        </div>
    );
};
