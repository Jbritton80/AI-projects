const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const strokesEl = document.getElementById('strokes');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');

const course = {
  bounds: { x: 35, y: 35, w: 830, h: 450 },
  friction: 0.985,
  minSpeed: 0.035,
  holeRadius: 11,
  wallBounce: 0.76,
};

const state = {
  ball: { x: 110, y: 410, vx: 0, vy: 0, radius: 10 },
  hole: { x: 780, y: 120 },
  obstacles: [],
  dragging: false,
  dragStart: null,
  dragCurrent: null,
  strokes: 0,
  win: false,
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createObstacles() {
  state.obstacles = [];
  const obstacleCount = 5;
  for (let i = 0; i < obstacleCount; i += 1) {
    const vertical = Math.random() > 0.5;
    const w = vertical ? 16 : randomBetween(95, 150);
    const h = vertical ? randomBetween(95, 160) : 16;
    state.obstacles.push({
      x: randomBetween(course.bounds.x + 170, course.bounds.x + course.bounds.w - w - 20),
      y: randomBetween(course.bounds.y + 30, course.bounds.y + course.bounds.h - h - 30),
      w,
      h,
    });
  }
}

function setNewHole() {
  state.ball.x = 110;
  state.ball.y = 410;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.hole.x = randomBetween(640, 810);
  state.hole.y = randomBetween(90, 390);
  state.strokes = 0;
  state.win = false;
  state.dragging = false;
  statusEl.textContent = 'Sink the ball in the hole!';
  strokesEl.textContent = 'Strokes: 0';
  createObstacles();
}

function circleRectCollision(ball, rect) {
  const nearestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

function resolveObstacleCollision(ball, rect) {
  const prevX = ball.x - ball.vx;
  const prevY = ball.y - ball.vy;

  const hitHorizontal = prevX < rect.x || prevX > rect.x + rect.w;
  const hitVertical = prevY < rect.y || prevY > rect.y + rect.h;

  if (hitHorizontal) {
    ball.vx *= -course.wallBounce;
    ball.x = prevX;
  }
  if (hitVertical || !hitHorizontal) {
    ball.vy *= -course.wallBounce;
    ball.y = prevY;
  }
}

function update() {
  if (state.win) return;

  const ball = state.ball;
  ball.x += ball.vx;
  ball.y += ball.vy;

  ball.vx *= course.friction;
  ball.vy *= course.friction;

  if (Math.abs(ball.vx) < course.minSpeed) ball.vx = 0;
  if (Math.abs(ball.vy) < course.minSpeed) ball.vy = 0;

  const left = course.bounds.x + ball.radius;
  const right = course.bounds.x + course.bounds.w - ball.radius;
  const top = course.bounds.y + ball.radius;
  const bottom = course.bounds.y + course.bounds.h - ball.radius;

  if (ball.x < left) {
    ball.x = left;
    ball.vx *= -course.wallBounce;
  } else if (ball.x > right) {
    ball.x = right;
    ball.vx *= -course.wallBounce;
  }

  if (ball.y < top) {
    ball.y = top;
    ball.vy *= -course.wallBounce;
  } else if (ball.y > bottom) {
    ball.y = bottom;
    ball.vy *= -course.wallBounce;
  }

  state.obstacles.forEach((rect) => {
    if (circleRectCollision(ball, rect)) {
      resolveObstacleCollision(ball, rect);
    }
  });

  const dx = ball.x - state.hole.x;
  const dy = ball.y - state.hole.y;
  const dist = Math.hypot(dx, dy);
  const speed = Math.hypot(ball.vx, ball.vy);

  if (dist < course.holeRadius && speed < 1.1) {
    state.win = true;
    ball.vx = 0;
    ball.vy = 0;
    ball.x = state.hole.x;
    ball.y = state.hole.y;
    statusEl.textContent = `Nice putt! You scored in ${state.strokes} stroke${state.strokes === 1 ? '' : 's'}.`;
  }
}

function drawCourse() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#166534';
  ctx.fillRect(course.bounds.x, course.bounds.y, course.bounds.w, course.bounds.h);

  ctx.strokeStyle = '#3f6212';
  ctx.lineWidth = 14;
  ctx.strokeRect(course.bounds.x, course.bounds.y, course.bounds.w, course.bounds.h);

  state.obstacles.forEach((rect) => {
    ctx.fillStyle = '#365314';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = '#1a2e05';
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  ctx.beginPath();
  ctx.arc(state.hole.x, state.hole.y, course.holeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#020617';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(state.hole.x, state.hole.y - 4);
  ctx.lineTo(state.hole.x, state.hole.y - 65);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(state.hole.x, state.hole.y - 64);
  ctx.lineTo(state.hole.x + 42, state.hole.y - 52);
  ctx.lineTo(state.hole.x, state.hole.y - 40);
  ctx.closePath();
  ctx.fillStyle = '#ef4444';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (state.dragging && state.dragStart && state.dragCurrent) {
    ctx.beginPath();
    ctx.moveTo(state.ball.x, state.ball.y);
    ctx.lineTo(state.dragCurrent.x, state.dragCurrent.y);
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function isBallStopped() {
  return Math.abs(state.ball.vx) < 0.01 && Math.abs(state.ball.vy) < 0.01;
}

function toCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener('pointerdown', (event) => {
  if (!isBallStopped() || state.win) return;
  const point = toCanvasPoint(event);
  const dx = point.x - state.ball.x;
  const dy = point.y - state.ball.y;
  if (Math.hypot(dx, dy) <= state.ball.radius + 18) {
    state.dragging = true;
    state.dragStart = { x: state.ball.x, y: state.ball.y };
    state.dragCurrent = point;
  }
});

canvas.addEventListener('pointermove', (event) => {
  if (!state.dragging) return;
  state.dragCurrent = toCanvasPoint(event);
});

function shoot() {
  if (!state.dragging || !state.dragCurrent || !state.dragStart) return;
  const dx = state.dragStart.x - state.dragCurrent.x;
  const dy = state.dragStart.y - state.dragCurrent.y;
  const maxPower = 22;
  const powerScale = 0.09;

  const vx = Math.max(-maxPower, Math.min(maxPower, dx * powerScale));
  const vy = Math.max(-maxPower, Math.min(maxPower, dy * powerScale));

  if (Math.hypot(vx, vy) > 0.5) {
    state.ball.vx = vx;
    state.ball.vy = vy;
    state.strokes += 1;
    strokesEl.textContent = `Strokes: ${state.strokes}`;
    statusEl.textContent = 'Rolling...';
  }

  state.dragging = false;
  state.dragStart = null;
  state.dragCurrent = null;
}

canvas.addEventListener('pointerup', shoot);
canvas.addEventListener('pointerleave', () => {
  if (state.dragging) shoot();
});

resetBtn.addEventListener('click', setNewHole);

function loop() {
  update();
  drawCourse();
  requestAnimationFrame(loop);
}

setNewHole();
loop();
