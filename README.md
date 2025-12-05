# FocusFarm 🌱🧠

A focus training application developed during **BrainHack Lucca 2025** that gamifies concentration using real-time EEG data from NeuroPawn's Knight Board.

## 🎯 Project Overview

FocusFarm transforms brain activity monitoring into an engaging experience. As users maintain focus, they grow virtual plants on their farm. The application uses real-time alpha wave analysis (8-12 Hz) to calculate focus scores and provide immediate neurofeedback.

## 🏆 BrainHack Lucca 2025

This project was developed during the BrainHack Lucca 2025 hackathon, exploring the intersection of neurotechnology and user experience design.

## ✨ Features

- **Real-time EEG Processing**: Processes 8-channel EEG data at 125Hz sampling rate
- **Scientific Alpha Neurofeedback**: Z-score based focus calculation using alpha wave power (8-12 Hz)
- **10-Second Calibration**: Establishes personalized baseline brain activity
- **Visual Gamification**: Virtual farm that grows as you focus
- **Live Statistics**: Real-time focus scores, session duration, and alpha wave visualization
- **Adaptive Scoring**: Sigmoid mapping for intuitive 0-100% focus representation

## 🛠️ Technology Stack

### Backend (Python)
- **Flask** + **Flask-SocketIO**: Real-time WebSocket communication
- **BrainFlow**: EEG data acquisition from NeuroPawn Knight Board
- **SciPy**: Signal processing (Welch's method for PSD, bandpass filtering)
- **NumPy**: Numerical computations and array operations

### Frontend (React + TypeScript)
- **React 18** + **TypeScript**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **Socket.IO Client**: Real-time data streaming
- **Tailwind CSS**: Styling and responsive design
- **Lucide React**: Icon library

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- NeuroPawn Knight Board (8-channel EEG device)
- USB connection to EEG device

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/maggiebowen/EEG-focus-interface.git
cd EEG-focus-interface
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install
```

## 🎮 Usage

### 1. Start the Backend Server
```bash
cd backend
source .venv/bin/activate  # Activate virtual environment
python3 server.py
```

The server will start on `http://localhost:5001` and automatically connect to the EEG device.

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

The application will open at `http://localhost:5173`

### 3. Run a Session
1. **Wear the EEG headset** - Ensure proper electrode contact
2. **Click "Start"** - Begin a focus session
3. **Calibration (10 seconds)** - Close your eyes, relax, and stay still to establish your baseline
4. **Focus!** - Keep your eyes open and maintain concentration to grow your virtual plants
5. **Track Progress** - Monitor your focus score, session time, and alpha wave activity

## 🧠 How It Works

### Signal Processing Pipeline

1. **Data Acquisition**
   - Continuous 8-channel EEG streaming at 125 Hz
   - 10-second sliding window buffer
   - Hardware gain configuration (24x)

2. **Preprocessing**
   - Bandpass filter: 16-28 Hz (Butterworth, order 4)
   - Bad channel detection via variance analysis
   - Detrending and artifact removal

3. **Feature Extraction**
   - Welch's method for Power Spectral Density (PSD)
   - Alpha band integration (8-12 Hz) in µV²
   - Per-channel computation with multi-channel averaging

4. **Focus Score Calculation**
   ```python
   z_score = (current_alpha - baseline_mean) / baseline_std
   focus_score = 100 * sigmoid(z_score)  # 0-100%
   ```

5. **Real-time Feedback**
   - WebSocket emission at ~1 Hz
   - Exponential smoothing (α = 0.2)
   - Visual and statistical updates

## 📊 API Endpoints

### REST API
- `POST /api/start` - Start EEG streaming and calibration
- `POST /api/stop` - Stop streaming
- `GET /api/status` - Get current system status

### WebSocket Events
- `eeg_metric` - Real-time focus scores and alpha power
- `calibration_progress` - Calibration progress (0.0-1.0)
- `calibration_done` - Calibration complete signal

## 🎨 UI Components

- **CalibrationOverlay**: 10-second countdown with progress visualization
- **FarmView**: Interactive plant farm that responds to focus levels
- **StatsPanel**: Real-time metrics and alpha wave graphs
- **DashboardLayout**: Main application container with status indicators

## 🔧 Configuration

### Backend (`backend/server.py`)
```python
CALIBRATION_DURATION = 10  # seconds
WINDOW_SECONDS = 10        # sliding window
TIME_STEP_SECONDS = 1      # computation interval
```

### Frontend (`frontend/src/hooks/useEEGData.ts`)
```typescript
const BACKEND_URL = 'http://localhost:5001';
const maxHistoryPoints = 60;  // data points to display
```

## 📝 Project Structure

```
EEG-focus-interface/
├── backend/
│   ├── server.py           # Flask server + signal processing
│   ├── requirements.txt    # Python dependencies
│   └── logs/              # Session logs
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── styles/        # CSS and Tailwind
│   ├── package.json       # Node dependencies
│   └── vite.config.ts     # Vite configuration
└── README.md
```

## 🐛 Troubleshooting

### EEG Device Not Found
- Check USB connection
- Verify serial port in `server.py` (default: `/dev/cu.usbserial-A5069RR4` on macOS)
- Ensure proper device drivers are installed

### WebSocket Connection Issues
- Verify backend is running on port 5001
- Check firewall settings
- Ensure `eventlet` is installed for WebSocket support

### Poor Signal Quality
- Check electrode contact and gel application
- Minimize movement during calibration
- Reduce electrical interference in the environment

## 👥 Team

@maggiebowen
@sojoudjebril
@Marcop-00
@Lafio8

## 📄 License

This project was created for educational purposes during the BrainHack Lucca 2025 hackathon.

## 🙏 Acknowledgments

- **BrainHack Lucca 2025** organizers and mentors
- **NeuroPawn** for providing the Knight Board EEG device
- **BrainFlow** library for simplified EEG data acquisition
- All participants and supporters of the hackathon

---

**Note**: This is a prototype developed during a hackathon. For production use, additional validation, error handling, and safety measures should be implemented.
