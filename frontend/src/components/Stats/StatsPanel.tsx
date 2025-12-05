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
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ focusScore, sessionStats, alphaHistory, focusTimeMs, statusMessage }) => {


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

            {/* Alpha Wave Graph */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 flex-1 min-h-0 flex flex-col">
                <h3 className="text-gray-400 text-sm font-medium mb-4 shrink-0">Alpha Waves (8-13 Hz)</h3>
                <div className="flex-1 relative min-h-0 flex gap-2">
                    {/* Y-axis labels */}
                    <div className="flex flex-col justify-between text-xs text-gray-500 w-12 shrink-0">
                        <span>100%</span>
                        <span>50%</span>
                        <span>0%</span>
                    </div>
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="25" x2="300" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-white/10" />
                        <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-white/10" />
                        <line x1="0" y1="75" x2="300" y2="75" stroke="currentColor" strokeWidth="0.5" className="text-white/10" />

                        {/* Alpha wave line */}
                        {alphaHistory.length > 1 && (
                            <polyline
                                points={alphaHistory.map((value, index) => {
                                    const x = (index / (alphaHistory.length - 1)) * 300;
                                    const y = 100 - (value * 100);
                                    return `${x},${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-emerald-400"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {/* Gradient fill under line */}
                        {alphaHistory.length > 1 && (
                            <>
                                <defs>
                                    <linearGradient id="alphaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <polygon
                                    points={`0,100 ${alphaHistory.map((value, index) => {
                                        const x = (index / (alphaHistory.length - 1)) * 300;
                                        const y = 100 - (value * 100);
                                        return `${x},${y}`;
                                    }).join(' ')} 300,100`}
                                    fill="url(#alphaGradient)"
                                />
                            </>
                        )}
                    </svg>
                </div>

                {/* Current alpha value */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Current Alpha</span>
                    <span className="text-sm font-semibold text-emerald-400" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
                        {alphaHistory.length > 0 ? (alphaHistory[alphaHistory.length - 1] * 100).toFixed(1) : '0.0'}%
                    </span>
                </div>
            </div>

        </>
    );
};


