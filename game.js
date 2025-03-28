// Crear el canvas y añadirlo al contenedor
const canvas = document.createElement('canvas');
const container = document.querySelector('.container-game');
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Tamaño del canvas
canvas.width = 800;
canvas.height = 600;

// Los pasillos del juego y sus conexiones
// Cada pasillo tiene posición, tamaño y salidas a otros pasillos
const hallways = {
  1: { x: 100, y: 100, width: 600, height: 100, exits: { right: 2 } },
  2: { x: 100, y: 200, width: 100, height: 300, exits: { down: 3 } },
  3: { x: 200, y: 400, width: 500, height: 100, exits: { left: 4 } },
  4: { x: 100, y: 200, width: 200, height: 400, exits: { up: 5 } },
  5: { x: 300, y: 100, width: 200, height: 200 }
};

// Portales para pasar de un pasillo a otro
// Son esos cuadrados rojos que hay que tocar
const portals = {
  1: { x: 650, y: 130, width: 40, height: 40 },
  2: { x: 130, y: 460, width: 40, height: 40 },
  3: { x: 200, y: 430, width: 40, height: 40 },
  4: { x: 130, y: 200, width: 40, height: 40 },
  5: { x: 400, y: 180, width: 40, height: 40 }
};

// Los fantasmas que persiguen al jugador
// Tienen posición, tamaño, velocidad y color
const ghosts = {
  1: { x: 400, y: 150, size: 25, speed: 2, color: 'rgba(200, 200, 255, 0.7)' },
  2: { x: 150, y: 300, size: 25, speed: 2.2, color: 'rgba(220, 180, 255, 0.7)' },
  3: { x: 400, y: 450, size: 25, speed: 2.4, color: 'rgba(255, 200, 200, 0.7)' },
  4: { x: 150, y: 300, size: 25, speed: 2.6, color: 'rgba(180, 255, 200, 0.7)' },
  5: { x: 350, y: 200, size: 25, speed: 3, color: 'rgba(255, 255, 180, 0.7)' }
};

// Variables principales del juego
let currentHallway = 1; // Pasillo actual
let gameActive = true; // Si el juego está activo

// El jugador (cuadrado negro)
const player = {
  x: 150,
  y: 150,
  size: 32,
  speed: 5,
  image: new Image()
};

player.image.src = 'empanadaCute.png';

// Para detectar teclas presionadas
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Cosas del temporizador
let startTime;
let timerInterval;
let bestTime = localStorage.getItem('bestTime') || Infinity;

// Inicia el temporizador del juego
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 100);
}

// Actualiza el tiempo mostrado
function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  document.getElementById('time').textContent =
    `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Maneja el movimiento del jugador
function handleMovement() {
  const hall = hallways[currentHallway];
  let dx = 0, dy = 0;

  // Detecta teclas para mover
  if (keys['a'] || keys['ArrowLeft']) dx = -1;
  if (keys['d'] || keys['ArrowRight']) dx = 1;
  if (keys['w'] || keys['ArrowUp']) dy = -1;
  if (keys['s'] || keys['ArrowDown']) dy = 1;

  // Calcula nueva posición
  let newX = player.x + dx * player.speed;
  let newY = player.y + dy * player.speed;

  // Evita que el jugador salga del pasillo
  if (newX < hall.x) {
    newX = hall.x;
  } else if (newX + player.size > hall.x + hall.width) {
    newX = hall.x + hall.width - player.size;
  }

  if (newY < hall.y) {
    newY = hall.y;
  } else if (newY + player.size > hall.y + hall.height) {
    newY = hall.y + hall.height - player.size;
  }

  player.x = newX;
  player.y = newY;

  // Revisa si tocó el portal para cambiar de pasillo
  const portal = portals[currentHallway];
  if (checkCollision(player, portal)) {
    if (currentHallway < 5) {
      // Ir al siguiente pasillo
      const nextHall = hall.exits[Object.keys(hall.exits)[0]];
      transitionHallway(nextHall);
    } else {
      // Si es el último pasillo, ganaste
      endGame(true);
    }
  }

  // Mover fantasma y revisar si te atrapó
  moveGhost();
  const ghost = ghosts[currentHallway];
  if (checkCollisionCircle(player, ghost)) {
    endGame(false); // Perdiste
  }
}

// Mueve el fantasma hacia el jugador
function moveGhost() {
  const ghost = ghosts[currentHallway];
  const hall = hallways[currentHallway];

  // Calcula dirección hacia el jugador
  const dx = player.x - ghost.x;
  const dy = player.y - ghost.y;

  // Calcula distancia
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Solo mueve si no está muy cerca
  if (distance > 2) {
    // Normaliza la dirección
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Mueve el fantasma
    ghost.x += dirX * ghost.speed;
    ghost.y += dirY * ghost.speed;

    // Mantiene el fantasma dentro del pasillo
    if (ghost.x < hall.x) ghost.x = hall.x;
    if (ghost.x + ghost.size > hall.x + hall.width) ghost.x = hall.x + hall.width - ghost.size;
    if (ghost.y < hall.y) ghost.y = hall.y;
    if (ghost.y + ghost.size > hall.y + hall.height) ghost.y = hall.y + hall.height - ghost.size;
  }
}

// Detecta colisión entre dos rectángulos
function checkCollision(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.size > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.size > obj2.y
  );
}

// Detecta colisión entre círculos (para el fantasma)
function checkCollisionCircle(player, ghost) {
  // Centros
  const playerCenterX = player.x + player.size / 2;
  const playerCenterY = player.y + player.size / 2;
  const ghostCenterX = ghost.x + ghost.size / 2;
  const ghostCenterY = ghost.y + ghost.size / 2;

  // Distancia entre centros
  const dx = playerCenterX - ghostCenterX;
  const dy = playerCenterY - ghostCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Radio sumado
  const sumRadii = (player.size + ghost.size) / 2;

  // Hay colisión si están cerca
  return distance < sumRadii * 0.8; // El 0.8 es para ser menos estricto
}

// Cambia de pasillo
function transitionHallway(newHall) {
  currentHallway = newHall;

  // Posiciona al jugador en la entrada del nuevo pasillo
  const hall = hallways[newHall];
  // Esto lo hice medio a ojo, podría mejorarse
  switch (newHall) {
    case 2:
      player.x = hall.x + 20;
      player.y = hall.y + 20;
      break;
    case 3:
      player.x = hall.x + hall.width - 60;
      player.y = hall.y + 20;
      break;
    case 4:
      player.x = hall.x + 20;
      player.y = hall.y + hall.height - 60;
      break;
    case 5:
      player.x = hall.x + 20;
      player.y = hall.y + 20;
      break;
  }

  // Aleja el fantasma del jugador
  resetGhostPosition();
}

// Reposiciona el fantasma lejos del jugador
function resetGhostPosition() {
  const ghost = ghosts[currentHallway];
  const hall = hallways[currentHallway];

  // Busca una posición aleatoria pero lejos del jugador
  let newX, newY;
  let intentos = 0;
  do {
    // Posición aleatoria
    newX = hall.x + Math.random() * (hall.width - ghost.size);
    newY = hall.y + Math.random() * (hall.height - ghost.size);

    // Distancia al jugador
    const dx = newX - player.x;
    const dy = newY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Si está lejos o ya intentamos mucho, usamos esta posición
    if (distance > 150 || intentos > 10) break;
    intentos++;
  } while (true);

  ghost.x = newX;
  ghost.y = newY;
}

// Termina el juego (victoria o derrota)
function endGame(win) {
  gameActive = false;
  clearInterval(timerInterval);

  const currentTime = (Date.now() - startTime) / 1000;

  // Guarda mejor tiempo si ganaste
  if (win && currentTime < bestTime) {
    bestTime = currentTime;
    localStorage.setItem('bestTime', bestTime);
  }

  // Pantalla final
  const endScreen = document.createElement('div');
  endScreen.id = 'endScreen';
  endScreen.innerHTML = `
    <h1>${win ? '¡Has escapado de la escuela!' : '¡Te ha atrapado un fantasma!'}</h1>
    <p>Tu tiempo: ${formatTime(currentTime)}</p>
    <p>Mejor tiempo: ${formatTime(bestTime)}</p>
    <button id="restartButton">Volver al inicio</button>
  `;

  document.body.appendChild(endScreen);

  // Botón para reiniciar
  document.getElementById('restartButton').addEventListener('click', function () {
    window.location.href = 'index.html';
  });
}

// Da formato al tiempo (minutos:segundos)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Dibuja el fantasma con efectos
function drawGhost(ghost) {
  // Efecto de flotación
  const floatOffset = Math.sin(Date.now() / 200) * 3;

  // Cuerpo principal
  ctx.fillStyle = ghost.color;
  ctx.beginPath();
  ctx.ellipse(
    ghost.x + ghost.size / 2,
    ghost.y + ghost.size / 2 + floatOffset,
    ghost.size / 2,
    ghost.size / 1.5,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  // Parte inferior ondulada
  ctx.beginPath();
  ctx.moveTo(ghost.x, ghost.y + ghost.size / 1.2 + floatOffset);

  // Ondas en la parte inferior
  for (let i = 0; i <= 4; i++) {
    const waveX = ghost.x + (ghost.size / 4) * i;
    const waveY = ghost.y + ghost.size + Math.sin(i + Date.now() / 300) * 5 + floatOffset;
    ctx.lineTo(waveX, waveY);
  }

  ctx.lineTo(ghost.x + ghost.size, ghost.y + ghost.size / 1.2 + floatOffset);
  ctx.fill();

  // Ojos blancos
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.ellipse(
    ghost.x + ghost.size / 3,
    ghost.y + ghost.size / 2 + floatOffset,
    ghost.size / 6,
    ghost.size / 6,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(
    ghost.x + ghost.size * 2 / 3,
    ghost.y + ghost.size / 2 + floatOffset,
    ghost.size / 6,
    ghost.size / 6,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  // Pupilas que miran al jugador
  const playerCenterX = player.x + player.size / 2;
  const playerCenterY = player.y + player.size / 2;

  // Ángulos hacia el jugador
  const angle1 = Math.atan2(
    playerCenterY - (ghost.y + ghost.size / 2),
    playerCenterX - (ghost.x + ghost.size / 3)
  );

  const angle2 = Math.atan2(
    playerCenterY - (ghost.y + ghost.size / 2),
    playerCenterX - (ghost.x + ghost.size * 2 / 3)
  );

  // Tamaño y posición de las pupilas
  const eyeRadius = ghost.size / 12;
  const maxOffset = ghost.size / 12;

  const pupil1X = ghost.x + ghost.size / 3 + Math.cos(angle1) * maxOffset;
  const pupil1Y = ghost.y + ghost.size / 2 + Math.sin(angle1) * maxOffset + floatOffset;

  const pupil2X = ghost.x + ghost.size * 2 / 3 + Math.cos(angle2) * maxOffset;
  const pupil2Y = ghost.y + ghost.size / 2 + Math.sin(angle2) * maxOffset + floatOffset;

  // Dibujar pupilas negras
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.ellipse(pupil1X, pupil1Y, eyeRadius, eyeRadius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(pupil2X, pupil2Y, eyeRadius, eyeRadius, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Dibuja todo en pantalla
function draw() {
  // Limpia la pantalla
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibuja el pasillo actual
  const hall = hallways[currentHallway];
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(hall.x, hall.y, hall.width, hall.height);

  // Dibuja el portal (puerta roja)
  const portal = portals[currentHallway];
  ctx.fillStyle = '#e63946';
  ctx.fillRect(portal.x, portal.y, portal.width, portal.height);

  // Dibuja el fantasma
  drawGhost(ghosts[currentHallway]);

  // Dibuja el jugador (cuadrado negro)
  if (player.image.complete) {
    ctx.drawImage(player.image, player.x, player.y, player.size, player.size);
  } else {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(player.x, player.y, player.size, player.size);
  }

  // Muestra el número de pasillo
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Pasillo ${currentHallway}`, 20, 30);
}

// Bucle principal del juego
function gameLoop() {
  if (!gameActive) return;

  handleMovement();
  draw();
  requestAnimationFrame(gameLoop);
}

// ¡Comienza el juego!
startTimer();
gameLoop();
