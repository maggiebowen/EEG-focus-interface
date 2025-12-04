"""
Flask server implementing Scientific Alpha Neurofeedback Protocol (Z-Score).
FIXED: Corrected np.trapz syntax in compute_alpha_power.
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

# Parametri Runtime
current_z_score = 0.0
calibration_start_time = 0
CALIBRATION_DURATION = 15 

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
        # Convertiamo Volts -> Microvolts (uV) per avere numeri leggibili
        channel_data = eeg_window[ch] * 1e6 
        
        # 1. Detrending
        channel_data = signal.detrend(channel_data)
        
        # 2. Welch PSD
        freqs, psd = signal.welch(channel_data, fs, nperseg=int(fs), noverlap=int(fs/2))
        
        # 3. Estrazione Banda Alpha (8-12 Hz)
        idx_alpha = np.logical_and(freqs >= 8, freqs <= 12)
        
        # 4. Integrazione Trapezoidale (FIXED)
        # Usiamo np.trapz(y, x). y = psd selezionata, x = frequenze selezionate
        if np.any(idx_alpha): # Controllo di sicurezza se l'array non è vuoto
            alpha_power = np.trapz(psd[idx_alpha], freqs[idx_alpha])
        else:
            alpha_power = 0.0
            
        alpha_powers.append(alpha_power)
        
    return np.mean(alpha_powers)

def stream_data_loop():
    global board, streaming, current_state
    global mu_baseline, sigma_baseline, calibration_buffer
    global current_z_score
    
    print("Neurofeedback Loop Started")
    update_interval = 0.5 
    
    while streaming:
        start_loop = time.time()
        
        if board and board.is_streaming:
            eeg_window = board.get_window_data(duration_sec=2)
            
            if eeg_window is not None:
                fs = board.sampling_rate
                
                # --- PREPROCESSING (Brainflow Filter) ---
                for i in range(eeg_window.shape[0]):
                    # Filtro 2-30Hz circa (Center 16, Width 28 -> 2Hz - 30Hz)
                    DataFilter.perform_bandpass(eeg_window[i], fs, 16.0, 28.0, 4, FilterTypes.BUTTERWORTH.value, 0)

                # --- CALCOLO ALPHA ---
                current_alpha = compute_alpha_power(eeg_window, fs)
                
                # --- LOGICA STATI ---
                
                if current_state == NeuroState.CALIBRATING:
                    calibration_buffer.append(current_alpha)
                    elapsed = time.time() - calibration_start_time
                    progress = min(elapsed / CALIBRATION_DURATION, 1.0)
                    
                    socketio.emit('calibration_progress', {'progress': progress})
                    
                    if int(elapsed * 10) % 10 == 0:
                        print(f"Calibrating... {int(elapsed)}s (Current Alpha: {current_alpha:.2f} uV^2)")
                    
                    if elapsed >= CALIBRATION_DURATION:
                        if len(calibration_buffer) > 0:
                            data_clean = np.array(calibration_buffer)
                            mu_baseline = np.mean(data_clean)
                            sigma_baseline = np.std(data_clean)
                            
                            print(f"BASELINE ACQUIRED: μ={mu_baseline:.2f}, σ={sigma_baseline:.2f}")
                            current_state = NeuroState.RUNNING
                            socketio.emit('calibration_done', {'mu': mu_baseline, 'sigma': sigma_baseline})
                        else:
                            current_state = NeuroState.IDLE

                elif current_state == NeuroState.RUNNING:
                    # Z-Score
                    z_raw = (current_alpha - mu_baseline) / (sigma_baseline + 1e-6)
                    z_clamped = max(-2.0, min(z_raw, 3.0))
                    
                    alpha_smooth = 0.2
                    current_z_score = (alpha_smooth * z_clamped) + ((1 - alpha_smooth) * current_z_score)
                    
                    # UI Mapping
                    ui_score = (current_z_score / 4.0) + 0.5 
                    ui_score = max(0.0, min(ui_score, 1.0))

                    payload = {
                        'timestamp': time.time(),
                        'focus_score': ui_score,
                        'z_score': current_z_score,
                        'raw_alpha': current_alpha,
                        'state': 'RUNNING'
                    }
                    
                    print(f"Alpha: {current_alpha:.2f} uV | Z: {current_z_score:.2f} | UI: {ui_score:.2f}")
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
    global board, streaming, stream_thread, current_state
    if not board: return jsonify({'error': 'Board error'}), 400
    
    board.start_stream()
    streaming = True
    current_state = NeuroState.IDLE 
    
    if stream_thread is None or not stream_thread.is_alive():
        stream_thread = threading.Thread(target=stream_data_loop, daemon=True)
        stream_thread.start()
        
    return jsonify({'message': 'Streaming started'})

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
        socketio.run(app, host='0.0.0.0', port=5000, debug=False)
    except Exception as e:
        print(f"Error: {e}")