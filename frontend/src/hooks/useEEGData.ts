import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:5001';

export const useEEGData = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const calibrationStartRef = useRef<number | null>(null);
    const isCalibratingRef = useRef<boolean>(false);

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
    const [calibrationComplete, setCalibrationComplete] = useState(false);
    const [channelValues, setChannelValues] = useState<number[]>(Array(8).fill(0));
    const [channelHistory, setChannelHistory] = useState<number[][]>(Array(8).fill(null).map(() => []));

    const maxHistoryPoints = 100; // Keep last 100 data points
    const focusScoreHistoryRef = useRef<number[]>([]);

    // Initialize WebSocket connection
    useEffect(() => {
        console.log('[Frontend] Connecting to:', BACKEND_URL);
        socketRef.current = io(BACKEND_URL);

        socketRef.current.on('connect', () => {
            console.log('[Frontend] Connected to backend');
            setIsConnected(true);
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('[Frontend] Connection error:', error);
        });

        socketRef.current.on('eeg_metric', (payload) => {
            const { focus_score, state, eeg_ch1, eeg_ch2, eeg_ch3, eeg_ch4, eeg_ch5, eeg_ch6, eeg_ch7, eeg_ch8 } = payload;
            // console.log('[Frontend] Received metric:', { focus_score, state, hasChannels: {
            //     ch1: !!eeg_ch1, ch2: !!eeg_ch2, ch3: !!eeg_ch3, ch4: !!eeg_ch4,
            //     ch5: !!eeg_ch5, ch6: !!eeg_ch6, ch7: !!eeg_ch7, ch8: !!eeg_ch8
            // }});

            // Update channel values (calculate average of each channel for display)
            const channels = [eeg_ch1, eeg_ch2, eeg_ch3, eeg_ch4, eeg_ch5, eeg_ch6, eeg_ch7, eeg_ch8];
            if (channels.some(ch => ch && ch.length > 0)) {
                const channelAverages = channels.map(ch => {
                    if (!ch || ch.length === 0) return 0;
                    const sum = ch.reduce((a: number, b: number) => a + b, 0);
                    return sum / ch.length;
                });
                
                // Log first time to verify data
                if (channelAverages.some(v => v !== 0)) {
                    console.log('[Frontend] Channel averages:', channelAverages.map((v, i) => `CH${i+1}: ${v.toFixed(2)}`));
                }
                
                setChannelValues(channelAverages);
                
                // Update channel history for plotting
                setChannelHistory(prev => {
                    return prev.map((history, idx) => {
                        const newHistory = [...history, channelAverages[idx]];
                        if (newHistory.length > maxHistoryPoints) {
                            return newHistory.slice(-maxHistoryPoints);
                        }
                        return newHistory;
                    });
                });
            }

            // Skip updates during calibration (backend sends 0s)
            if (state === 'CALIBRATING') {
                return;
            }

            // Mark that we've received actual data
            if (state === 'RUNNING') {
                // Force exit calibration if we receive RUNNING data
                if (isCalibratingRef.current) {
                    setCalibrationProgress(1.0);
                    setCalibrationComplete(true);
                    setIsCalibrating(false);
                    isCalibratingRef.current = false;
                    setIsPlaying(true);
                    startTimeRef.current = Date.now();
                    calibrationStartRef.current = null;
                }

                setHasReceivedData(true);
            }

            // Update focus score
            setFocusScore(focus_score);

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
            console.log('[Frontend] Received calibration_progress:', progress);
            setCalibrationProgress(progress);
        });

        socketRef.current.on('calibration_done', () => {
            console.log('[Frontend] Received calibration_done');
            // Set progress to 100% first
            setCalibrationProgress(1.0);
            setCalibrationComplete(true);

            // Small delay to show 100% completion before hiding overlay
            setTimeout(() => {
                setIsCalibrating(false);
                isCalibratingRef.current = false;
                setIsPlaying(true);
                startTimeRef.current = Date.now();
                calibrationStartRef.current = null;
            }, 500);
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
            isCalibratingRef.current = false;
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
                setCalibrationComplete(false);
                setChannelValues(Array(8).fill(0));
                setChannelHistory(Array(8).fill(null).map(() => []));
                focusScoreHistoryRef.current = [];

                // Start calibration timer
                setIsCalibrating(true);
                isCalibratingRef.current = true;
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

    // Calibration timer - automatically hide overlay after 10 seconds
    useEffect(() => {
        if (!isCalibrating || !calibrationStartRef.current) return;

        // Update progress every 100ms
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - calibrationStartRef.current!;
            const progress = Math.min(elapsed / 10000, 1.0);
            setCalibrationProgress(progress);
        }, 100);

        // Hide overlay after 10 seconds
        const hideTimer = setTimeout(() => {
            console.log('[Frontend] 10 seconds elapsed, hiding calibration overlay');
            setCalibrationProgress(1.0);
            setIsCalibrating(false);
            isCalibratingRef.current = false;
            setCalibrationComplete(true);
            setIsPlaying(true);
            startTimeRef.current = Date.now();
            calibrationStartRef.current = null;
        }, 10000);

        return () => {
            clearInterval(progressInterval);
            clearTimeout(hideTimer);
        };
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
        hasReceivedData,
        calibrationComplete,
        channelValues,
        channelHistory
    };
};
