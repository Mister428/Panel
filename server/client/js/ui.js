const canvas = document.getElementById('matrix');

if (canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, cols, ypos;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cols = Math.floor(w / 20) + 1;
    ypos = Array(cols).fill(0);
  };

  resize();
  window.addEventListener('resize', resize);

  const matrix = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#00f5ff';
    ctx.font = '15px monospace';

    ypos.forEach((y, ind) => {
      const text = String.fromCharCode(0x30A0 + Math.random() * 96);
      const x = ind * 20;
      ctx.fillText(text, x, y);
      if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
      else ypos[ind] = y + 20;
    });
  };

  setInterval(matrix, 50);
}

function updateClock() {
  const d = new Date();
  const el = document.getElementById('clock');
  if (!el) return;

  el.textContent = d.toLocaleString('fr-FR', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

updateClock();
setInterval(updateClock, 1000);

export function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;

  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}