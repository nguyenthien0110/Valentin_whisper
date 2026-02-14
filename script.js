const bgCanvas = document.getElementById("bgCanvas");
const bgCtx = bgCanvas.getContext("2d");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const hint = document.getElementById("hint");
const audio = document.getElementById("bgMusic");

let bgWidth, bgHeight, width, height;

function resizeCanvases() {
  bgWidth = bgCanvas.width = window.innerWidth;
  bgHeight = bgCanvas.height = window.innerHeight;
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

resizeCanvases();
window.addEventListener("resize", resizeCanvases);

// Background falling words
const fallingWords = [];
const words = ["VALENTINE", "❤️", "Valentine", "LOVE", "💕", "14.2"];

class FallingWord {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * bgWidth;
    this.y = -50 - Math.random() * 200;
    this.speed = 0.8 + Math.random() * 1.8;
    this.word = words[Math.floor(Math.random() * words.length)];
    this.fontSize = 18 + Math.random() * 22;
    this.opacity = 0.3 + Math.random() * 0.4;
    this.rotation = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 1.5;
  }

  update() {
    this.y += this.speed;
    this.rotation += this.rotSpeed;
    if (this.y > bgHeight + 50) this.reset();
  }

  draw() {
    bgCtx.save();
    bgCtx.translate(this.x, this.y);
    bgCtx.rotate((this.rotation * Math.PI) / 180);
    bgCtx.globalAlpha = this.opacity;
    bgCtx.fillStyle = "#ff99cc";
    bgCtx.font = `${this.fontSize}px Arial`;
    bgCtx.textAlign = "center";
    bgCtx.fillText(this.word, 0, 0);
    bgCtx.restore();
  }
}

for (let i = 0; i < 70; i++) {
  fallingWords.push(new FallingWord());
}

function animateBackground() {
  bgCtx.clearRect(0, 0, bgWidth, bgHeight);
  fallingWords.forEach((w) => {
    w.update();
    w.draw();
  });
  requestAnimationFrame(animateBackground);
}

// Main canvas - particles
let particles = [];
let currentShape = "heart";
let isPlaying = false;
let messageIndex = -1;

const messages = [
  "Chúc em Valentine vui vẻ",
  "Anh yêu em nhất trên đời",
  "Hãy luôn bên cạnh anh nhé",
  "Em là người tuyệt nhất trên đời",
  "Chúc em luôn hạnh phúc",
  "Love you",
];

class Particle {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.tx = this.x;
    this.ty = this.y;
  }

  update() {
    this.x += (this.tx - this.x) * 0.08;
    this.y += (this.ty - this.y) * 0.08;
  }

  draw() {
    ctx.fillRect(this.x, this.y, 2, 2);
  }
}

function getPointsFromCanvas(drawFn) {
  const temp = document.createElement("canvas");
  temp.width = width;
  temp.height = height;
  const tctx = temp.getContext("2d");
  drawFn(tctx);

  const imageData = tctx.getImageData(0, 0, width, height).data;
  const points = [];

  for (let y = 0; y < height; y += 5) {
    for (let x = 0; x < width; x += 5) {
      const i = (y * width + x) * 4;
      if (imageData[i + 3] > 100) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

function drawHeart(c) {
  c.fillStyle = "#ff4d6d";
  c.beginPath();
  const cx = width / 2;
  const cy = height / 2 - 30;
  const size = Math.min(width, height) * 0.18;
  c.moveTo(cx, cy + size * 0.9);
  c.bezierCurveTo(
    cx - size * 1.7,
    cy - size * 0.3,
    cx - size * 1.2,
    cy - size * 1.7,
    cx,
    cy - size * 0.9,
  );
  c.bezierCurveTo(
    cx + size * 1.2,
    cy - size * 1.7,
    cx + size * 1.7,
    cy - size * 0.3,
    cx,
    cy + size * 0.9,
  );
  c.fill();
}

function drawSingleMessage(c, text) {
  c.fillStyle = "white";
  c.textAlign = "center";
  c.textBaseline = "middle";

  let fontSize = Math.min(100, width * 0.13);
  if (height < 700) fontSize *= 0.88;

  c.font = `bold ${fontSize}px Arial, sans-serif`;

  const maxWidth = width * 0.88;
  const wordsArr = text.split(" ");
  let line = "";
  let lines = [];

  for (let word of wordsArr) {
    const testLine = line + word + " ";
    if (c.measureText(testLine).width > maxWidth && line !== "") {
      lines.push(line);
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const lineHeight = fontSize * 1.15;
  const totalHeight = lines.length * lineHeight;
  let startY = height / 2 - totalHeight / 2 + lineHeight / 2;

  lines.forEach((ln, i) => {
    c.fillText(ln.trim(), width / 2, startY + i * lineHeight);
  });
}

function setTarget() {
  let points;
  if (messageIndex < 0) {
    points = getPointsFromCanvas(drawHeart);
    currentShape = "heart";
    hint.textContent = "Nhấn vào trái tim";
  } else {
    const drawFn = (c) => drawSingleMessage(c, messages[messageIndex]);
    points = getPointsFromCanvas(drawFn);
    currentShape = "text";
    hint.textContent = `Dòng ${messageIndex + 1}/${messages.length}`;
  }

  while (particles.length < points.length) {
    particles.push(new Particle());
  }

  particles.forEach((p, i) => {
    const pt = points[i % points.length];
    p.tx = pt.x;
    p.ty = pt.y;
  });

  if (particles.length > points.length * 1.4) {
    particles.length = Math.floor(points.length * 1.3);
  }
}

function nextMessage() {
  if (messageIndex < messages.length - 1) {
    messageIndex++;
    setTarget();
    setTimeout(nextMessage, 4800);
  } else {
    setTimeout(() => {
      messageIndex = -1;
      setTarget();
      isPlaying = false;
      audio.pause();
      audio.currentTime = 0;
    }, 5500);
  }
}

// Event listeners
canvas.addEventListener("click", () => {
  if (!isPlaying && currentShape === "heart") {
    isPlaying = true;
    messageIndex = -1;
    audio.play().catch(() => {});
    nextMessage();
  }
});

function animateMain() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "white";
  particles.forEach((p) => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateMain);
}

// Init
for (let i = 0; i < 5000; i++) {
  particles.push(new Particle());
}
setTarget();
animateMain();
animateBackground();
