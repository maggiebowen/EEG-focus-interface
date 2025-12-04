import React, { useState } from 'react';
import { Settings, Info, BarChart3 } from 'lucide-react';
import { StatsPanel } from '../Stats/StatsPanel';
import { FarmView } from '../Farm/FarmView';
import { useTimer } from '../../hooks/useTimer';
import { useMockData } from '../../hooks/useMockData';

export const DashboardLayout: React.FC = () => {
    const { isPlaying, toggleTimer, elapsedMs, formattedTime } = useTimer();
    const { focusScore, sessionStats, alphaHistory, focusTimeMs } = useMockData(isPlaying);
    const [showStats, setShowStats] = useState(true);

    return (
        <div className="h-screen w-screen bg-background text-white p-4 flex flex-col gap-4 overflow-hidden">
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
                        <p className="text-[10px] text-gray-400">Grow your concentration</p>
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
                        toggleTimer={toggleTimer}
                        elapsedMs={elapsedMs}
                    />
                </div>

                {/* Stats Panel (Right - 1 col) */}
                {showStats && (
                    <div className="lg:col-span-1 flex flex-col gap-4 h-full overflow-hidden">
                        <StatsPanel
                            focusScore={focusScore}
                            sessionStats={{ ...sessionStats, duration: formattedTime }}
                            alphaHistory={alphaHistory}
                            focusTimeMs={focusTimeMs}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};
