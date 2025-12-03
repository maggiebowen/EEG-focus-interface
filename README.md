# EEG Focus Interface

Real-time EEG data acquisition and visualization using the Knight Board.

## Hardware Requirements

- NeuroPawn Knight Board (8 channels)
- USB-to-serial adapter

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd EEG-focus-interface
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Find your serial port:
```bash
# On macOS/Linux
ls /dev/cu.*

# On Windows
# Check Device Manager for COM ports
```

## Usage

### Basic Test Script
Stream data and print statistics to console:
```bash
cd backend/scripts
python3 test.py /dev/cu.YOUR_SERIAL_PORT
```

### Real-time Visualization
Plot all 8 EEG channels in real-time:
```bash
cd backend/scripts
python3 plot_stream.py /dev/cu.YOUR_SERIAL_PORT
```

## Configuration

Edit the serial port in the scripts:
- Default: `/dev/cu.usbserial-A5069RR4` (macOS)
- Windows: `COM3`, `COM4`, etc.
- Linux: `/dev/ttyUSB0`, `/dev/ttyACM0`, etc.

Adjust sampling rate configuration:
- `config_value=12` for 250Hz (if supported)
- `config_value=11` for 125Hz (default)

## Project Structure

```
EEG-focus-interface/
├── backend/
│   └── scripts/
│       ├── test.py          # Basic streaming test
│       └── plot_stream.py   # Real-time visualization
├── requirements.txt         # Python dependencies
└── README.md
```

## Troubleshooting

**Port not found:**
- Ensure the Knight Board is connected
- Check USB cable and drivers
- Run `ls /dev/cu.*` to list available ports

**Import errors:**
- Make sure brainflow is installed: `pip install brainflow`
- Check Python version (3.7+ required)

**No data streaming:**
- Verify the correct serial port
- Check device permissions
- Try unplugging and reconnecting the device
