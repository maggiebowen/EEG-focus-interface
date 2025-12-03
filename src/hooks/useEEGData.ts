import { useState, useEffect, useRef } from 'react';

export const useEEGData = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const startTimeRef = useRef<number | null>(null);

    // Mock Data State
    const [focusScore, setFocusScore] = useState(0);
    const [sessionStats, setSessionStats] = useState({
        duration: '00:00',
        average: 0,
        peak: 0
    });
    const [bandPowers, setBandPowers] = useState({
        delta: 0.1,
        theta: 0.2,
        alpha: 0.4,
        beta: 0.2,
        gamma: 0.1
    });

    const SESSION_DURATION_MS = 25 * 60 * 1000; // 25 minutes

    const toggleSession = () => {
        if (isPlaying) {
            // STOP: Pause timer, freeze values
            setIsPlaying(false);
            startTimeRef.current = null;
        } else {
            // START: Set start time (accounting for already elapsed time)
            setIsPlaying(true);
            startTimeRef.current = Date.now() - elapsedMs;
        }
    };

    // Timer Logic (High frequency for smooth animation)
    useEffect(() => {
        if (!isPlaying) return;

        let animationFrameId: number;

        const tick = () => {
            if (startTimeRef.current !== null) {
                setElapsedMs(Date.now() - startTimeRef.current);
                animationFrameId = requestAnimationFrame(tick);
            }
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying]);

    // Mock Data Update Logic (Once per second)
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            // Update Focus Score
            setFocusScore(prev => {
                const change = (Math.random() - 0.4) * 5;
                return Math.min(100, Math.max(0, prev + change));
            });

            // Update Band Powers
            setBandPowers({
                delta: 0.1 + Math.random() * 0.05,
                theta: 0.15 + Math.random() * 0.1,
                alpha: 0.3 + Math.random() * 0.2,
                beta: 0.15 + Math.random() * 0.1,
                gamma: 0.05 + Math.random() * 0.05,
            });

            // Update Stats (Average/Peak)
            setSessionStats(prev => ({
                ...prev,
                average: (prev.average * 10 + focusScore) / 11,
                peak: Math.max(prev.peak, focusScore)
            }));

        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, focusScore]);

    // Derived Values
    const progress = Math.min(1, elapsedMs / SESSION_DURATION_MS);

    // Format Duration for Display
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const formattedDuration = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Update session stats duration
    useEffect(() => {
        setSessionStats(prev => ({ ...prev, duration: formattedDuration }));
    }, [formattedDuration]);

    return {
        isPlaying,
        toggleSession,
        focusScore,
        sessionStats,
        bandPowers,
        progress
    };
};
