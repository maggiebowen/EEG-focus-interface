import brainflow as bf
import time

from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds

class KnightBoard:
    def __init__(self, serial_port: str, num_channels: int):
        """Initialize and configure the Knight Board."""
        self.params = BrainFlowInputParams()
        self.params.serial_port = serial_port
        self.num_channels = num_channels
        
        # Initialize board
        self.board_shim = BoardShim(BoardIds.NEUROPAWN_KNIGHT_BOARD.value, self.params)
        self.board_id = self.board_shim.get_board_id()
        self.eeg_channels = self.board_shim.get_exg_channels(self.board_id)
        self.sampling_rate = self.board_shim.get_sampling_rate(self.board_id)

    def start_stream(self, buffer_size: int = 450000, config_value: int = 12):
        """Start the data stream from the board.
        
        Args:
            buffer_size: Size of the internal buffer
            config_value: Configuration value for channel setup
                         Common values: 12 (250Hz), 11 (125Hz), 10 (500Hz)
                         Check Knight Board docs for exact values
        """
        self.board_shim.prepare_session()
        self.board_shim.start_stream(buffer_size)
        print("Stream started.")
        time.sleep(2)
        for x in range(1, self.num_channels + 1):
            time.sleep(0.5)
            cmd = f"chon_{x}_{config_value}"
            self.board_shim.config_board(cmd)
            print(f"sending {cmd}")
            time.sleep(1)
            rld = f"rldadd_{x}"
            self.board_shim.config_board(rld)
            print(f"sending {rld}")
            time.sleep(0.5)

    def stop_stream(self):
        """Stop the data stream and release resources."""
        self.board_shim.stop_stream()
        self.board_shim.release_session()
        print("Stream stopped and session released.")

if __name__ == "__main__":
    import sys
    
    # On macOS, serial ports are usually /dev/cu.* or /dev/tty.*
    # List available ports with: ls /dev/cu.*
    # Example: "/dev/cu.usbserial-0001" or "/dev/cu.usbmodem14101"
    serial_port = "/dev/cu.usbserial-A5069RR4"  # Update this to your actual port
    
    if len(sys.argv) > 1:
        serial_port = sys.argv[1]
    
    print(f"Connecting to Knight Board on {serial_port}...")
    print("Tip: Find your port with: ls /dev/cu.*")
    print("Run with: python3 test.py /dev/cu.YOUR_PORT")
    
    Knight_board = None
    
    try:
        Knight_board = KnightBoard(serial_port, 8)
        print("\nStarting stream and configuring channels...")
        print("(This will take ~20 seconds to configure all 8 channels)")
        
        # If your device runs at 125Hz, try config_value=11
        # For 250Hz (default), use config_value=12
        Knight_board.start_stream(config_value=12)  # Change to 11 for 125Hz
        
        print(f"\nBoard sampling rate: {Knight_board.sampling_rate} Hz")
        print("="*60)
        print("Streaming data... Press Ctrl+C to stop.")
        print("="*60)
        
        sample_count = 0
        while True:
            data = Knight_board.board_shim.get_board_data()
            
            if data.size > 0:
                num_samples = data.shape[1]
                sample_count += num_samples
                
                # Get EEG channel data
                eeg_data = data[Knight_board.eeg_channels, :]
                
                # Print stats every 250 samples (1 second at 250Hz)
                if sample_count % 250 < num_samples:
                    print(f"\n[{sample_count:6d} samples] Got {num_samples} new samples")
                    print(f"  EEG channels: {len(Knight_board.eeg_channels)}")
                    print(f"  EEG data shape: {eeg_data.shape}")
                    print(f"  Sample values (first channel): min={eeg_data[0].min():.2f}, max={eeg_data[0].max():.2f}, mean={eeg_data[0].mean():.2f}")
            else:
                time.sleep(0.01)  # Small delay if no data
                
    except KeyboardInterrupt:
        print("\n\nStopping stream...")
    except Exception as e:
        print(f"\nError occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if Knight_board:
            try:
                Knight_board.stop_stream()
                print("Stream stopped successfully.")
            except:
                print("Error stopping stream (may already be stopped).")