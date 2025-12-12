document.addEventListener('DOMContentLoaded', () => {
  const minEl = document.getElementById('min');
  const secEl = document.getElementById('sec');
  const displayEl = document.getElementById('display');
  const barEl = document.getElementById('bar');
  const hintEl = document.getElementById('hint');

  const btnStart = document.getElementById('start');
  const btnPause = document.getElementById('pause');
  const btnReset = document.getElementById('reset');

  let totalMs = 0;
  let leftMs = 0;
  let timerId = null;
  let lastTick = 0;

  const clampInt = (v, min, max) => {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  };

  const format = (ms) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  const setDisplay = () => {
    displayEl.textContent = format(leftMs);
    if (totalMs > 0) {
      const p = Math.max(0, Math.min(1, 1 - leftMs / totalMs));
      barEl.style.width = (p * 100).toFixed(1) + '%';
    } else {
      barEl.style.width = '0%';
    }
  };

  const readInputAsMs = () => {
    const m = clampInt(minEl.value, 0, 999);
    const s = clampInt(secEl.value, 0, 59);
    return (m * 60 + s) * 1000;
  };

  const stop = () => {
    if (timerId) {
      cancelAnimationFrame(timerId);
      timerId = null;
    }
  };

  const tick = (now) => {
    if (!lastTick) lastTick = now;
    const dt = now - lastTick;
    lastTick = now;

    leftMs -= dt;
    if (leftMs <= 0) {
      leftMs = 0;
      setDisplay();
      stop();
      hintEl.textContent = '時間到 ⏰（你可以按 重設 或重新輸入時間）';
      return;
    }

    setDisplay();
    timerId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (timerId) return;

    // 如果目前是 00:00 或尚未初始化，就重新讀取輸入
    if (leftMs <= 0) {
      totalMs = readInputAsMs();
      leftMs = totalMs;
    }

    if (leftMs <= 0) {
      hintEl.textContent = '請輸入大於 0 的時間。';
      return;
    }

    hintEl.textContent = '計時中…';
    lastTick = 0;
    timerId = requestAnimationFrame(tick);
  };

  const pause = () => {
    if (!timerId) return;
    stop();
    hintEl.textContent = '已暫停。';
  };

  const reset = () => {
    stop();
    totalMs = readInputAsMs();
    leftMs = totalMs;
    hintEl.textContent = '已重設。';
    setDisplay();
  };

  btnStart.addEventListener('click', start);
  btnPause.addEventListener('click', pause);
  btnReset.addEventListener('click', reset);

  // 讓秒數輸入自動夾在 0..59
  secEl.addEventListener('change', () => {
    secEl.value = String(clampInt(secEl.value, 0, 59));
  });

  // 輸入有改就更新顯示（但不會自動開始）
  const syncFromInput = () => {
    if (timerId) return; // 計時中不覆蓋
    totalMs = readInputAsMs();
    leftMs = totalMs;
    setDisplay();
    hintEl.textContent = '已更新時間，按「開始」開始計時。';
  };
  minEl.addEventListener('input', syncFromInput);
  secEl.addEventListener('input', syncFromInput);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (timerId) pause();
      else start();
    } else if (e.key.toLowerCase() === 'r') {
      reset();
    }
  });

  // init
  totalMs = readInputAsMs();
  leftMs = totalMs;
  setDisplay();
});
