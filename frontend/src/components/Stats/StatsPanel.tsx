import React from 'react';
import { Clock, Timer } from 'lucide-react';


interface StatsPanelProps {
    focusScore: number;
    sessionStats: {
        duration: string;
        average: number;
        peak: number;
    };
    alphaHistory: number[];
    focusTimeMs: number;
    statusMessage: string;
    channelValues: number[];
    channelHistory: number[][];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ focusScore, sessionStats, alphaHistory, focusTimeMs, statusMessage, channelValues, channelHistory }) => {


    const getScoreColor = (score: number) => {
        if (score < 25) return 'text-red-500';
        if (score < 50) return 'text-orange-500';
        if (score < 75) return 'text-yellow-500';
        return 'text-primary';
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {/* Focus Gauge and Timers Combined */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 shrink-0">
                <div className="flex gap-4 items-center">
                    {/* Focus Gauge */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                            {/* Background Circle */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="56"
                                    cy="56"
                                    r="48"
                                    stroke="currentColor"
                                    strokeWidth="7"
                                    fill="transparent"
                                    className="text-white/5"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="56"
                                    cy="56"
                                    r="48"
                                    stroke="currentColor"
                                    strokeWidth="7"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 48}
                                    strokeDashoffset={2 * Math.PI * 48 * (1 - focusScore / 100)}
                                    className={`${getScoreColor(focusScore)} transition-all duration-300 ease-out`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold" style={{ color: '#664C5A' }}>{Math.round(focusScore)}%</span>
                                <span className="text-[10px] mt-0.5" style={{ color: '#664C5A' }}>Focus</span>
                            </div>
                        </div>
                        <div className="mt-2 px-2 py-1 bg-orange-500/10 text-orange-400 rounded-full text-[10px] font-medium border border-orange-500/20">
                            {statusMessage}
                        </div>
                    </div>

                    {/* Timers */}
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="flex flex-col items-center gap-1 bg-white/5 rounded-lg p-2">
                            <Clock size={14} className="text-emerald-400" />
                            <span className="text-[10px] text-gray-500">Session Time</span>
                            <span className="text-base font-bold text-emerald-400" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>{sessionStats.duration}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 bg-white/5 rounded-lg p-2">
                            <Timer size={14} className="text-green-400" />
                            <span className="text-[10px] text-gray-500">Focus Time</span>
                            <span className="text-base font-bold text-green-400" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>{formatTime(focusTimeMs)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* EEG Channel Plots */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 flex-1 min-h-0 flex flex-col overflow-y-auto">
                <h3 className="text-gray-400 text-sm font-medium mb-4 shrink-0">EEG Channels (μV over time)</h3>
                <div className="space-y-3">
                    {channelHistory.map((history, index) => {
                        const channelNum = index + 1;
                        const currentValue = channelValues[index];
                        
                        // Calculate min/max for this channel's scale
                        const values = history.length > 0 ? history : [0];
                        const minVal = Math.min(...values);
                        const maxVal = Math.max(...values);
                        const range = maxVal - minVal || 1;
                        
                        return (
                            <div key={channelNum} className="bg-white/5 rounded-lg p-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-400">CH{channelNum}</span>
                                    <span className="text-xs text-emerald-400" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
                                        {currentValue.toFixed(2)} μV
                                    </span>
                                </div>
                                <svg className="w-full h-12" viewBox="0 0 300 50" preserveAspectRatio="none">
                                    {/* Baseline */}
                                    <line x1="0" y1="25" x2="300" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-white/10" />
                                    
                                    {/* Channel waveform */}
                                    {history.length > 1 && (
                                        <polyline
                                            points={history.map((value, idx) => {
                                                const x = (idx / Math.max(history.length - 1, 1)) * 300;
                                                const normalized = (value - minVal) / range;
                                                const y = 50 - (normalized * 40) - 5; // 5px padding top/bottom
                                                return `${x},${y}`;
                                            }).join(' ')}
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            className="text-emerald-400"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}
                                </svg>
                            </div>
                        );
                    })}
                </div>
            </div>

        </>
    );
};


