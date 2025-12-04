import { useState, useEffect } from 'react';

export const useMockData = (isPlaying: boolean) => {
    const [focusScore, setFocusScore] = useState(0);
    const [bandPowers, setBandPowers] = useState({
        delta: 0.1,
        theta: 0.2,
        alpha: 0.4,
        beta: 0.2,
        gamma: 0.1
    });
    const [sessionStats, setSessionStats] = useState({
        average: 0,
        peak: 0
    });
    const [alphaHistory, setAlphaHistory] = useState<number[]>([]);
    const [focusTimeMs, setFocusTimeMs] = useState(0);
    const maxHistoryPoints = 60; // Keep last 60 data points

    useEffect(() => {
        if (!isPlaying) return;

        // Update frequently (100ms) for smooth streaming effect
        const interval = setInterval(() => {
            setFocusScore(prev => {
                // Random walk
                const change = (Math.random() - 0.45) * 8;
                return Math.min(100, Math.max(0, prev + change));
            });

            setBandPowers(prev => {
                const newAlpha = Math.random();

                // Update alpha history
                setAlphaHistory(history => {
                    const newHistory = [...history, newAlpha];
                    // Keep only last maxHistoryPoints
                    if (newHistory.length > maxHistoryPoints) {
                        return newHistory.slice(-maxHistoryPoints);
                    }
                    return newHistory;
                });

                return {
                    delta: Math.random(),
                    theta: Math.random(),
                    alpha: newAlpha,
                    beta: Math.random(),
                    gamma: Math.random(),
                };
            });

            // Update stats
            setSessionStats(prev => ({
                average: (prev.average * 50 + focusScore) / 51,
                peak: Math.max(prev.peak, focusScore)
            }));

            // Track focus time (when score > 50)
            if (focusScore > 50) {
                setFocusTimeMs(prev => prev + 100);
            }

        }, 100); // 10Hz updates

        return () => clearInterval(interval);
    }, [isPlaying, focusScore]);

    return { focusScore, bandPowers, sessionStats, alphaHistory, focusTimeMs };
};
