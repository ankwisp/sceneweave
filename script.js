const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const generateBtn = document.getElementById("generateBtn");
const promptInput = document.getElementById("promptInput");
const aiSettings = document.getElementById("aiSettings");

let particles = [];
let sceneTransition = 1;

let mood = "normal";
let particleColor = "#D99A9A";
let particleSizeMultiplier = 1;
let particleCount = 30;
let backgroundColor = "#D8D1C4";

let visualSettings = {
  color: "#D99A9A",
  background: "#D8D1C4",
  speed: 1,
  density: 30,
  size: 1,
  movement: "normal",
  shape: "circle",
  glow: 15,
};

function applyVisualSettings(settings) {
  visualSettings.color = settings.color;
  visualSettings.background = settings.background;
  visualSettings.speed = settings.speed;
  visualSettings.density = settings.density;
  visualSettings.size = settings.size;
  visualSettings.movement = settings.movement;
  visualSettings.shape = settings.shape;
  visualSettings.glow = settings.glow;

  particleColor = settings.color;
  particleSizeMultiplier = settings.size;
  particleCount = settings.density;
  backgroundColor = settings.background;

  sceneTransition = 0;
}

function createParticles() {
  particles = [];

  for (let i = 0; i < visualSettings.density; i++) {
    let shapeType = 0;

    if (visualSettings.shape === "square") {
      shapeType = 1;
    } else if (visualSettings.shape === "triangle") {
      shapeType = 2;
    }

    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      size: Math.random() * 10 + 2,
      opacity: Math.random() * 0.6 + 0.4,
      shape: shapeType,
    });
  }
}

createParticles();

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let dx = particles[i].x - particles[j].x;
      let dy = particles[i].y - particles[j].y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 140) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);

        ctx.strokeStyle = particleColor;
        ctx.globalAlpha = 0.15;
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
}

function animate() {
  sceneTransition += 0.02;

  if (sceneTransition > 1) {
    sceneTransition = 1;
  }

  ctx.fillStyle = visualSettings.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let particle of particles) {
    ctx.globalAlpha = particle.opacity * sceneTransition;
    ctx.fillStyle = particleColor;

    ctx.shadowBlur = visualSettings.glow;
    ctx.shadowColor = visualSettings.color;

    ctx.beginPath();

    if (particle.shape === 0) {
      ctx.arc(
        particle.x,
        particle.y,
        particle.size * particleSizeMultiplier,
        0,
        Math.PI * 2,
      );
    } else if (particle.shape === 1) {
      let size = particle.size * particleSizeMultiplier;

      ctx.fillRect(particle.x - size, particle.y - size, size * 2, size * 2);
    } else {
      let size = particle.size * particleSizeMultiplier;

      ctx.moveTo(particle.x, particle.y - size);
      ctx.lineTo(particle.x - size, particle.y + size);
      ctx.lineTo(particle.x + size, particle.y + size);
      ctx.closePath();
    }

    ctx.fill();

    // Base movement
    particle.x += particle.speedX * visualSettings.speed;
    particle.y += particle.speedY * visualSettings.speed;

    // Movement modes
    if (visualSettings.movement === "float") {
      particle.x += Math.sin(Date.now() * 0.001 + particle.y * 0.01) * 0.35;

      particle.y += Math.cos(Date.now() * 0.001 + particle.x * 0.01) * 0.2;
    }

    if (visualSettings.movement === "fast") {
      particle.x += Math.sin(Date.now() * 0.006 + particle.y * 0.01) * 1.2;

      particle.y += Math.cos(Date.now() * 0.006 + particle.x * 0.01) * 1.2;
    }

    if (visualSettings.movement === "wave") {
      particle.y += Math.sin(Date.now() * 0.003 + particle.x * 0.02) * 1.2;
    }

    if (visualSettings.movement === "rain") {
      // Rain should fall downward instead of drifting randomly.
      particle.x += 0.2;
      particle.y += 2.5 * visualSettings.speed;

      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x, particle.y + particle.size * 3);

      ctx.strokeStyle = particleColor;
      ctx.globalAlpha = particle.opacity * 0.35;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (particle.y > canvas.height) {
        particle.y = -10;
        particle.x = Math.random() * canvas.width;
      }
    }

    // Bounce from edges
    if (visualSettings.movement !== "rain") {
      if (particle.x < 0 || particle.x > canvas.width) {
        particle.speedX *= -1;
      }

      if (particle.y < 0 || particle.y > canvas.height) {
        particle.speedY *= -1;
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  drawConnections();

  requestAnimationFrame(animate);
}

animate();

generateBtn.addEventListener("click", async function () {
  const prompt = promptInput.value.trim();

  if (prompt === "") {
    promptInput.focus();
    return;
  }

  generateBtn.textContent = "Generating...";
  generateBtn.disabled = true;

  try {
    const response = await fetch("http://localhost:3000/visualize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error("Server returned an error.");
    }

    const data = await response.json();

    console.log("SERVER RESPONSE:", data);

    applyVisualSettings(data);
    createParticles();

    document.getElementById("aiMood").textContent = data.mood || "—";

    document.getElementById("aiAtmosphere").textContent =
      data.atmosphere || "—";

    document.getElementById("aiEnergy").textContent = data.energy || "—";

    console.log("Prompt:", prompt);
    console.log("Visual settings applied:", visualSettings);
  } catch (error) {
    console.error("Generation error:", error);

    document.getElementById("aiMood").textContent = "Unavailable";
    document.getElementById("aiAtmosphere").textContent = "Unavailable";
    document.getElementById("aiEnergy").textContent = "Try again";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate";
  }
});

promptInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    generateBtn.click();
  }
});
