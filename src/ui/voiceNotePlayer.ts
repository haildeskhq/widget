const BAR_COUNT = 28;

// Deterministic pseudo-random bar heights seeded from the URL, so the same
// voice note always renders the same waveform (no real peak analysis).
function seededHeights(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    heights.push(0.3 + ((h >>> 8) % 1000) / 1000 * 0.7);
  }
  return heights;
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const PLAY_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
const PAUSE_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`;

export function createVoiceNotePlayer(url: string, durationSec?: number): HTMLElement {
  const container = document.createElement('div');
  container.className = 'haildesk-voice-player';

  const audio = document.createElement('audio');
  audio.src = url;
  audio.preload = 'metadata';
  audio.style.display = 'none';

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'haildesk-voice-play-btn';
  playBtn.setAttribute('aria-label', 'Play voice note');
  playBtn.innerHTML = PLAY_ICON;

  const bars = document.createElement('div');
  bars.className = 'haildesk-voice-bars';
  const heights = seededHeights(url, BAR_COUNT);
  const barEls = heights.map((h) => {
    const bar = document.createElement('span');
    bar.className = 'haildesk-voice-bar';
    bar.style.height = `${Math.round(h * 100)}%`;
    bars.appendChild(bar);
    return bar;
  });

  const timeLabel = document.createElement('span');
  timeLabel.className = 'haildesk-voice-time';
  timeLabel.textContent = formatTime(durationSec ?? 0);

  let duration = durationSec ?? 0;

  function updateBars(progress: number): void {
    barEls.forEach((bar, i) => {
      bar.classList.toggle('haildesk-voice-bar--active', i / BAR_COUNT <= progress);
    });
  }

  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) {
      duration = audio.duration;
      if (!audio.currentTime) timeLabel.textContent = formatTime(duration);
    }
  });

  audio.addEventListener('timeupdate', () => {
    timeLabel.textContent = formatTime(audio.currentTime);
    updateBars(duration > 0 ? audio.currentTime / duration : 0);
  });

  audio.addEventListener('ended', () => {
    playBtn.innerHTML = PLAY_ICON;
    playBtn.setAttribute('aria-label', 'Play voice note');
    timeLabel.textContent = formatTime(duration);
    updateBars(0);
  });

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      void audio.play();
      playBtn.innerHTML = PAUSE_ICON;
      playBtn.setAttribute('aria-label', 'Pause voice note');
    } else {
      audio.pause();
      playBtn.innerHTML = PLAY_ICON;
      playBtn.setAttribute('aria-label', 'Play voice note');
    }
  });

  bars.addEventListener('click', (e) => {
    if (!duration) return;
    const rect = bars.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  });

  container.appendChild(audio);
  container.appendChild(playBtn);
  container.appendChild(bars);
  container.appendChild(timeLabel);

  return container;
}
