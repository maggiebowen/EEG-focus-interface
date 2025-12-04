import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const accumulatedTimeRef = useRef<number>(0);

    const toggleTimer = useCallback(() => {
        if (isPlaying) {
            // STOP
            setIsPlaying(false);
            if (startTimeRef.current !== null) {
                accumulatedTimeRef.current += Date.now() - startTimeRef.current;
            }
            startTimeRef.current = null;
        } else {
            // START
            setIsPlaying(true);
            startTimeRef.current = Date.now();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!isPlaying) return;

        let animationFrameId: number;

        const tick = () => {
            if (startTimeRef.current !== null) {
                const currentSessionTime = Date.now() - startTimeRef.current;
                setElapsedMs(accumulatedTimeRef.current + currentSessionTime);
                animationFrameId = requestAnimationFrame(tick);
            }
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying]);

    // Format Duration
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const formattedTime = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    return { isPlaying, toggleTimer, elapsedMs, formattedTime };
};
