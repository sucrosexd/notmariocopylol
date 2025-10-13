// Основные переменные игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const levelCompleteScreen = document.getElementById('levelCompleteScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const nextLevelButton = document.getElementById('nextLevelButton');
const coinCountElement = document.getElementById('coinCount');
const livesCountElement = document.getElementById('livesCount');
const levelCountElement = document.getElementById('levelCount');
const finalScoreElement = document.getElementById('finalScore');
const levelCoinsElement = document.getElementById('levelCoins');
const gamepadStatusElement = document.getElementById('gamepadStatus');

// Игровые переменные
let gameState = 'menu'; // menu, playing, paused, gameOver, levelComplete
let coins = 0;
let lives = 3;
let level = 1;
let gamepad = null;
let isGamepadConnected = false;

// Состояние клавиш клавиатуры
let keys = {};
let pauseKeyPressed = false;

// Анимационные переменные для кота
let isFacingRight = true;
let isAttacking = false;
let attackCooldown = 0;
let animationTime = 0;

// Размер уровня
let levelWidth = 4800;
let levelHeight = 1200;

// Камера для прокрутки уровня
let camera = {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight
};

// Загруженные SVG изображения для кота
const svgImages = {};

// Загрузка SVG
function loadSVG(id, src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            svgImages[id] = img;
            console.log(`SVG загружен: ${id}`);
            resolve(img);
        };
        img.onerror = () => {
            console.error(`Ошибка загрузки SVG: ${src}`);
            reject(new Error(`Не удалось загрузить ${src}`));
        };
        img.src = src;
    });
}

// Загрузка всех SVG для кота
async function loadAllSVGs() {
    try {
        await Promise.all([
            loadSVG('head', './assets/character/head.svg'),
            loadSVG('body', './assets/character/body.svg'),
            loadSVG('leftShoulder', './assets/character/left_shoulder.svg'),
            loadSVG('rightShoulder', './assets/character/right_shoulder.svg'),
            loadSVG('leftForearm', './assets/character/left_forearm.svg'),
            loadSVG('rightForearm', './assets/character/right_forearm.svg'),
            loadSVG('leftHip', './assets/character/left_hip.svg'),
            loadSVG('rightHip', './assets/character/right_hip.svg'),
            loadSVG('leftShin', './assets/character/left_shin.svg'),
            loadSVG('rightShin', './assets/character/right_shin.svg'),
            loadSVG('background', './assets/images/fon.svg')
        ]);
        console.log('Все SVG изображения кота загружены успешно');
    } catch (error) {
        console.error('Ошибка при загрузке SVG:', error);
    }
}

// Игровые объекты
let player = {
    x: 100,
    y: 800,
    width: 60,
    height: 90,
    speed: 8,
    velX: 0,
    velY: 0,
    jumping: false,
    grounded: false,
    direction: 1
};

let gravity = 0.8;
let friction = 0.8;

// Платформы
let platforms = [];

// Монеты
let coinsList = [];

// Враги
let enemies = [];

// Флаг завершения уровня
let flag = {
    x: 4500,
    y: 0,
    width: 60,
    height: 2000,
    color: '#ff0000ff'
};

// Функция для обновления размеров canvas
function resizeCanvas() {
    camera.width = window.innerWidth;
    camera.height = window.innerHeight;
    
    canvas.width = levelWidth;
    canvas.height = levelHeight;
    
    canvas.style.width = '100%';
    canvas.style.height = '100%';
}

// Инициализация игры
function init() {
    console.log('Инициализация игры...');
    
    // Установка размера canvas
    resizeCanvas();
    
    // Создание платформ для уровня 1
    platforms = [
        {x: 0, y: levelHeight - 30, width: levelWidth, height: 30, color: '#000000ff'},
        {x: 200, y: 900, width: 150, height: 30, color: '#D35400'},
        {x: 400, y: 800, width: 150, height: 30, color: '#D35400'},
        {x: 600, y: 700, width: 150, height: 30, color: '#D35400'},
        {x: 800, y: 800, width: 150, height: 30, color: '#D35400'},
        {x: 1000, y: 900, width: 150, height: 30, color: '#D35400'},
        {x: 1300, y: 900, width: 150, height: 30, color: '#D35400'},
        {x: 1600, y: 800, width: 150, height: 30, color: '#D35400'},
        {x: 1900, y: 700, width: 150, height: 30, color: '#D35400'},
        {x: 2200, y: 800, width: 150, height: 30, color: '#D35400'},
        {x: 2500, y: 900, width: 150, height: 30, color: '#D35400'},
        {x: 2800, y: 800, width: 150, height: 30, color: '#D35400'},
        {x: 3100, y: 900, width: 150, height: 30, color: '#D35400'},
        {x: 3400, y: 800, width: 150, height: 30, color: '#D35400'},
        {x: 3700, y: 700, width: 150, height: 30, color: '#D35400'},
        {x: 4000, y: 800, width: 150, height: 30, color: '#D35400'},
        {x: 4300, y: 900, width: 150, height: 30, color: '#D35400'},
        {x: 500, y: 600, width: 120, height: 30, color: '#D35400'},
        {x: 800, y: 500, width: 120, height: 30, color: '#D35400'},
        {x: 1500, y: 600, width: 120, height: 30, color: '#D35400'},
        {x: 2000, y: 500, width: 120, height: 30, color: '#D35400'},
        {x: 2700, y: 600, width: 120, height: 30, color: '#D35400'},
        {x: 3200, y: 500, width: 120, height: 30, color: '#D35400'},
        {x: 3800, y: 600, width: 120, height: 30, color: '#D35400'},
        {x: 4300, y: 500, width: 120, height: 30, color: '#D35400'}
    ];
    
    // Создание монет
    coinsList = [];
    for (let i = 0; i < 80; i++) {
        coinsList.push({
            x: Math.random() * (levelWidth - 150) + 75,
            y: Math.random() * 700 + 100,
            width: 30,
            height: 30,
            color: '#ffcc00ff',
            collected: false
        });
    }
    
    // Создание врагов
    enemies = [
        {x: 300, y: levelHeight - 70, width: 60, height: 60, speed: 3, direction: 1, color: '#8E44AD'},
        {x: 900, y: levelHeight - 70, width: 60, height: 60, speed: 3, direction: -1, color: '#8E44AD'},
        {x: 1500, y: levelHeight - 70, width: 60, height: 60, speed: 3, direction: 1, color: '#8E44AD'},
        {x: 2100, y: levelHeight - 70, width: 60, height: 60, speed: 3, direction: -1, color: '#8E44AD'},
        {x: 2700, y: levelHeight - 70, width: 60, height: 60, speed: 3, direction: 1, color: '#8E44AD'},
        {x: 3300, y: levelHeight - 70, width: 60, height: 60, speed: 3, direction: -1, color: '#8E44AD'},
        {x: 3900, y: levelHeight - 70, width: 60, height: 60, speed: 3, direction: 1, color: '#8E44AD'},
        {x: 4200, y: levelHeight - 70, width: 60, height: 60, speed: 3, direction: -1, color: '#8E44AD'}
    ];
    
    // Сброс позиции игрока и камеры
    player.x = 100;
    player.y = 800;
    player.velX = 0;
    player.velY = 0;
    player.jumping = false;
    player.direction = 1;
    
    camera.x = 0;
    camera.y = 0;
    
    coins = 0;
    coinCountElement.textContent = coins;
    livesCountElement.textContent = lives;
    levelCountElement.textContent = level;
    
    // Сброс анимационных переменных
    isAttacking = false;
    attackCooldown = 0;
    isFacingRight = true;
    animationTime = 0;
    pauseKeyPressed = false;
}

// Обновление камеры для следования за игроком
function updateCamera() {
    camera.x = player.x - camera.width / 2;
    
    if (camera.x < 0) camera.x = 0;
    if (camera.x + camera.width > levelWidth) camera.x = levelWidth - camera.width;
}

// Отрисовка SVG части кота
function drawSVGPart(id, x, y, width, height, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    const svgImage = svgImages[id];
    if (svgImage) {
        ctx.drawImage(svgImage, -width/2, -height/2, width, height);
    } else {
        // Заглушка
        ctx.fillStyle = '#888888';
        ctx.fillRect(-width/4, -height/2, width/2, height);
    }
    
    ctx.restore();
}

// Функция для отрисовки кота из SVG частей
function drawCat() {
    const x = player.x + player.width / 2;
    const y = player.y + player.height / 2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(player.direction, 1);
    
    // Тень
    if (player.grounded) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 60, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Анимация частей тела
    const walkRotation = Math.sin(animationTime * 6) * 0.3 * Math.abs(player.velX) / player.speed;
    const jumpRotation = player.grounded ? 0 : 0.5;
    
    // Ноги
    drawSVGPart('leftShin', -15, 40, 12, 21, walkRotation + jumpRotation);
    drawSVGPart('rightShin', 15, 40, 13, 22, -walkRotation + jumpRotation);
    
    // Бедра
    drawSVGPart('leftHip', -15, 25, 16, 26, walkRotation * 0.5);
    drawSVGPart('rightHip', 15, 25, 16, 26, -walkRotation * 0.5);
    
    // Тело
    drawSVGPart('body', 0, 0, 42, 55, 0);
    
    // Плечи
    drawSVGPart('leftShoulder', -20, 5, 17, 27, -walkRotation);
    drawSVGPart('rightShoulder', 20, 5, 18, 28, walkRotation);
    
    // Предплечья
    drawSVGPart('leftForearm', -25, 25, 27, 32, -walkRotation * 1.5);
    drawSVGPart('rightForearm', 25, 25, 32, 36, walkRotation * 1.5);
    
    // Голова
    drawSVGPart('head', 0, -50, 107, 109, 0);
    
    ctx.restore();
}

// Отрисовка игры с учетом камеры
function draw() {
    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Сохраняем текущее состояние контекста
    ctx.save();
    
    // Смещаем контекст на позицию камеры
    ctx.translate(-camera.x, -camera.y);
    
    // Рисование фона
    if (svgImages.background) {
        const pattern = ctx.createPattern(svgImages.background, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, levelWidth, levelHeight);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, levelHeight);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#1E90FF');
        gradient.addColorStop(1, '#0066CC');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, levelWidth, levelHeight);
    }
    
    // Рисование платформ
    for (let platform of platforms) {
        if (platform.x < camera.x + camera.width && platform.x + platform.width > camera.x) {
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            if (platform.y < levelHeight - 30) {
                ctx.fillStyle = '#A04000';
                ctx.fillRect(platform.x, platform.y, platform.width, 5);
            }
        }
    }
    
    // Рисование монет
    for (let coin of coinsList) {
        if (!coin.collected && coin.x < camera.x + camera.width && coin.x + coin.width > camera.x) {
            ctx.fillStyle = coin.color;
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2 - 5, coin.y + coin.height/2 - 5, coin.width/6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Рисование врагов
    for (let enemy of enemies) {
        if (enemy.x < camera.x + camera.width && enemy.x + enemy.width > camera.x) {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            ctx.fillStyle = 'white';
            ctx.fillRect(enemy.x + 8, enemy.y + 15, 12, 12);
            ctx.fillRect(enemy.x + 38, enemy.y + 15, 12, 12);
            
            ctx.fillStyle = 'black';
            ctx.fillRect(enemy.x + 11, enemy.y + 18, 6, 6);
            ctx.fillRect(enemy.x + 41, enemy.y + 18, 6, 6);
        }
    }
    
    // Рисование флага
    if (flag.x < camera.x + camera.width && flag.x + flag.width > camera.x) {
        ctx.fillStyle = flag.color;
        ctx.fillRect(flag.x, flag.y, 8, flag.height);
        ctx.beginPath();
        ctx.moveTo(flag.x, flag.y);
        ctx.lineTo(flag.x, flag.y - 30);
        ctx.lineTo(flag.x + 35, flag.y - 15);
        ctx.closePath();
        ctx.fill();
    }
    
    // Рисование кота из SVG частей
    drawCat();
    
    // Восстанавливаем состояние контекста
    ctx.restore();
    
    // Если игра на паузе
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
    }
}

// Обработка ввода с клавиатуры
function handleKeyboardInput() {
    // Определяем направление
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velX = -player.speed;
        player.direction = -1;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velX = player.speed;
        player.direction = 1;
    }
    
    // Прыжок
    if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && player.grounded) {
        player.velY = -18;
        player.jumping = true;
        player.grounded = false;
    }
    
    // Атака (X или F)
    if ((keys['KeyX'] || keys['KeyF']) && !isAttacking && attackCooldown <= 0) {
        isAttacking = true;
        attackCooldown = 25;
    }
}

// Обновление игровой логики
function update() {
    // Обработка паузы - работает всегда, независимо от состояния игры
    const pausePressed = keys['Escape'] || keys['KeyP'];
    
    if (pausePressed && !pauseKeyPressed) {
        // Переключаем состояние паузы
        if (gameState === 'playing') {
            gameState = 'paused';
            console.log('Игра на паузе');
        } else if (gameState === 'paused') {
            gameState = 'playing';
            console.log('Игра продолжена');
        }
        pauseKeyPressed = true;
    }
    
    // Сбрасываем флаг паузы, когда клавиши отпущены
    if (!pausePressed) {
        pauseKeyPressed = false;
    }
    
    // Если игра не в состоянии playing, не обновляем игровую логику
    if (gameState !== 'playing') return;
    
    // Обновление времени анимации
    animationTime += 0.1;
    
    // Обновление атаки
    if (isAttacking) {
        attackCooldown--;
        if (attackCooldown <= 0) {
            isAttacking = false;
        }
    }
    
    // Обновление камеры
    updateCamera();
    
    // Применение гравитации
    player.velY += gravity;
    
    // Применение трения при движении по земле
    if (player.grounded) {
        player.velX *= friction;
    }
    
    // Обработка ввода с клавиатуры
    handleKeyboardInput();
    
    // Обработка ввода с геймпада
    if (isGamepadConnected && gamepad) {
        const leftStickX = gamepad.axes[0];
        if (Math.abs(leftStickX) > 0.1) {
            player.velX = leftStickX * player.speed;
            player.direction = leftStickX > 0 ? 1 : -1;
        }
        
        if (gamepad.buttons[0].pressed && player.grounded) {
            player.velY = -18;
            player.jumping = true;
            player.grounded = false;
        }
        
        // Атака с геймпада (кнопка X)
        if (gamepad.buttons[2].pressed && !isAttacking && attackCooldown <= 0) {
            isAttacking = true;
            attackCooldown = 25;
        }
        
        // Пауза с геймпада (кнопка Start)
        if (gamepad.buttons[9].pressed && !pauseKeyPressed) {
            if (gameState === 'playing') {
                gameState = 'paused';
            } else if (gameState === 'paused') {
                gameState = 'playing';
            }
            pauseKeyPressed = true;
        }
        
        // Сброс флага паузы для геймпада
        if (!gamepad.buttons[9].pressed) {
            pauseKeyPressed = false;
        }
    }
    
    // Обновление позиции игрока
    player.x += player.velX;
    player.y += player.velY;
    
    // Ограничение игрока в пределах уровня
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > levelWidth) player.x = levelWidth - player.width;
    if (player.y > levelHeight) {
        player.y = 800;
        player.x = 100;
        lives--;
        livesCountElement.textContent = lives;
        
        if (lives <= 0) {
            gameState = 'gameOver';
            gameOverScreen.classList.remove('hidden');
            finalScoreElement.textContent = coins;
        }
    }
    
    // Сброс grounded статуса
    player.grounded = false;
    
    // Проверка столкновений с платформами
    for (let platform of platforms) {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height &&
            player.velY > 0) {
            
            player.y = platform.y - player.height;
            player.velY = 0;
            player.grounded = true;
            player.jumping = false;
        }
    }
    
    // Проверка сбора монет
    for (let coin of coinsList) {
        if (!coin.collected &&
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            coin.collected = true;
            coins++;
            coinCountElement.textContent = coins;
        }
    }
    
    // Обновление врагов
    for (let enemy of enemies) {
        enemy.x += enemy.speed * enemy.direction;
        
        if (enemy.x <= 0 || enemy.x + enemy.width >= levelWidth) {
            enemy.direction *= -1;
        }
        
        // Проверка столкновения с игроком
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            if (player.velY > 0 && player.y + player.height < enemy.y + enemy.height/2) {
                enemy.y = levelHeight + 100;
                player.velY = -12;
            } else {
                player.x = 100;
                player.y = 800;
                lives--;
                livesCountElement.textContent = lives;
                
                if (lives <= 0) {
                    gameState = 'gameOver';
                    gameOverScreen.classList.remove('hidden');
                    finalScoreElement.textContent = coins;
                }
            }
        }
    }
    
    // Проверка достижения флага
    if (player.x < flag.x + flag.width &&
        player.x + player.width > flag.x &&
        player.y < flag.y + flag.height &&
        player.y + player.height > flag.y) {
        
        gameState = 'levelComplete';
        levelCompleteScreen.classList.remove('hidden');
        levelCoinsElement.textContent = coins;
    }
}

// Игровой цикл
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Обработчики событий клавиатуры
function keyDownHandler(e) {
    keys[e.code] = true;
}

function keyUpHandler(e) {
    keys[e.code] = false;
}

// Обработка подключения геймпада
function handleGamepad() {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
            gamepad = gamepads[i];
            isGamepadConnected = true;
            gamepadStatusElement.textContent = `Геймпад подключен!`;
            gamepadStatusElement.className = 'gamepad-status connected';
            return;
        }
    }
    
    isGamepadConnected = false;
    gamepad = null;
    gamepadStatusElement.textContent = 'Геймпад не подключен!';
    gamepadStatusElement.className = 'gamepad-status disconnected';
}

// Начало игры
startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameState = 'playing';
    init();
});

// Перезапуск игры
restartButton.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    lives = 3;
    coins = 0;
    level = 1;
    gameState = 'playing';
    init();
});

// Следующий уровень
nextLevelButton.addEventListener('click', () => {
    levelCompleteScreen.classList.add('hidden');
    level++;
    levelCountElement.textContent = level;
    gameState = 'playing';
    init();
    
    player.speed += 1;
    if (level > 1) {
        enemies.push({
            x: 600, 
            y: levelHeight - 70, 
            width: 60, 
            height: 60, 
            speed: 3.5, 
            direction: 1, 
            color: '#8E44AD'
        });
    }
});

// Слушатели событий клавиатуры
window.addEventListener('keydown', keyDownHandler);
window.addEventListener('keyup', keyUpHandler);

// Слушатели событий геймпада
window.addEventListener("gamepadconnected", (e) => {
    gamepad = e.gamepad;
    isGamepadConnected = true;
    gamepadStatusElement.textContent = `Геймпад подключен: ${gamepad.id}`;
    gamepadStatusElement.className = 'gamepad-status connected';
});

window.addEventListener("gamepaddisconnected", (e) => {
    if (gamepad && gamepad.index === e.gamepad.index) {
        isGamepadConnected = false;
        gamepad = null;
        gamepadStatusElement.textContent = 'Геймпад отключен';
        gamepadStatusElement.className = 'gamepad-status disconnected';
    }
});

// Обработка изменения размера окна
window.addEventListener('resize', resizeCanvas);

// Постоянная проверка геймпада
setInterval(handleGamepad, 100);

// Запуск игры после загрузки SVG
loadAllSVGs().then(() => {
    console.log('Игра запускается...');
    gameLoop();
    init();
}).catch(error => {
    console.log('Запуск с заглушками из-за ошибки загрузки SVG');
    gameLoop();
    init();
});