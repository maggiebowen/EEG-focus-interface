"""
Flask server with Socket.IO for real-time EEG streaming to React frontend,
and CSV logging of all streamed data.
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading
import time
import numpy as np
import csv
import os
from datetime import datetime
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend
socketio = SocketIO(app, cors_allowed_origins="*")

# Global board instance
board = None
streaming = False
stream_thread = None

# CSV logging globals
csv_file = None
csv_writer = None
csv_lock = threading.Lock()
sample_index_counter = 0
csv_filepath = None


class KnightBoardServer:
    def __init__(self, serial_port: str, num_channels: int):
        """Initialize Knight Board for server streaming."""
        self.params = BrainFlowInputParams()
        self.params.serial_port = serial_port
        self.num_channels = num_channels

        # Initialize board
        self.board_shim = BoardShim(BoardIds.NEUROPAWN_KNIGHT_BOARD.value, self.params)
        self.board_id = self.board_shim.get_board_id()
        self.eeg_channels = self.board_shim.get_exg_channels(self.board_id)
        self.sampling_rate = self.board_shim.get_sampling_rate(self.board_id)
        self.is_streaming = False

    def start_stream(self, buffer_size: int = 450000, config_value: int = 12):
        """Start the data stream from the board."""
        if self.is_streaming:
            return

        self.board_shim.prepare_session()
        self.board_shim.start_stream(buffer_size)
        print(f"Stream started at {self.sampling_rate} Hz")
        time.sleep(2)

        # Configure channels
        for x in range(1, self.num_channels + 1):
            time.sleep(0.5)
            cmd = f"chon_{x}_{config_value}"
            self.board_shim.config_board(cmd)
            time.sleep(1)
            rld = f"rldadd_{x}"
            self.board_shim.config_board(rld)
            time.sleep(0.5)

        self.is_streaming = True
        print("Configuration complete!")

    def stop_stream(self):
        """Stop the data stream and release resources."""
        if not self.is_streaming:
            return

        self.is_streaming = False
        self.board_shim.stop_stream()
        self.board_shim.release_session()
        print("Stream stopped and session released.")

    def get_latest_data(self, num_samples: int = 250):
        """Get the latest data from the board."""
        data = self.board_shim.get_board_data()

        if data.size == 0:
            return None

        eeg_data = data[self.eeg_channels, :]

        # Get last num_samples if available
        if eeg_data.shape[1] > num_samples:
            eeg_data = eeg_data[:, -num_samples:]

        return eeg_data


def init_csv_logging(num_channels: int):
    """Initialize CSV logging file and writer."""
    global csv_file, csv_writer, csv_filepath, sample_index_counter

    # Create logs directory if not exists
    os.makedirs("logs", exist_ok=True)

    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filepath = os.path.join("logs", f"eeg_log_{timestamp_str}.csv")

    csv_file = open(csv_filepath, mode="w", newline="")
    csv_writer = csv.writer(csv_file)

    # Header: sample_index, system_timestamp, ch_1...ch_N
    header = ["sample_index", "system_timestamp"]
    header.extend([f"ch_{i+1}" for i in range(num_channels)])
    csv_writer.writerow(header)

    sample_index_counter = 0

    print(f"CSV logging initialized: {csv_filepath}")


def close_csv_logging():
    """Close CSV logging file if open."""
    global csv_file, csv_writer, csv_filepath

    if csv_file is not None:
        csv_file.flush()
        csv_file.close()
        print(f"CSV logging finished: {csv_filepath}")

    csv_file = None
    csv_writer = None
    csv_filepath = None


def log_chunk_to_csv(data: np.ndarray, chunk_time: float, sampling_rate: float):
    """
    Log a chunk of EEG data to CSV.

    data shape: (num_channels, num_samples)
    chunk_time: time.time() when chunk was acquired
    """
    global csv_writer, sample_index_counter

    if csv_writer is None:
        return

    num_channels, num_samples = data.shape

    # Approximate start time of chunk
    chunk_start_time = chunk_time - (num_samples / sampling_rate)

    with csv_lock:
        for i in range(num_samples):
            sample_index_counter += 1
            sample_time = chunk_start_time + (i / sampling_rate)
            row = [sample_index_counter, sample_time]

            # Add channel values in order
            row.extend([float(data[ch, i]) for ch in range(num_channels)])

            csv_writer.writerow(row)


def stream_data():
    """Background thread to continuously emit EEG data and log to CSV."""
    global board, streaming

    while streaming:
        if board and board.is_streaming:
            chunk_time = time.time()
            data = board.get_latest_data(num_samples=125)  # Send 1 second of data

            if data is not None and data.size > 0:
                # Log to CSV
                log_chunk_to_csv(data, chunk_time, board.sampling_rate)

                # Convert to JSON-serializable format
                payload = {
                    'timestamp': chunk_time,
                    'sampling_rate': board.sampling_rate,
                    'num_channels': len(board.eeg_channels),
                    'data': data.tolist()  # Convert numpy array to list
                }

                # Print received data info
                print(f"\n[{time.strftime('%H:%M:%S')}] Received {data.shape[1]} samples from {data.shape[0]} channels")

                # Print latest sample value from each channel
                print("Latest sample values:")
                for ch_idx in range(data.shape[0]):
                    print(f"  Channel {ch_idx + 1}: {data[ch_idx, -1]:.2f}")

                socketio.emit('eeg_data', payload)

        time.sleep(1.0)  # Send updates every 100ms


@app.route('/api/status')
def status():
    """Get board status."""
    if board:
        return jsonify({
            'connected': True,
            'streaming': board.is_streaming,
            'sampling_rate': board.sampling_rate,
            'num_channels': len(board.eeg_channels)
        })
    return jsonify({'connected': False}), 404


@app.route('/api/start', methods=['POST'])
def start_streaming():
    """Start streaming EEG data."""
    global board, streaming, stream_thread

    if not board:
        return jsonify({'error': 'Board not initialized'}), 400

    try:
        board.start_stream()
        streaming = True

        # Initialize CSV logging using number of EEG channels
        init_csv_logging(len(board.eeg_channels))

        # Start background thread for data streaming
        stream_thread = threading.Thread(target=stream_data, daemon=True)
        stream_thread.start()

        return jsonify({
            'message': 'Streaming started',
            'sampling_rate': board.sampling_rate,
            'csv_file': csv_filepath
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stop', methods=['POST'])
def stop_streaming():
    """Stop streaming EEG data."""
    global board, streaming

    if board:
        streaming = False
        board.stop_stream()
        close_csv_logging()
        return jsonify({'message': 'Streaming stopped'})
    return jsonify({'error': 'Board not initialized'}), 400


@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    print('Client connected')
    emit('connection_response', {'status': 'connected'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    print('Client disconnected')


if __name__ == '__main__':
    import sys

    # Configuration
    serial_port = "/dev/cu.usbserial-A5069RR4"
    num_channels = 8

    # Allow serial port override from command line
    if len(sys.argv) > 1:
        serial_port = sys.argv[1]

    print(f"Knight Board Server")
    print(f"Connecting to: {serial_port}")
    print(f"Channels: {num_channels}")
    print()

    try:
        # Initialize board
        board = KnightBoardServer(serial_port, num_channels)
        print(f"Board initialized successfully!")
        print(f"Sampling rate: {board.sampling_rate} Hz")
        print()
        print("Server starting...")
        print("API endpoints:")
        print("  GET  /api/status - Get board status")
        print("  POST /api/start  - Start streaming (and CSV logging)")
        print("  POST /api/stop   - Stop streaming (and close CSV)")
        print()
        print("WebSocket: Connect to receive real-time data on 'eeg_data' event")
        print()
        print("Server running on http://localhost:5001")

        # Start Flask server with Socket.IO
        socketio.run(app, host='0.0.0.0', port=5001, debug=False)

    except KeyboardInterrupt:
        print("\n\nShutting down...")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if board:
            streaming = False
            try:
                board.stop_stream()
            except Exception:
                pass
        close_csv_logging()