#!/usr/bin/env python3
"""
Simple Socket.IO client to test if the backend is emitting data.
Run this while the server is running to see what data is being sent.
"""
import socketio
import time

sio = socketio.Client()

@sio.event
def connect():
    print("✓ Connected to server!")
    print("Waiting for eeg_metric events...")
    print("-" * 60)

@sio.event
def disconnect():
    print("✗ Disconnected from server")

@sio.on('eeg_metric')
def on_eeg_metric(data):
    state = data.get('state', 'UNKNOWN')
    focus = data.get('focus_score', 0)
    alpha = data.get('raw_alpha', 0)
    z = data.get('z_score', 0)
    
    icon = "🔄" if state == "CALIBRATING" else "✓"
    print(f"{icon} [{state}] Focus: {focus:3d}% | Alpha: {alpha:6.2f} | Z: {z:+.2f}")

@sio.on('calibration_progress')
def on_calibration_progress(data):
    progress = data.get('progress', 0)
    bar_length = 40
    filled = int(bar_length * progress)
    bar = "█" * filled + "░" * (bar_length - filled)
    print(f"📊 Calibration: [{bar}] {progress*100:.0f}%")

@sio.on('calibration_done')
def on_calibration_done(data):
    mu = data.get('mu', 0)
    sigma = data.get('sigma', 0)
    print("=" * 60)
    print(f"✓ CALIBRATION COMPLETE!")
    print(f"  Baseline μ = {mu:.2f}, σ = {sigma:.2f}")
    print("=" * 60)

if __name__ == '__main__':
    try:
        print("Connecting to http://localhost:5001...")
        sio.connect('http://localhost:5001')
        
        # Keep running
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\nStopping test client...")
        sio.disconnect()
    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure the server is running on port 5001!")
