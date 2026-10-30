(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const speedEl = document.getElementById("speed");
  const coinsEl = document.getElementById("coins");
  const statusEl = document.getElementById("status");

  const overlay = document.getElementById("overlay");
  const gameOver = document.getElementById("gameOver");
  const finalScore = document.getElementById("finalScore");

  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const boostBtn = document.getElementById("boostBtn");

  let W = 800;
  let H = 600;
  let dpr = 1;
  let last = 0;
  let running = false;

  let score = 0;
  let coins = 0;
  let best = Number(localStorage.getItem("neonTaxiBest") || 0);

  let roadOffset = 0;
  let spawnTimer = 0;
  let coinTimer = 0;

  let traffic = [];
  let pickups = [];
  let particles = [];

  let boosting = false;

  const keys = {};

  const lanes = [0.34, 0.5, 0.66];

  const player = {
    x: 0,
    y: 0,
    w: 43,
    h: 70,
    lane: 1,
    invincible: 0
  };

  bestEl.textContent = String(best).padStart(4, "0");

  function laneX(lane) {
    return W * lanes[lane];
  }

  function roadBounds() {
    return {
      left: W * 0.22,
      right: W * 0.78,
      width: W * 0.56
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = Math.max(320, rect.width);
    H = Math.max(390, rect.height);

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    player.y = H * 0.75;
    player.x = laneX(player.lane);
  }

  function reset() {
    score = 0;
    coins = 0;
    roadOffset = 0;
    spawnTimer = 0.4;
    coinTimer = 1;

    traffic = [];
    pickups = [];
    particles = [];

    player.lane = 1;
    player.x = laneX(1);
    player.y = H * 0.75;
    player.invincible = 0;

    scoreEl.textContent = "0000";
    coinsEl.textContent = "0";
    speedEl.textContent = "1x";
  }

  function start() {
    reset();

    running = true;

    overlay.classList.add("hidden");
    gameOver.classList.add("hidden");

    statusEl.textContent = "SHIFT AKTIF";
    last = performance.now();
  }

  function endGame() {
    running = false;

    const final = Math.floor(score);

    finalScore.textContent = String(final).padStart(4, "0");

    if (final > best) {
      best = final;

      localStorage.setItem("neonTaxiBest", best);

      bestEl.textContent = String(best).padStart(4, "0");
    }

    gameOver.classList.remove("hidden");
    statusEl.textContent = "SHIFT SELESAI";
  }

  function roundedRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function drawCar(x, y, w, h, color, isPlayer = false) {
    ctx.save();
    ctx.translate(x, y);

    ctx.shadowColor = color;
    ctx.shadowBlur = isPlayer ? 18 : 7;

    roundedRect(-w / 2, -h / 2, w, h, 9, color);

    ctx.shadowBlur = 0;

    roundedRect(
      -w * 0.34,
      -h * 0.28,
      w * 0.68,
      h * 0.34,
      5,
      isPlayer ? "#193f4a" : "#233446"
    );

    roundedRect(
      -w * 0.32,
      h * 0.13,
      w * 0.64,
      h * 0.25,
      4,
      isPlayer ? "#b6fff3" : "#9aafc1"
    );

    ctx.fillStyle = isPlayer ? "#f8df75" : "#d4e0e8";

    ctx.fillRect(-w * 0.28, -h * 0.04, w * 0.56, 3);

    ctx.fillStyle = "#fff4c0";

    ctx.fillRect(-w * 0.36, -h * 0.43, w * 0.2, 4);
    ctx.fillRect(w * 0.16, -h * 0.43, w * 0.2, 4);

    ctx.fillStyle = "#ff496b";

    ctx.fillRect(-w * 0.36, h * 0.4, w * 0.2, 4);
    ctx.fillRect(w * 0.16, h * 0.4, w * 0.2, 4);

    ctx.fillStyle = "#070d15";

    ctx.fillRect(-w * 0.57, -h * 0.28, w * 0.15, h * 0.2);
    ctx.fillRect(w * 0.42, -h * 0.28, w * 0.15, h * 0.2);

    ctx.fillRect(-w * 0.57, h * 0.2, w * 0.15, h * 0.2);
    ctx.fillRect(w * 0.42, h * 0.2, w * 0.15, h * 0.2);

    if (isPlayer) {
      roundedRect(-w * 0.23, -h * 0.08, w * 0.46, h * 0.18, 3, "#f6c84b");

      ctx.fillStyle = "#111b28";
      ctx.font = "bold 7px sans-serif";
      ctx.textAlign = "center";

      ctx.fillText("TAXI", 0, h * 0.045);
    }

    ctx.restore();
  }

  function drawWorld() {
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);

    bg.addColorStop(0, "#101d32");
    bg.addColorStop(1, "#101c26");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const bounds = roadBounds();

    // Gedung kota di kedua sisi jalan
    for (let side = 0; side < 2; side++) {
      const x0 = side === 0 ? 0 : bounds.right;
      const x1 = side === 0 ? bounds.left : W;

      ctx.fillStyle = "#111e2b";
      ctx.fillRect(x0, 0, x1 - x0, H);

      for (let i = 0; i < 10; i++) {
        const bw = (x1 - x0) / 7;
        const bx = x0 + i * bw + (i % 2) * 5;
        const bh = 35 + ((i * 31) % 85);
        const by = ((i * 67 + roadOffset * 0.25) % (H + 100)) - bh;

        ctx.fillStyle = i % 2 ? "#172b3a" : "#1b293c";
        ctx.fillRect(bx, by, bw * 0.65, bh);

        for (let wy = by + 8; wy < by + bh - 5; wy += 13) {
          for (let wx = bx + 5; wx < bx + bw * 0.55; wx += 10) {
            ctx.fillStyle = (i + Math.floor(wy)) % 3 === 0
              ? "#55f4db"
              : "#f4bc67";

            ctx.globalAlpha = 0.45;
            ctx.fillRect(wx, wy, 3, 5);
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // Aspal
    ctx.fillStyle = "#27313e";
    ctx.fillRect(bounds.left, 0, bounds.width, H);

    ctx.fillStyle = "#3a4856";
    ctx.fillRect(bounds.left, 0, 4, H);
    ctx.fillRect(bounds.right - 4, 0, 4, H);

    // Garis pembatas jalur
    ctx.strokeStyle = "#71818f";
    ctx.lineWidth = 2;
    ctx.setLineDash([25, 25]);
    ctx.lineDashOffset = -roadOffset;

    ctx.beginPath();
    ctx.moveTo(W * 0.405, 0);
    ctx.lineTo(W * 0.405, H);

    ctx.moveTo(W * 0.595, 0);
    ctx.lineTo(W * 0.595, H);

    ctx.stroke();
    ctx.setLineDash([]);

    // Lampu jalan
    for (let y = -30 + (roadOffset % 55); y < H; y += 55) {
      ctx.fillStyle = "#55f4db";
      ctx.globalAlpha = 0.7;

      ctx.fillRect(bounds.left - 7, y, 2, 13);
      ctx.fillRect(bounds.right + 5, y + 22, 2, 13);

      ctx.globalAlpha = 1;
    }
  }

  function spawnTraffic() {
    const lane = Math.floor(Math.random() * 3);

    traffic.push({
      lane,
      x: laneX(lane),
      y: -90,
      w: 39 + Math.random() * 5,
      h: 62 + Math.random() * 10,
      color: ["#ff4f92", "#7c8dff", "#f39c57", "#7ee0b2"][
        Math.floor(Math.random() * 4)
      ],
      speed: 0.82 + Math.random() * 0.28
    });
  }

  function spawnCoin() {
    const lane = Math.floor(Math.random() * 3);

    pickups.push({
      lane,
      x: laneX(lane),
      y: -30,
      r: 11,
      spin: Math.random() * 6
    });
  }

  function moveLane(direction) {
    if (!running) return;

    player.lane = Math.max(
      0,
      Math.min(2, player.lane + direction)
    );
  }

  function setBoost(value) {
    boosting = value;
  }

  function update(dt) {
    const boost = boosting ? 1.65 : 1;
    const velocity = 260 * boost + Math.min(score * 0.025, 130);

    roadOffset = (roadOffset + velocity * dt) % 1000;

    player.x += (laneX(player.lane) - player.x) * Math.min(1, dt * 13);

    player.invincible = Math.max(0, player.invincible - dt);

    spawnTimer -= dt;

    if (spawnTimer <= 0) {
      spawnTraffic();

      spawnTimer = Math.max(0.42, 1.15 - score / 6000)
        * (Math.random() * 0.45 + 0.75);
    }

    coinTimer -= dt;

    if (coinTimer <= 0) {
      spawnCoin();
      coinTimer = 1.05 + Math.random() * 0.75;
    }

    traffic.forEach(car => {
      car.y += velocity * car.speed * dt;
    });

    pickups.forEach(coin => {
      coin.y += velocity * dt;
      coin.spin += dt * 5;
    });

    traffic = traffic.filter(car => car.y < H + 100);
    pickups = pickups.filter(coin => coin.y < H + 40);

    // Deteksi tabrakan
    for (const car of traffic) {
      const hitX = Math.abs(car.x - player.x) < (car.w + player.w) * 0.39;
      const hitY = Math.abs(car.y - player.y) < (car.h + player.h) * 0.39;

      if (hitX && hitY && player.invincible <= 0) {
        endGame();
        return;
      }
    }

    // Ambil koin
    pickups = pickups.filter(coin => {
      const hitX = Math.abs(coin.x - player.x) < 32;
      const hitY = Math.abs(coin.y - player.y) < 45;

      if (hitX && hitY) {
        coins++;
        score += 100;

        coinsEl.textContent = coins;

        for (let i = 0; i < 7; i++) {
          particles.push({
            x: coin.x,
            y: coin.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.45
          });
        }

        return false;
      }

      return true;
    });

    particles.forEach(particle => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    });

    particles = particles.filter(particle => particle.life > 0);

    score += dt * (boosting ? 18 : 12);

    scoreEl.textContent = String(Math.floor(score)).padStart(4, "0");

    speedEl.textContent = boosting
      ? "2x"
      : (1 + Math.min(1, score / 8000)).toFixed(1) + "x";
  }

  function render() {
    drawWorld();

    // Koin
    pickups.forEach(coin => {
      ctx.save();

      ctx.translate(coin.x, coin.y);
      ctx.rotate(coin.spin);

      ctx.shadowColor = "#ffdb72";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#ffdb72";

      ctx.beginPath();
      ctx.moveTo(0, -coin.r);
      ctx.lineTo(coin.r * 0.75, 0);
      ctx.lineTo(0, coin.r);
      ctx.lineTo(-coin.r * 0.75, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // Mobil lalu lintas
    traffic.forEach(car => {
      drawCar(car.x, car.y, car.w, car.h, car.color);
    });

    // Partikel koin
    particles.forEach(particle => {
      ctx.globalAlpha = Math.max(0, particle.life / 0.45);
      ctx.fillStyle = "#ffdb72";
      ctx.fillRect(particle.x, particle.y, 3, 3);
      ctx.globalAlpha = 1;
    });

    // Taxi pemain
    drawCar(player.x, player.y, player.w, player.h, "#f5c842", true);

    // Efek boost
    if (boosting && running) {
      ctx.strokeStyle = "#55f4db66";
      ctx.lineWidth = 2;

      for (let i = 0; i < 12; i++) {
        const x = W * 0.22 + Math.random() * W * 0.56;
        const y = Math.random() * H;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 18 + Math.random() * 30);
        ctx.stroke();
      }
    }
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000 || 0, 0.04);

    last = now;

    if (running) {
      update(dt);
    }

    render();

    requestAnimationFrame(loop);
  }

  // Tombol permainan
  startBtn.addEventListener("click", start);
  restartBtn.addEventListener("click", start);

  leftBtn.addEventListener("pointerdown", event => {
    event.preventDefault();
    moveLane(-1);
  });

  rightBtn.addEventListener("pointerdown", event => {
    event.preventDefault();
    moveLane(1);
  });

  boostBtn.addEventListener("pointerdown", event => {
    event.preventDefault();
    setBoost(true);
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach(eventName => {
    boostBtn.addEventListener(eventName, () => setBoost(false));
  });

  // Keyboard PC
  window.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }

    if (!event.repeat) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        moveLane(-1);
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        moveLane(1);
      }
    }

    if (event.key === " " || event.key === "Shift") {
      setBoost(true);
    }

    if (event.key === "Enter" && !running) {
      start();
    }
  });

  window.addEventListener("keyup", event => {
    if (event.key === " " || event.key === "Shift") {
      setBoost(false);
    }
  });

  window.addEventListener("blur", () => {
    setBoost(false);
  });

  window.addEventListener("resize", resize);

  resize();
  reset();

  requestAnimationFrame(now => {
    last = now;
    loop(now);
  });
})();
