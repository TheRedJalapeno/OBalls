// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjust canvas dimensions to full viewport
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// UI Elements
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const alienSpeedDisplay = document.getElementById('alienSpeed');
const startButton = document.getElementById('startButton');
const gameOverDisplay = document.getElementById('gameOver');

// Game Variables
let player, enemies = [], bullets = [], ufo;
let score = 0;
let level = 1;
let gameRunning = false;
let keys = {};
let isShooting = false; // New variable for touch/click shooting
let currentAlienSpeed = 0;

// Icons for the enemies
const enemyIcons = ['memory', 'bug_report', 'immunology', 'coronavirus'];

// Event Listeners
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);
startButton.addEventListener('click', startGame);

// Add touch and click event listeners for shooting and movement
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchend', handleTouchEnd, false);
canvas.addEventListener('touchmove', handleTouchMove, false);

canvas.addEventListener('mousedown', handleMouseDown, false);
canvas.addEventListener('mouseup', handleMouseUp, false);
canvas.addEventListener('mousemove', handleMouseMove, false);

// Touch and Mouse Event Handlers
function handleTouchStart(e) {
    e.preventDefault();
    isShooting = true;
    updatePlayerPosition(e.touches[0].clientX);
}

function handleTouchEnd(e) {
    e.preventDefault();
    isShooting = false;
}

function handleTouchMove(e) {
    e.preventDefault();
    updatePlayerPosition(e.touches[0].clientX);
}

function handleMouseDown(e) {
    isShooting = true;
    updatePlayerPosition(e.clientX);
}

function handleMouseUp(e) {
    isShooting = false;
}

function handleMouseMove(e) {
    updatePlayerPosition(e.clientX);
}

function updatePlayerPosition(positionX) {
    player.x = positionX - player.width / 2;
    // Ensure the player doesn't move off-screen
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
}

// Game Objects
class GameObject {
    constructor(x, y, icon) {
        this.x = x;
        this.y = y;
        this.icon = icon;
        this.width = 36;
        this.height = 36;
        this.speed = 5;
    }

    draw() {
        ctx.font = `${this.height}px Material Icons`;
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'top'; // Align text to top
        ctx.fillText(this.icon, this.x, this.y);
    }
}

function startGame() {
    startButton.style.display = 'none';
    gameOverDisplay.style.display = 'none';
    score = 0;
    level = 1; // Initialize level
    gameRunning = true;
    player = new GameObject(canvas.width / 2 - 18, canvas.height - 60, 'rocket');
    player.canShoot = true;
    createEnemies();
    gameLoop();
}

function createEnemies() {
    enemies = [];
    const rows = 4;
    const cols = 10;
    const spacingX = 60;
    const spacingY = 60;
    const offsetX = (canvas.width - (cols - 1) * spacingX) / 2;
    const offsetY = 60;

    const baseSpeed = canvas.width / 300; // Base speed

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = offsetX + col * spacingX;
            const y = offsetY + row * spacingY - canvas.height; // Start off-screen
            const icon = enemyIcons[row % enemyIcons.length];
            const enemy = new GameObject(x, y, icon);
            enemy.speed = baseSpeed * Math.pow(1.2, level - 1); // Compounded speed increase
            enemies.push(enemy);
        }
    }

    currentAlienSpeed = baseSpeed * Math.pow(1.2, level - 1); // Store current alien base speed

    // Animate enemies sliding in from the top
    enemies.forEach(enemy => {
        enemy.y += canvas.height; // Slide in effect
    });

    // Reset UFO position and speed
    ufo = new GameObject(-100, 50, 'settings');
    ufo.speed = 2 * Math.pow(1.2, level - 1); // Compounded UFO speed
}

function gameLoop() {
    if (!gameRunning) return;

    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update Level and Alien Speed Displays
    levelDisplay.textContent = `Level: ${level}`;
    alienSpeedDisplay.textContent = `Alien Speed: ${currentAlienSpeed.toFixed(2)}`;

    // Player movement
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    // Player shooting
    if (keys['Space'] || isShooting) {
        shootBullet();
    }
    // Update bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        // Remove off-screen bullets
        if (bullet.y + bullet.height < 0) {
            bullets.splice(index, 1);
        }
    });
    // Update enemies
    let changeDirection = false;
    enemies.forEach(enemy => {
        // Calculate position factor (up to 20% additional increase)
        const distanceToPlayer = canvas.height - enemy.y - player.height;
        const totalDistance = canvas.height - 60 - player.height;
        const positionFactor = 1 + 0.2 * (1 - distanceToPlayer / totalDistance);

        const currentSpeed = enemy.speed * positionFactor;
        enemy.x += currentSpeed;

        // Check for edge collision to change direction
        if (enemy.x > canvas.width - enemy.width || enemy.x < 0) {
            changeDirection = true;
        }
    });
    if (changeDirection) {
        enemies.forEach(enemy => {
            enemy.speed *= -1;
            enemy.y += 20; // Move enemies down when changing direction
        });
    }
    // Collision detection between bullets and enemies
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (isColliding(bullet, enemy)) {
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                score += 10;
            }
        });

        // Check collision with UFO
        if (isColliding(bullet, ufo)) {
            bullets.splice(bIndex, 1);
            score += 50; // UFO gives more points
            // Reset UFO position
            ufo.x = -100;
            ufo.y = 50;
        }
    });
    // Collision detection between enemies and player
    enemies.forEach((enemy) => {
        if (isColliding(enemy, player) || enemy.y + enemy.height >= canvas.height) {
            gameOver(); // End the game immediately upon collision
        }
    });
    // UFO movement
    ufo.x += ufo.speed;
    if (ufo.x > canvas.width) {
        ufo.x = -100;
    }
    // Check if all enemies are destroyed
    if (enemies.length === 0) {
        level++;
        createEnemies();
    }
    // Update score display
    scoreDisplay.textContent = `Score: ${score}`;
}

function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw player
    player.draw();
    // Draw enemies
    enemies.forEach(enemy => enemy.draw());
    // Draw bullets
    bullets.forEach(bullet => bullet.draw());
    // Draw UFO
    ufo.draw();
}

function shootBullet() {
    if (!player.canShoot) return;
    const bullet = new GameObject(player.x + player.width / 2 - 5, player.y - 10, 'lens');
    bullet.width = 10;
    bullet.height = 10;
    bullet.speed = 10;
    bullet.draw = function () {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    };
    bullets.push(bullet);
    player.canShoot = false;
    setTimeout(() => player.canShoot = true, 300); // Fire rate
}

function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function gameOver() {
    gameRunning = false;
    gameOverDisplay.style.display = 'block';
    startButton.style.display = 'block';
    saveScore();
}

function saveScore() {
    let invadersScores = JSON.parse(localStorage.getItem('invadersScores')) || [];
    const playerName = prompt('Game Over! Enter your name:', 'Player');
    invadersScores.push({ name: playerName, score: score });
    localStorage.setItem('invadersScores', JSON.stringify(invadersScores));
    console.log(`Score saved: ${playerName} - ${score}`); // Console log
}
