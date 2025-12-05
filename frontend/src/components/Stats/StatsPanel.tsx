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
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ focusScore, sessionStats, alphaHistory, focusTimeMs, statusMessage, channelValues }) => {


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
            {/* Focus Gauge */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center min-h-[200px] shrink-0">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-white/5"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 56}
                            strokeDashoffset={2 * Math.PI * 56 * (1 - focusScore / 100)}
                            className={`${getScoreColor(focusScore)} transition-all duration-300 ease-out`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold" style={{ color: '#664C5A' }}>{Math.round(focusScore)}%</span>
                        <span className="text-xs mt-0.5" style={{ color: '#664C5A' }}>Focus Score</span>
                    </div>
                </div>
                <div className="mt-4 px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-full text-xs font-medium border border-orange-500/20">
                    {statusMessage}
                </div>
            </div>

            {/* Timers */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 shrink-0">
                <h3 className="text-gray-400 text-sm font-medium mb-4">Time Tracking</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center gap-2 bg-white/5 rounded-lg p-3">
                        <Clock size={16} className="text-emerald-400" />
                        <span className="text-xs text-gray-500">Session Time</span>
                        <span className="text-lg font-bold text-emerald-400" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>{sessionStats.duration}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-white/5 rounded-lg p-3">
                        <Timer size={16} className="text-green-400" />
                        <span className="text-xs text-gray-500">Focus Time</span>
                        <span className="text-lg font-bold text-green-400" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>{formatTime(focusTimeMs)}</span>
                    </div>
                </div>
            </div>

            {/* EEG Channel Values */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 flex-1 min-h-0 flex flex-col">
                <h3 className="text-gray-400 text-sm font-medium mb-4 shrink-0">EEG Channel Values (μV)</h3>
                <div className="grid grid-cols-2 gap-3 flex-1">
                    {channelValues.map((value, index) => {
                        const channelNum = index + 1;
                        const absValue = Math.abs(value);
                        const displayValue = absValue.toFixed(2);
                        
                        // Color based on signal strength
                        let color = 'text-gray-400';
                        if (absValue > 50) color = 'text-red-400';
                        else if (absValue > 25) color = 'text-orange-400';
                        else if (absValue > 10) color = 'text-yellow-400';
                        else if (absValue > 0) color = 'text-emerald-400';
                        
                        return (
                            <div key={channelNum} className="bg-white/5 rounded-lg p-3 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-500 mb-1">CH{channelNum}</span>
                                <span className={`text-lg font-bold ${color}`} style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
                                    {displayValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500 text-center">
                    Real-time EEG signal amplitude
                </div>
            </div>

        </>
    );
};


