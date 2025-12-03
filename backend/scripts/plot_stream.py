import time
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds

class KnightBoardPlotter:
    def __init__(self, serial_port: str, num_channels: int, window_size: int = 5):
        """Initialize Knight Board with real-time plotting.
        
        Args:
            serial_port: Serial port path (e.g., /dev/cu.usbserial-A5069RR4)
            num_channels: Number of EEG channels to use
            window_size: Time window to display in seconds
        """
        self.params = BrainFlowInputParams()
        self.params.serial_port = serial_port
        self.num_channels = num_channels
        
        # Initialize board
        self.board_shim = BoardShim(BoardIds.NEUROPAWN_KNIGHT_BOARD.value, self.params)
        self.board_id = self.board_shim.get_board_id()
        self.eeg_channels = self.board_shim.get_exg_channels(self.board_id)
        self.sampling_rate = self.board_shim.get_sampling_rate(self.board_id)
        
        # Plot settings
        self.window_size = window_size
        self.num_points = int(self.sampling_rate * window_size)
        
        # Initialize data buffers
        self.data_buffer = np.zeros((len(self.eeg_channels), self.num_points))
        self.time_axis = np.linspace(-window_size, 0, self.num_points)
        
    def start_stream(self, buffer_size: int = 450000, config_value: int = 12):
        """Start the data stream from the board."""
        self.board_shim.prepare_session()
        self.board_shim.start_stream(buffer_size)
        print("Stream started.")
        time.sleep(2)
        
        print("Configuring channels...")
        for x in range(1, self.num_channels + 1):
            time.sleep(0.5)
            cmd = f"chon_{x}_{config_value}"
            self.board_shim.config_board(cmd)
            print(f"  Channel {x}: {cmd}")
            time.sleep(1)
            rld = f"rldadd_{x}"
            self.board_shim.config_board(rld)
            time.sleep(0.5)
        print("Configuration complete!")
        
    def stop_stream(self):
        """Stop the data stream and release resources."""
        self.board_shim.stop_stream()
        self.board_shim.release_session()
        print("Stream stopped and session released.")
        
    def update_plot(self, frame):
        """Update function for animation."""
        # Get new data
        data = self.board_shim.get_board_data()
        
        if data.size > 0:
            eeg_data = data[self.eeg_channels, :]
            
            # Roll buffer and add new data
            num_new_samples = min(eeg_data.shape[1], self.num_points)
            self.data_buffer = np.roll(self.data_buffer, -num_new_samples, axis=1)
            self.data_buffer[:, -num_new_samples:] = eeg_data[:, -num_new_samples:]
        
        # Update plot lines
        for i, line in enumerate(self.lines):
            # Apply offset for visualization
            offset = i * 2000  # Increased spacing between channels
            line.set_ydata(self.data_buffer[i] + offset)
        
        return self.lines
    
    def plot_realtime(self):
        """Create and display real-time plot."""
        # Create figure and axis
        self.fig, self.ax = plt.subplots(figsize=(14, 10))
        
        # Create lines for each channel
        self.lines = []
        for i in range(len(self.eeg_channels)):
            offset = i * 2000  # Match the offset in update_plot
            line, = self.ax.plot(self.time_axis, self.data_buffer[i] + offset, 
                                label=f'Channel {i+1}')
            self.lines.append(line)
        
        # Customize plot
        self.ax.set_xlabel('Time (seconds)', fontsize=12)
        self.ax.set_ylabel('Amplitude (µV)', fontsize=12)
        self.ax.set_title(f'Knight Board Real-Time EEG - {self.sampling_rate} Hz', fontsize=14)
        self.ax.legend(loc='upper right')
        self.ax.grid(True, alpha=0.3)
        
        # Set axis limits
        self.ax.set_xlim(-self.window_size, 0)
        
        # Create animation
        ani = FuncAnimation(self.fig, self.update_plot, interval=50, blit=True, cache_frame_data=False)
        
        print("\n" + "="*60)
        print("Real-time plotting active!")
        print("Close the plot window to stop streaming.")
        print("="*60 + "\n")
        
        plt.tight_layout()
        plt.show()


if __name__ == "__main__":
    import sys
    
    # Configuration
    serial_port = "/dev/cu.usbserial-A5069RR4"
    num_channels = 8
    window_size = 5  # seconds to display
    config_value = 12  # 12 for 250Hz, 11 for 125Hz
    
    # Allow serial port override from command line
    if len(sys.argv) > 1:
        serial_port = sys.argv[1]
    
    print(f"Knight Board Real-Time Plotter")
    print(f"Connecting to: {serial_port}")
    print(f"Channels: {num_channels}")
    print(f"Window: {window_size} seconds")
    print()
    
    plotter = None
    
    try:
        # Initialize plotter
        plotter = KnightBoardPlotter(serial_port, num_channels, window_size)
        
        # Start streaming
        plotter.start_stream(config_value=config_value)
        
        print(f"Sampling rate: {plotter.sampling_rate} Hz")
        
        # Start real-time plotting
        plotter.plot_realtime()
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
    except Exception as e:
        print(f"\nError occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if plotter:
            try:
                plotter.stop_stream()
                print("Stream stopped successfully.")
            except:
                print("Error stopping stream (may already be stopped).")
