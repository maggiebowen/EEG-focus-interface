"""
Flask server implementing Scientific Alpha Neurofeedback Protocol (Z-Score).
FIXED: Implemented Sigmoid Mapping for 0-100% Focus Score.
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading
import time
import numpy as np
from scipy import signal
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
from brainflow.data_filter import DataFilter, FilterTypes
import sys

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- GLOBAL STATE ---
board = None
streaming = False
stream_thread = None

class NeuroState:
    IDLE = 0
    CALIBRATING = 1
    RUNNING = 2

current_state = NeuroState.IDLE

# Parametri Baseline
mu_baseline = 0.0     
sigma_baseline = 1.0  
calibration_buffer = [] 
# Sliding buffer for 10s window and per-second ticks
window_buffer = None  # shape (n_channels, n_samples)
WINDOW_SECONDS = 10
TIME_STEP_SECONDS = 1

# Parametri Runtime
current_z_score = 0.0
calibration_start_time = 0
# Baseline: first 10 seconds of buffer
CALIBRATION_DURATION = 10 

class KnightBoardServer:
    def __init__(self, serial_port: str, num_channels: int):
        self.params = BrainFlowInputParams()
        self.params.serial_port = serial_port
        self.num_channels = num_channels
        try:
            self.board_shim = BoardShim(BoardIds.NEUROPAWN_KNIGHT_BOARD.value, self.params)
            self.board_id = self.board_shim.get_board_id()
            self.eeg_channels = self.board_shim.get_exg_channels(self.board_id)
            self.sampling_rate = self.board_shim.get_sampling_rate(self.board_id)
            self.is_streaming = False
        except Exception as e:
            raise e
        
    def start_stream(self):
        if self.is_streaming: return
        self.board_shim.prepare_session()
        try: self.board_shim.start_stream(450000)
        except: pass
        time.sleep(2)
        
        # --- CONFIGURAZIONE CANALI (IMPORTANTE) ---
        print("Configuring hardware channels...")
        for x in range(1, self.num_channels + 1):
            try:
                # chon_ChNumber_Gain (12 = Gain 24x solitamente su ADS1299)
                self.board_shim.config_board(f"chon_{x}_12")
                self.board_shim.config_board(f"rldadd_{x}")
            except: pass
            
        self.is_streaming = True
        
    def stop_stream(self):
        if not self.is_streaming: return
        self.is_streaming = False
        try:
            self.board_shim.stop_stream()
            self.board_shim.release_session()
        except: pass
        
    def get_window_data(self, duration_sec=2):
        num_samples = int(self.sampling_rate * duration_sec)
        data = self.board_shim.get_current_board_data(num_samples)
        if data.size == 0 or data.shape[1] < num_samples:
            return None
        return data[self.eeg_channels, :]

# --- SIGNAL PROCESSING ---

def compute_alpha_power(eeg_window, fs):
    """
    Calcola la potenza Alpha in MICROVOLTS^2 utilizzando il metodo di Welch e l'integrazione trapezoidale.
    """
    n_channels = eeg_window.shape[0]
    alpha_powers = []

    for ch in range(n_channels):
        channel_data = eeg_window[ch] * 1e6
        channel_data = signal.detrend(channel_data)
        freqs, psd = signal.welch(channel_data, fs, nperseg=int(fs), noverlap=int(fs/2))
        idx_alpha = (freqs >= 8) & (freqs <= 12)
        alpha_power = float(np.trapz(psd[idx_alpha], freqs[idx_alpha])) if np.any(idx_alpha) else 0.0
        alpha_powers.append(alpha_power)

    return np.array(alpha_powers)


def detect_bad_eeg_channels(data):
   
    var_low_thresh = 1e-6
    var_outlier_thresh = 0.5

    vars_ = np.var(data, axis=1, ddof=0)
    q1 = np.percentile(vars_, 25)
    q3 = np.percentile(vars_, 75)
    iqr_val = q3 - q1
    lower_bound = q1 - var_outlier_thresh * iqr_val
    upper_bound = q3 + var_outlier_thresh * iqr_val

    bad_mask = (vars_ < max(var_low_thresh, lower_bound)) | (vars_ > upper_bound)
    bad_idx = np.where(bad_mask)[0].tolist()
    return bad_idx

def stream_data_loop():
    global board, streaming, current_state
    global mu_baseline, sigma_baseline, calibration_buffer
    global current_z_score
    
    print("Neurofeedback Loop Started")
    print(f"Initial state: {current_state}")
    update_interval = 0.1 
    last_compute_ts = 0.0
    data_received_count = 0
    
    while streaming:
        start_loop = time.time()
        
        if board and board.is_streaming:
            # Pull 1s of new data and maintain 10s sliding window
            eeg_chunk = board.get_window_data(duration_sec=TIME_STEP_SECONDS)
            
            if eeg_chunk is not None:
                data_received_count += 1
                if data_received_count % 10 == 1:  # Log every 10th chunk
                    print(f"Data chunks received: {data_received_count}, shape: {eeg_chunk.shape}")
                
                fs = board.sampling_rate
                # Initialize buffer
                if window_buffer is None:
                    # allocate n_channels x (fs*WINDOW_SECONDS)
                    total_samples = int(fs * WINDOW_SECONDS)
                    globals()['window_buffer'] = np.zeros((eeg_chunk.shape[0], total_samples), dtype=np.float64)
                    last_compute_ts = time.time()
                # Shift and append chunk to maintain sliding window
                chunk_len = eeg_chunk.shape[1]
                if chunk_len > window_buffer.shape[1]:
                    eeg_chunk = eeg_chunk[:, -window_buffer.shape[1]:]
                    chunk_len = eeg_chunk.shape[1]
                window_buffer[:, :-chunk_len] = window_buffer[:, chunk_len:]
                window_buffer[:, -chunk_len:] = eeg_chunk

                # Preprocessing: bandpass 2-30Hz per channel on full window
                for i in range(window_buffer.shape[0]):
                    DataFilter.perform_bandpass(window_buffer[i], fs, 16.0, 28.0, 4, FilterTypes.BUTTERWORTH.value, 0)

                # Detect bad channels on current 10s window
                bad_channels = detect_bad_eeg_channels(window_buffer)
                good_mask = np.ones(window_buffer.shape[0], dtype=bool)
                if bad_channels:
                    for idx in bad_channels:
                        if 0 <= idx < good_mask.size:
                            good_mask[idx] = False

                # Compute once per second on the 10s window
                now = time.time()
                current_alpha = None # Reset per sicurezza
                
                if (now - last_compute_ts) >= TIME_STEP_SECONDS:
                    last_compute_ts = now
                    alpha_per_ch = compute_alpha_power(window_buffer, fs)
                    current_alpha = float(np.mean(alpha_per_ch[good_mask])) if np.any(good_mask) else float(np.mean(alpha_per_ch))
                    print(f"[STATE: {['IDLE', 'CALIBRATING', 'RUNNING'][current_state]}] Computed alpha: {current_alpha:.2f} uV^2")
                
                # --- LOGICA STATI ---
                
                if current_state == NeuroState.CALIBRATING:
                    if current_alpha is not None: # Solo se abbiamo calcolato un nuovo dato
                        calibration_buffer.append(current_alpha)
                        elapsed = time.time() - calibration_start_time
                        progress = min(elapsed / CALIBRATION_DURATION, 1.0)
                        
                        socketio.emit('calibration_progress', {'progress': progress})
                        print(f"→ Emitted calibration_progress: {progress:.2f}")
                        print(f"→ Emitted CALIBRATING data: alpha={current_alpha:.2f}")
                        
                        if int(elapsed * 10) % 10 == 0:
                            print(f"Calibrating... {int(elapsed)}s (Current Alpha: {current_alpha:.2f} uV^2)")
                        
                        if elapsed >= CALIBRATION_DURATION:
                            if len(calibration_buffer) > 0:
                                data_clean = np.array(calibration_buffer)
                                mu_baseline = np.mean(data_clean)
                                sigma_baseline = np.std(data_clean)
                                
                                print(f"\n{'='*60}")
                                print(f"BASELINE ACQUIRED: μ={mu_baseline:.2f}, σ={sigma_baseline:.2f}")
                                print(f"Transitioning to RUNNING state")
                                print(f"{'='*60}\n")
                                current_state = NeuroState.RUNNING
                                socketio.emit('calibration_done', {'mu': mu_baseline, 'sigma': sigma_baseline})
                                print(f"→ Emitted calibration_done event")
                            else:
                                print("ERROR: No calibration data collected!")
                                current_state = NeuroState.IDLE

                elif current_state == NeuroState.RUNNING:
                    # Z-Score on per-second compute only
                    if current_alpha is not None:
                        # 1. Calcolo Z-Score grezzo
                        z_raw = (current_alpha - mu_baseline) / (sigma_baseline + 1e-6)
                        
                        # 2. Clamping morbido (esteso a -4 / +4 per la sigmoide)
                        z_clamped = max(-4.0, min(z_raw, 4.0))
                        
                        # 3. Smoothing esponenziale
                        alpha_smooth = 0.2
                        current_z_score = (alpha_smooth * z_clamped) + ((1 - alpha_smooth) * current_z_score)
                        
                        # --- MAPPING SIGMOIDE (0-100%) ---
                        slope = 1.0 # Regola qui la difficoltà (0.8 = difficile, 1.5 = facile)
                        
                        # Funzione Sigmoide
                        sigmoid_val = 1 / (1 + np.exp(-slope * current_z_score))
                        
                        # Conversione in intero 0-100
                        percent_score = int(sigmoid_val * 100)
                        
                        payload = {
                            'timestamp': time.time(),
                            'focus_score': percent_score, # Ora è 0-100
                            'eeg_ch1': window_buffer[0].tolist(),
                            'eeg_ch2': window_buffer[1].tolist(),
                            'eeg_ch3': window_buffer[2].tolist(),
                            'eeg_ch4': window_buffer[3].tolist(),
                            'eeg_ch5': window_buffer[4].tolist(),
                            'eeg_ch6': window_buffer[5].tolist(),
                            'eeg_ch7': window_buffer[6].tolist(),
                            'eeg_ch8': window_buffer[7].tolist(),
                            'state': 'RUNNING'
                        }
                        print(f"→ RUNNING: Alpha={current_alpha:.2f} | Z={current_z_score:.2f} | Score={percent_score}% | Bad={bad_channels} | Ch1 samples={window_buffer[0]}")
                        socketio.emit('eeg_metric', payload)
        
        elapsed_loop = time.time() - start_loop
        time.sleep(max(0, update_interval - elapsed_loop))

# --- API ---

@app.route('/api/calibrate', methods=['POST'])
def start_calibration():
    global current_state, calibration_start_time, calibration_buffer
    current_state = NeuroState.CALIBRATING
    calibration_buffer = []
    calibration_start_time = time.time()
    print("--- STARTING PROTOCOL STEP 2: BASELINE ACQUISITION ---")
    return jsonify({'message': 'Calibration started'})

@app.route('/api/start', methods=['POST'])
def start_stream():
    global board, streaming, stream_thread, current_state, calibration_start_time, calibration_buffer
    if not board: return jsonify({'error': 'Board error'}), 400
    
    board.start_stream()
    streaming = True
    
    # Immediately start calibration when stream starts
    current_state = NeuroState.CALIBRATING
    calibration_buffer = []
    calibration_start_time = time.time()
    print("--- STREAMING AND CALIBRATION STARTED ---")
    
    if stream_thread is None or not stream_thread.is_alive():
        stream_thread = threading.Thread(target=stream_data_loop, daemon=True)
        stream_thread.start()
        
    return jsonify({'message': 'Streaming and calibration started'})

@app.route('/api/stop', methods=['POST'])
def stop_stream():
    global board, streaming
    streaming = False
    if board: board.stop_stream()
    return jsonify({'message': 'Stopped'})

@app.route('/api/status', methods=['GET'])
def get_status():
    global current_state, mu_baseline
    state_str = "IDLE"
    if current_state == NeuroState.CALIBRATING: state_str = "CALIBRATING"
    elif current_state == NeuroState.RUNNING: state_str = "RUNNING"
    return jsonify({'connected': board is not None, 'state': state_str, 'baseline_alpha': mu_baseline})

if __name__ == '__main__':
    serial_port = "COM3"
    if sys.platform == "darwin": serial_port = "/dev/cu.usbserial-A5069RR4"
    if len(sys.argv) > 1: serial_port = sys.argv[1]
    
    try:
        board = KnightBoardServer(serial_port, 8)
        print(f"Server Ready on {serial_port}. Protocol: Alpha Z-Score (uV Scaled).")
        socketio.run(app, host='0.0.0.0', port=5001, debug=False)
    except Exception as e:
        print(f"Error: {e}")