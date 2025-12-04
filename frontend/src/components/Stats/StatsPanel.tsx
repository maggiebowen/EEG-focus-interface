import React from 'react';
import { Clock, Timer } from 'lucide-react';
import clsx from 'clsx';

interface StatsPanelProps {
    focusScore: number;
    sessionStats: {
        duration: string;
        average: number;
        peak: number;
    };
    alphaHistory: number[];
    focusTimeMs: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ focusScore, sessionStats, alphaHistory, focusTimeMs }) => {
    const [updateCount, setUpdateCount] = React.useState(0);
    
    // Track updates
    React.useEffect(() => {
        setUpdateCount(prev => prev + 1);
    }, [focusScore]);
    
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
                        <span className="text-3xl font-bold">{Math.round(focusScore)}</span>
                        <span className="text-xs text-gray-400 mt-0.5">Focus</span>
                    </div>
                </div>
                <div className="mt-4 px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-full text-xs font-medium border border-orange-500/20">
                    Building Focus
                </div>
            </div>

            {/* Timers */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 shrink-0">
                <h3 className="text-gray-400 text-xs font-medium mb-4">Time Tracking</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center gap-2 bg-white/5 rounded-lg p-3">
                        <Clock size={16} className="text-emerald-400" />
                        <span className="text-xs text-gray-500">Session Time</span>
                        <span className="text-lg font-bold font-mono text-emerald-400">{sessionStats.duration}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-white/5 rounded-lg p-3">
                        <Timer size={16} className="text-green-400" />
                        <span className="text-xs text-gray-500">Focus Time</span>
                        <span className="text-lg font-bold font-mono text-green-400">{formatTime(focusTimeMs)}</span>
                    </div>
                </div>
            </div>

            {/* Alpha Wave Graph */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 flex-1 min-h-0 flex flex-col">
                <h3 className="text-gray-400 text-xs font-medium mb-4 shrink-0">Alpha Waves (8-13 Hz)</h3>
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
                    <span className="text-sm font-mono font-semibold text-emerald-400">
                        {alphaHistory.length > 0 ? (alphaHistory[alphaHistory.length - 1] * 100).toFixed(1) : '0.0'}%
                    </span>
                </div>
            </div>

            {/* Debug Info Panel */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 shrink-0">
                <h3 className="text-gray-400 text-xs font-medium mb-3">Data Flow (Debug)</h3>
                <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Focus Score:</span>
                        <span className={focusScore > 0 ? "text-green-400" : "text-gray-400"}>{focusScore}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Updates:</span>
                        <span className="text-blue-400">{updateCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Alpha History:</span>
                        <span className="text-purple-400">{alphaHistory.length} points</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Avg Score:</span>
                        <span className="text-yellow-400">{sessionStats.average.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Peak:</span>
                        <span className="text-orange-400">{sessionStats.peak}</span>
                    </div>
                </div>
            </div>
        </>
    );
};

const StatItem = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => (
    <div className="flex flex-col items-center gap-2">
        <div className={clsx("p-2 rounded-full bg-white/5", color)}>{icon}</div>
        <span className="text-lg font-semibold">{value}</span>
        <span className="text-xs text-gray-500">{label}</span>
    </div>
);
