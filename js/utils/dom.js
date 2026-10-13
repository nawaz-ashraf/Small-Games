/**
 * DOM Helpers: Toasts, Modals, and Festive Particle Engine
 */

export function generateId() {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function showModal(title, bodyHtml, actions = []) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (!overlay || !content) return;
  
  const actionsHtml = actions.map((a, i) =>
    `<button class="btn btn-${a.style || 'secondary'}" data-action="${i}">${a.text}</button>`
  ).join('');

  content.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="modal-close" id="modal-close-btn">&times;</button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-footer">${actionsHtml}</div>
  `;

  overlay.classList.add('active');

  function closeModal() {
    overlay.classList.remove('active');
  }

  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) closeBtn.onclick = closeModal;

  actions.forEach((a, i) => {
    const btn = content.querySelector(`[data-action="${i}"]`);
    if (btn) {
      btn.onclick = () => {
        if (a.handler) a.handler();
        closeModal();
      };
    }
  });

  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };
}

export function initFestiveAtmosphere() {
  const canvas = document.getElementById('festive-confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = window.innerWidth;
  let height = window.innerHeight;
  let animId = null;
  const particles = [];
  const PARTICLE_COUNT = 38;

  const festiveColors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#EC4899', '#8B5CF6', '#FCD34D', '#F97316'
  ];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  function createParticle(initial = false) {
    const rand = Math.random();
    const type = rand < 0.5 ? 'confetti' : (rand < 0.85 ? 'sparkle' : 'glitter');
    return {
      x: Math.random() * width,
      y: initial ? Math.random() * height : -15,
      size: type === 'confetti' ? 5 + Math.random() * 4 : (type === 'sparkle' ? 2.5 + Math.random() * 2.5 : 2 + Math.random() * 2),
      color: festiveColors[Math.floor(Math.random() * festiveColors.length)],
      speedY: 0.6 + Math.random() * 1.4,
      speedX: (Math.random() - 0.5) * 0.8,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2.5,
      type: type,
      opacity: 0.35 + Math.random() * 0.45,
      sway: Math.random() * 100,
      swaySpeed: 0.015 + Math.random() * 0.02
    };
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(true));
    }
  }

  function drawSparkle(cx, cy, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(a + Math.PI / 4) * (r * 0.28), cy + Math.sin(a + Math.PI / 4) * (r * 0.28));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY;
      p.sway += p.swaySpeed;
      p.x += p.speedX + Math.sin(p.sway) * 0.45;
      p.rotation += p.rotSpeed;

      if (p.y > height + 20 || p.x < -20 || p.x > width + 20) {
        particles[i] = createParticle(false);
        continue;
      }

      if (p.type === 'confetti') {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.3);
        ctx.restore();
      } else if (p.type === 'sparkle') {
        const sparkleAlpha = p.opacity * (0.6 + Math.sin(p.sway * 2.5) * 0.4);
        drawSparkle(p.x, p.y, p.size * 2, p.color, sparkleAlpha);
      } else {
        ctx.save();
        ctx.globalAlpha = p.opacity * 0.8;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    animId = requestAnimationFrame(render);
  }

  initParticles();
  render();
}
