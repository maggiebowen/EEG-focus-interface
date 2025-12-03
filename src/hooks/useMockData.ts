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

    useEffect(() => {
        if (!isPlaying) return;

        // Update frequently (100ms) for smooth streaming effect
        const interval = setInterval(() => {
            setFocusScore(prev => {
                // Random walk
                const change = (Math.random() - 0.45) * 8;
                return Math.min(100, Math.max(0, prev + change));
            });

            setBandPowers({
                delta: Math.random(),
                theta: Math.random(),
                alpha: Math.random(),
                beta: Math.random(),
                gamma: Math.random(),
            });

            // Update stats
            setSessionStats(prev => ({
                average: (prev.average * 50 + focusScore) / 51,
                peak: Math.max(prev.peak, focusScore)
            }));

        }, 100); // 10Hz updates

        return () => clearInterval(interval);
    }, [isPlaying, focusScore]);

    return { focusScore, bandPowers, sessionStats };
};
