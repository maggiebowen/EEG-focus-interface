import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:5000';
const CALIBRATION_DURATION_MS = 15000; // 15 seconds

export const useEEGData = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const calibrationStartRef = useRef<number | null>(null);

    // Real EEG Data State
    const [focusScore, setFocusScore] = useState(0);
    const [sessionStats, setSessionStats] = useState({
        average: 0,
        peak: 0
    });
    const [alphaHistory, setAlphaHistory] = useState<number[]>([]);
    const [focusTimeMs, setFocusTimeMs] = useState(0);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibrationProgress, setCalibrationProgress] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [hasReceivedData, setHasReceivedData] = useState(false);
    
    const maxHistoryPoints = 60; // Keep last 60 data points
    const focusScoreHistoryRef = useRef<number[]>([]);
    const alphaMinRef = useRef<number>(Infinity);
    const alphaMaxRef = useRef<number>(-Infinity);

    // Initialize WebSocket connection
    useEffect(() => {
        socketRef.current = io(BACKEND_URL);

        socketRef.current.on('connect', () => {
            setIsConnected(true);
        });

        socketRef.current.on('eeg_metric', (payload) => {
            const { focus_score, raw_alpha, state } = payload;
            
            // Skip updates during calibration (backend sends 0s)
            if (state === 'CALIBRATING') {
                return;
            }
            
            // Mark that we've received actual data
            if (state === 'RUNNING') {
                // Force exit calibration if we receive RUNNING data
                if (isCalibrating) {
                    setIsCalibrating(false);
                    setIsPlaying(true);
                    startTimeRef.current = Date.now();
                    calibrationStartRef.current = null;
                }
                
                setHasReceivedData(true);
            }
            
            // Update focus score
            setFocusScore(focus_score);
            
            // Track min/max for normalization
            if (raw_alpha < alphaMinRef.current) alphaMinRef.current = raw_alpha;
            if (raw_alpha > alphaMaxRef.current) alphaMaxRef.current = raw_alpha;
            
            // Normalize alpha to 0-1 range for display
            const range = alphaMaxRef.current - alphaMinRef.current;
            const normalizedAlpha = range > 0 
                ? (raw_alpha - alphaMinRef.current) / range 
                : 0.5;
            
            // Update alpha history with normalized value
            setAlphaHistory(prev => {
                const newHistory = [...prev, normalizedAlpha];
                if (newHistory.length > maxHistoryPoints) {
                    return newHistory.slice(-maxHistoryPoints);
                }
                return newHistory;
            });

            // Track focus score history for average calculation
            focusScoreHistoryRef.current.push(focus_score);
            if (focusScoreHistoryRef.current.length > 100) {
                focusScoreHistoryRef.current.shift();
            }

            // Update session stats
            setSessionStats(prev => {
                const average = focusScoreHistoryRef.current.length > 0
                    ? focusScoreHistoryRef.current.reduce((a, b) => a + b, 0) / focusScoreHistoryRef.current.length
                    : 0;
                return {
                    average,
                    peak: Math.max(prev.peak, focus_score)
                };
            });

            // Track focus time (when score > 50)
            if (focus_score > 50) {
                setFocusTimeMs(prev => prev + 100);
            }
        });

        socketRef.current.on('calibration_progress', ({ progress }) => {
            setCalibrationProgress(progress);
        });

        socketRef.current.on('calibration_done', () => {
            // Force exit calibration and start session
            setIsCalibrating(false);
            setIsPlaying(true);
            setCalibrationProgress(1.0);
            startTimeRef.current = Date.now();
            calibrationStartRef.current = null;
        });

        socketRef.current.on('disconnect', () => {
            setIsConnected(false);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const toggleSession = async () => {
        if (isPlaying) {
            // STOP: Stop streaming
            setIsPlaying(false);
            startTimeRef.current = null;
            setIsCalibrating(false);
            calibrationStartRef.current = null;
            setHasReceivedData(false);
            try {
                await fetch(`${BACKEND_URL}/api/stop`, { method: 'POST' });
            } catch (error) {
                console.error('Error stopping stream:', error);
            }
        } else {
            // START: Start streaming and calibration
            try {
                // Reset state
                setFocusScore(0);
                setAlphaHistory([]);
                setSessionStats({ average: 0, peak: 0 });
                setFocusTimeMs(0);
                setHasReceivedData(false);
                focusScoreHistoryRef.current = [];
                alphaMinRef.current = Infinity;
                alphaMaxRef.current = -Infinity;
                
                // Start calibration timer
                setIsCalibrating(true);
                setCalibrationProgress(0);
                calibrationStartRef.current = Date.now();
                
                // Start streaming (calibration now starts automatically on backend)
                await fetch(`${BACKEND_URL}/api/start`, { method: 'POST' });
                
            } catch (error) {
                console.error('Error starting stream:', error);
                setIsCalibrating(false);
                calibrationStartRef.current = null;
            }
        }
    };

    // Calibration timer - enforce minimum 15 seconds
    // Calibration timer - track progress visually but wait for backend signal
    useEffect(() => {
        if (!isCalibrating || !calibrationStartRef.current) return;

        const interval = setInterval(() => {
            const elapsed = Date.now() - calibrationStartRef.current!;
            
            // Cap progress at 99% - only backend calibration_done can complete it
            const progress = Math.min(elapsed / CALIBRATION_DURATION_MS, 0.99);
            setCalibrationProgress(progress);
        }, 100);

        return () => clearInterval(interval);
    }, [isCalibrating]);

    // Session timer - update elapsed time when playing
    useEffect(() => {
        if (!isPlaying || !startTimeRef.current) return;

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current!;
            setElapsedMs(elapsed);
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying]);

    return {
        isPlaying,
        toggleSession,
        focusScore,
        sessionStats,
        alphaHistory,
        focusTimeMs,
        elapsedMs,
        isCalibrating,
        calibrationProgress,
        isConnected,
        hasReceivedData
    };
};
