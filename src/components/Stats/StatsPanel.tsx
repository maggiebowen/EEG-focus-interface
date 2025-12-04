import React from 'react';
import { Activity, Clock, Zap } from 'lucide-react';
import clsx from 'clsx';

interface StatsPanelProps {
    focusScore: number;
    bandPowers: {
        delta: number;
        theta: number;
        alpha: number;
        beta: number;
        gamma: number;
    };
    sessionStats: {
        duration: string;
        average: number;
        peak: number;
    };
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ focusScore, bandPowers, sessionStats }) => {
    const getScoreColor = (score: number) => {
        if (score < 25) return 'text-red-500';
        if (score < 50) return 'text-orange-500';
        if (score < 75) return 'text-yellow-500';
        return 'text-primary';
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

            {/* Session Stats */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 shrink-0">
                <h3 className="text-gray-400 text-xs font-medium mb-4">Session Stats</h3>
                <div className="grid grid-cols-3 gap-2">
                    <StatItem icon={<Clock size={14} />} label="Duration" value={sessionStats.duration} color="text-emerald-400" />
                    <StatItem icon={<Activity size={14} />} label="Average" value={sessionStats.average.toFixed(1)} color="text-yellow-400" />
                    <StatItem icon={<Zap size={14} />} label="Peak" value={sessionStats.peak.toFixed(1)} color="text-purple-400" />
                </div>
            </div>

            {/* Band Powers */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5 flex-1 min-h-0 flex flex-col">
                <h3 className="text-gray-400 text-xs font-medium mb-4 shrink-0">Band Powers</h3>
                <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto">
                    <BandItem label="Delta" range="0.5-4 Hz" value={bandPowers.delta} color="bg-purple-500" />
                    <BandItem label="Theta" range="4-8 Hz" value={bandPowers.theta} color="bg-blue-500" />
                    <BandItem label="Alpha" range="8-13 Hz" value={bandPowers.alpha} color="bg-emerald-500" />
                    <BandItem label="Beta" range="13-32 Hz" value={bandPowers.beta} color="bg-yellow-500" />
                    <BandItem label="Gamma" range="32+ Hz" value={bandPowers.gamma} color="bg-red-500" />
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

const BandItem = ({ label, range, value, color }: { label: string, range: string, value: number, color: string }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
                <div className={clsx("w-2 h-2 rounded-full", color)} />
                <span className="font-medium text-gray-300">{label}</span>
                <span className="text-gray-500 text-xs">{range}</span>
            </div>
            <span className="font-mono text-gray-400">{(value * 100).toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
                className={clsx("h-full rounded-full transition-all duration-300", color)}
                style={{ width: `${value * 100}%` }}
            />
        </div>
    </div>
);
