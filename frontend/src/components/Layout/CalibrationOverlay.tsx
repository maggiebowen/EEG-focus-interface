import React from 'react';
import { Brain } from 'lucide-react';

interface CalibrationOverlayProps {
    progress: number;
}

export const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({ progress }) => {
    const secondsRemaining = Math.ceil((1 - progress) * 15);
    
    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-8 max-w-md px-8">
                {/* Animated Brain Icon */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                    <div className="relative bg-gradient-to-br from-emerald-400 to-green-600 rounded-full w-24 h-24 flex items-center justify-center">
                        <Brain size={48} className="text-white" />
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                        Calibrating EEG Device
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Please remain still with your eyes closed and relax
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                            {Math.round(progress * 100)}% Complete
                        </span>
                        <span className="text-emerald-400 font-mono font-bold">
                            {secondsRemaining}s
                        </span>
                    </div>
                </div>

                {/* Instructions */}
                <div className="text-left space-y-2 text-sm text-gray-400 bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="font-semibold text-white mb-2">During Calibration:</p>
                    <ul className="space-y-1.5 list-disc list-inside">
                        <li>Close your eyes and stay relaxed</li>
                        <li>Breathe normally and clear your mind</li>
                        <li>Avoid moving or thinking intensely</li>
                        <li>This establishes your baseline brain activity</li>
                    </ul>
                </div>

                {/* Pulse Animation */}
                <div className="flex justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
