import math
import time
from collections import deque
from dataclasses import dataclass
from typing import Optional, Sequence, Tuple

import numpy as np
from scipy.signal import iirnotch, butter, filtfilt, welch


@dataclass
class AlphaConfig:
    fs: float  # sampling rate (Hz)
    alpha_band: Tuple[float, float] = (8.0, 12.0)
    hp_hz: float = 1.0
    lp_hz: float = 40.0
    notch_hz: Optional[float] = 50.0  # set None to disable
    window_sec: float = 1.0  # PSD window length
    window_overlap: float = 0.5  # fraction (0..1)
    ema_tau_sec: float = 2.0  # EMA smoothing time constant
    deadband_on_z: float = 1.0  # ON threshold in z-score
    deadband_off_z: float = 0.7  # OFF threshold in z-score
    artifact_amp_uV: float = 150.0  # amplitude threshold (approx uV) to gate
    artifact_slope_uVps: float = 800.0  # slope threshold (uV/s)


@dataclass
class BaselineStats:
    mean: float
    std: float
    p50: float
    p60: float
    p70: float


class AlphaComputer:
    """
    Compute alpha power from incoming EEG samples (generic stream).

    - Accepts chunks of samples via `push(samples)` where samples is shape (n_samples, n_channels) or (n_samples,).
    - Applies notch/HP/LP filters, optional CAR, selects occipital-like channels (caller decides which to pass).
    - Computes PSD-based alpha power with Welch over sliding windows.
    - Smooths with EMA.
    - Baseline protocol: 2 min eyes-closed then 2 min eyes-open (caller controls timing via begin_baseline_phase()).
    - Thresholding: z-score vs baseline with hysteresis (ON/OFF) and artifact gating.

    The class does not manage GUI nor stream acquisition; focus is computation.
    """

    def __init__(self, cfg: AlphaConfig, n_channels: int = 1):
        self.cfg = cfg
        self.n_channels = n_channels

        # Filter design
        self._b_hp, self._a_hp = butter(2, cfg.hp_hz / (cfg.fs / 2), btype="highpass")
        self._b_lp, self._a_lp = butter(4, cfg.lp_hz / (cfg.fs / 2), btype="lowpass")
        if cfg.notch_hz:
            q = 30.0
            w0 = cfg.notch_hz / (cfg.fs / 2)
            self._b_notch, self._a_notch = iirnotch(w0, q)
        else:
            self._b_notch, self._a_notch = None, None

        # Sliding buffer for PSD windows
        self._win_len = int(cfg.window_sec * cfg.fs)
        self._step = max(1, int(self._win_len * (1.0 - cfg.window_overlap)))
        self._buffer = deque(maxlen=self._win_len * 4)

        # EMA smoothing
        self._ema_alpha = None
        self._ema_decay = math.exp(-self._step / (cfg.ema_tau_sec * cfg.fs))

        # Baseline handling
        self._baseline_phase = None  # None | "eyes_closed" | "eyes_open"
        self._baseline_start_t = None
        self._baseline_closed_values: list[float] = []
        self._baseline_open_values: list[float] = []
        self._baseline_stats: Optional[BaselineStats] = None

        # Thresholding state
        self._on = False

        # Simple artifact tracking
        self._last_sample_ts = None
        self._last_sample_val = None

    # --- public API ---

    def begin_baseline_phase(self, phase: str):
        """Start baseline phase: "eyes_closed" for 120 s, then "eyes_open" for 120 s."""
        assert phase in ("eyes_closed", "eyes_open")
        self._baseline_phase = phase
        self._baseline_start_t = time.time()

    def end_baseline(self) -> Optional[BaselineStats]:
        """Finalize baseline stats when both phases collected."""
        if not self._baseline_closed_values or not self._baseline_open_values:
            return None
        vals = np.array(self._baseline_closed_values + self._baseline_open_values)
        mean = float(np.mean(vals))
        std = float(np.std(vals) + 1e-12)
        p50 = float(np.percentile(vals, 50))
        p60 = float(np.percentile(vals, 60))
        p70 = float(np.percentile(vals, 70))
        self._baseline_stats = BaselineStats(mean, std, p50, p60, p70)
        return self._baseline_stats

    def push(self, samples: np.ndarray, timestamp: Optional[float] = None) -> Optional[dict]:
        """
        Push new samples. Return a dict with current metrics when a new window is processed, else None.

        samples: shape (n_samples,) or (n_samples, n_channels)
        """
        x = np.asarray(samples)
        if x.ndim == 1:
            x = x[:, None]
        assert x.shape[1] == self.n_channels, "n_channels mismatch"

        # Simple common average reference (optional): center channels
        x = x - np.mean(x, axis=1, keepdims=True)

        # Choose a single representative channel by averaging provided channels
        x_avg = np.mean(x, axis=1)

        # Artifact rough gating (amplitude/slope)
        artifact = False
        if self._last_sample_val is not None and timestamp is not None and self._last_sample_ts is not None:
            dt = max(1e-6, timestamp - self._last_sample_ts)
            slope = abs((x_avg[-1] - self._last_sample_val) / dt)
            if abs(x_avg[-1]) > self.cfg.artifact_amp_uV or slope > self.cfg.artifact_slope_uVps:
                artifact = True
        if timestamp is not None:
            self._last_sample_ts = timestamp
            self._last_sample_val = float(x_avg[-1])

        # Filtering pipeline
        xf = x_avg
        if self._b_notch is not None:
            xf = filtfilt(self._b_notch, self._a_notch, xf, method="gust")
        xf = filtfilt(self._b_hp, self._a_hp, xf, method="gust")
        xf = filtfilt(self._b_lp, self._a_lp, xf, method="gust")

        # Append to buffer
        for v in xf:
            self._buffer.append(float(v))

        # Process when enough for a window and step
        if len(self._buffer) < self._win_len:
            return None
        # Take the last window
        window = np.array(list(self._buffer)[-self._win_len :])

        # Compute PSD alpha power
        f, Pxx = welch(window, fs=self.cfg.fs, nperseg=min(self._win_len, 256), noverlap=int(0.5 * min(self._win_len, 256)))
        f_lo, f_hi = self.cfg.alpha_band
        band_mask = (f >= f_lo) & (f <= f_hi)
        alpha_power = float(np.mean(Pxx[band_mask]))

        # EMA smoothing
        if self._ema_alpha is None:
            self._ema_alpha = alpha_power
        else:
            self._ema_alpha = self._ema_decay * self._ema_alpha + (1.0 - self._ema_decay) * alpha_power

        # Baseline collection
        if self._baseline_phase is not None and self._baseline_start_t is not None:
            elapsed = time.time() - self._baseline_start_t
            # Collect values during the phase; caller decides when to switch phase
            if self._baseline_phase == "eyes_closed":
                self._baseline_closed_values.append(self._ema_alpha)
            elif self._baseline_phase == "eyes_open":
                self._baseline_open_values.append(self._ema_alpha)
            # Stop auto after 120 s per requirement, but do not switch automatically
            if elapsed >= 120.0:
                # Phase complete; caller should start the next phase explicitly
                self._baseline_phase = None
                self._baseline_start_t = None

        # Compute z-score if baseline ready
        z = None
        percentile_ref = None
        if self._baseline_stats:
            z = (self._ema_alpha - self._baseline_stats.mean) / (self._baseline_stats.std or 1e-12)
            percentile_ref = {
                "p50": self._baseline_stats.p50,
                "p60": self._baseline_stats.p60,
                "p70": self._baseline_stats.p70,
            }

        # Hysteresis thresholding with artifact gating
        state = "OFF"
        if artifact:
            self._on = False
            state = "ARTIFACT"
        elif z is not None:
            if not self._on and z >= self.cfg.deadband_on_z:
                self._on = True
            elif self._on and z <= self.cfg.deadband_off_z:
                self._on = False
            state = "ON" if self._on else "OFF"

        return {
            "alpha_power": alpha_power,
            "alpha_smooth": self._ema_alpha,
            "z": z,
            "state": state,
            "artifact": artifact,
            "percentiles": percentile_ref,
        }


def demo_usage():
    """Minimal synthetic demo: generate alpha-like signal and run the computer.

    This leaves stream input abstract; replace synthetic generation with your stream reader
    and call `AlphaComputer.push(chunk, timestamp)` regularly.
    """
    fs = 256.0
    cfg = AlphaConfig(fs=fs)
    comp = AlphaComputer(cfg, n_channels=1)

    # Baseline phases: 2 min closed, 2 min open
    comp.begin_baseline_phase("eyes_closed")
    t0 = time.time()

    def synth_chunk(sec: float, freq: float, noise: float) -> np.ndarray:
        n = int(sec * fs)
        t = np.arange(n) / fs
        sig = 50.0 * np.sin(2 * np.pi * freq * t)  # ~alpha amplitude
        sig += noise * np.random.randn(n)
        return sig.astype(np.float32)

    # 120 s eyes-closed: stronger alpha
    while time.time() - t0 < 120.0:
        chunk = synth_chunk(0.5, 10.0, 10.0)
        ts = time.time()
        res = comp.push(chunk, ts)
        if res and res["z"] is not None:
            pass

    # Switch to eyes-open baseline
    comp.begin_baseline_phase("eyes_open")
    t1 = time.time()
    while time.time() - t1 < 120.0:
        chunk = synth_chunk(0.5, 10.0, 30.0)  # more noise, reduced alpha coherence
        ts = time.time()
        res = comp.push(chunk, ts)
        if res and res["z"] is not None:
            pass

    stats = comp.end_baseline()
    print("Baseline stats:", stats)

    # Live loop: random mix; print state
    for _ in range(100):
        chunk = synth_chunk(0.5, 10.0, np.random.uniform(10.0, 25.0))
        res = comp.push(chunk, time.time())
        if res and res["z"] is not None:
            print(
                f"alpha={res['alpha_smooth']:.2f} z={res['z']:.2f} state={res['state']} artifact={res['artifact']}"
            )


if __name__ == "__main__":
    demo_usage()
