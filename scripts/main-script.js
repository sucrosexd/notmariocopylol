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

// Цели уровня
let coinsToWin = 20; // Количество монет для завершения уровня
let coinsCollectedInLevel = 0;

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

// Шаблоны платформ
const platformTemplates = [
    // Маленькие платформы
    [
        {width: 80, height: 25, color: '#D35400'},
        {width: 100, height: 25, color: '#D35400'},
        {width: 120, height: 25, color: '#D35400'}
    ],
    // Средние платформы
    [
        {width: 150, height: 25, color: '#E67E22'},
        {width: 180, height: 25, color: '#E67E22'},
        {width: 200, height: 25, color: '#E67E22'}
    ],
    // Большие платформы
    [
        {width: 250, height: 25, color: '#F39C12'},
        {width: 300, height: 25, color: '#F39C12'},
        {width: 350, height: 25, color: '#F39C12'}
    ],
    // Очень большие платформы
    [
        {width: 400, height: 25, color: '#F1C40F'},
        {width: 500, height: 25, color: '#F1C40F'},
        {width: 600, height: 25, color: '#F1C40F'}
    ]
];

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

// Создание случайной платформы
function createRandomPlatform(x, y) {
    const templateType = Math.floor(Math.random() * platformTemplates.length);
    const templates = platformTemplates[templateType];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Случайный наклон и высота
    const heightVariation = Math.random() * 40 - 20;
    
    return {
        x: x,
        y: y + heightVariation,
        width: template.width,
        height: template.height,
        color: template.color,
        hasCoins: Math.random() > 0.2 // 80% платформ будут с монетами
    };
}

// Создание монет на платформе
function createCoinsOnPlatform(platform) {
    const coins = [];
    const coinCount = Math.floor(Math.random() * 3) + 1; // 1-3 монеты
    
    // Распределяем монеты равномерно по платформе
    const spacing = platform.width / (coinCount + 1);
    
    for (let i = 0; i < coinCount; i++) {
        const offsetX = spacing * (i + 1);
        
        // Определяем тип монеты: обычная (на платформе) или высокая (требует прыжка)
        const isHighCoin = Math.random() > 0.7; // 30% шанс высокой монеты
        let heightOffset;
        
        if (isHighCoin) {
            // Высокая монета - требует прыжка
            heightOffset = -80 - Math.random() * 40; // -80 до -120 пикселей
        } else {
            // Обычная монета - в небольшом радиусе от платформы
            heightOffset = Math.random() * 30 - 15; // -15 до +15 пикселей
        }
        
        coins.push({
            x: platform.x + offsetX - 15,
            y: platform.y - 50 + heightOffset,
            width: 30,
            height: 30,
            color: isHighCoin ? '#ff9900' : '#ffcc00', // Разный цвет для высоких монет
            collected: false,
            platformId: platforms.length,
            originalY: platform.y - 50 + heightOffset,
            bounceOffset: 0,
            bounceSpeed: 0.08 + Math.random() * 0.04, // Уменьшена скорость анимации
            bouncePhase: Math.random() * Math.PI * 2,
            isHighCoin: isHighCoin // Флаг высокой монеты
        });
    }
    
    return coins;
}

// Создание пути через уровень
function createLevelPath() {
    const pathPlatforms = [];
    const pathCoins = [];
    
    let currentX = 200;
    let currentY = 950; // Увеличена начальная высота (платформы ниже)
    let totalCoins = 0;
    
    // Максимальная высота прыжка игрока (приблизительно)
    const maxJumpHeight = 300;
    
    // Создаем основной путь
    while (currentX < levelWidth - 600) {
        // Случайный выбор типа платформы
        const platformType = Math.floor(Math.random() * platformTemplates.length);
        const templates = platformTemplates[platformType];
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Ограничиваем изменение высоты для доступности (платформы ниже)
        const heightChange = Math.random() * 150 - 75; // -75 до +75 (уменьшено)
        const gapSize = Math.random() * 120 + 80; // 80-200 (уменьшено)
        
        // Ограничиваем высоту, платформы теперь ниже для удобства
        currentY = Math.max(700, Math.min(1100, currentY + heightChange)); // Диапазон 700-1100 вместо 500-1000
        
        const platform = {
            x: currentX,
            y: currentY,
            width: template.width,
            height: template.height,
            color: template.color,
            hasCoins: Math.random() > 0.2
        };
        
        pathPlatforms.push(platform);
        
        // Создаем монеты для платформы
        if (platform.hasCoins) {
            const platformCoins = createCoinsOnPlatform(platform);
            pathCoins.push(...platformCoins);
            totalCoins += platformCoins.length;
        }
        
        // Переходим к следующей платформе
        currentX += platform.width + gapSize;
        
        // 30% шанс создать дополнительную платформу выше/ниже (только если доступно)
        if (Math.random() > 0.7 && currentX < levelWidth - 800) {
            const verticalDirection = Math.random() > 0.5 ? 1 : -1;
            // Ограничиваем высоту вертикальной платформы для доступности
            const verticalHeightChange = verticalDirection * (120 + Math.random() * 30); // 120-150 вместо 150-200
            
            // Проверяем, доступна ли платформа для прыжка
            if (currentY + verticalHeightChange >= 600 && currentY + verticalHeightChange <= 1100) {
                const verticalPlatform = createRandomPlatform(
                    currentX - 100,
                    currentY + verticalHeightChange
                );
                verticalPlatform.hasCoins = Math.random() > 0.3;
                
                pathPlatforms.push(verticalPlatform);
                
                if (verticalPlatform.hasCoins) {
                    const verticalCoins = createCoinsOnPlatform(verticalPlatform);
                    pathCoins.push(...verticalCoins);
                    totalCoins += verticalCoins.length;
                }
            }
        }
        
        // 20% шанс создать платформу-островок (только если доступно)
        if (Math.random() > 0.8 && currentX < levelWidth - 800) {
            // Ограничиваем высоту островка для доступности
            const islandHeight = -150 - Math.random() * 50; // -150 до -200 вместо -200 до -250
            
            if (currentY + islandHeight >= 500) { // Проверяем, не слишком ли высоко
                const islandPlatform = createRandomPlatform(
                    currentX + 150,
                    currentY + islandHeight
                );
                islandPlatform.hasCoins = true; // Островки всегда с монетами
                
                pathPlatforms.push(islandPlatform);
                const islandCoins = createCoinsOnPlatform(islandPlatform);
                pathCoins.push(...islandCoins);
                totalCoins += islandCoins.length;
            }
        }
    }
    
    return { platforms: pathPlatforms, coins: pathCoins, totalCoins: totalCoins };
}

// Создание дополнительных платформ для увеличения количества монет
function createAdditionalPlatforms(mainPlatforms, mainCoins, targetCoins) {
    const additionalPlatforms = [];
    const additionalCoins = [];
    let currentCoins = mainCoins.length;
    
    // Пока не достигнем целевого количества монет
    while (currentCoins < targetCoins) {
        const x = Math.random() * (levelWidth - 400) + 200;
        const y = Math.random() * 300 + 700; // Ограничиваем высоту для доступности (700-1000)
        
        // Проверяем, чтобы платформа не пересекалась с существующими
        let overlaps = false;
        for (let platform of [...mainPlatforms, ...additionalPlatforms]) {
            if (Math.abs(x - platform.x) < 200 && Math.abs(y - platform.y) < 100) {
                overlaps = true;
                break;
            }
        }
        
        if (!overlaps) {
            const platform = createRandomPlatform(x, y);
            platform.hasCoins = true; // Дополнительные платформы всегда с монетами
            
            additionalPlatforms.push(platform);
            const platformCoins = createCoinsOnPlatform(platform);
            additionalCoins.push(...platformCoins);
            currentCoins += platformCoins.length;
        }
    }
    
    return {
        platforms: additionalPlatforms,
        coins: additionalCoins
    };
}

// Найти платформу для врага
function findPlatformForEnemy(minWidth = 150) {
    const suitablePlatforms = platforms.filter(p => 
        p.width >= minWidth && 
        p.y < levelHeight - 100 && // Не на самой земле
        p.x > 300 && p.x < levelWidth - 500 // Не слишком близко к краям
    );
    
    if (suitablePlatforms.length === 0) return null;
    
    const platform = suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)];
    return {
        platform: platform,
        x: platform.x + 20,
        y: platform.y - 60
    };
}

// Создание врагов
function createEnemies() {
    const enemies = [];
    
    // Базовое количество врагов увеличено
    const groundEnemyCount = 4 + Math.floor(level * 1.2);
    const flyingEnemyCount = 2 + Math.floor(level * 0.8);
    const platformEnemyCount = 3 + Math.floor(level * 0.6); // Враги на платформах
    
    // Наземные враги
    for (let i = 0; i < groundEnemyCount; i++) {
        const enemyX = 300 + (i * 300);
        const patrolRange = 150 + Math.random() * 150;
        
        enemies.push({
            x: enemyX,
            y: levelHeight - 70,
            width: 60,
            height: 60,
            speed: 2.5 + level * 0.4,
            direction: i % 2 === 0 ? 1 : -1,
            patrolRange: patrolRange,
            startX: enemyX,
            color: '#8E44AD',
            type: 'ground'
        });
    }
    
    // Враги на платформах
    for (let i = 0; i < platformEnemyCount; i++) {
        const platformEnemy = findPlatformForEnemy(180);
        if (platformEnemy) {
            const platform = platformEnemy.platform;
            
            enemies.push({
                x: platformEnemy.x,
                y: platformEnemy.y,
                width: 50,
                height: 50,
                speed: 1.8 + level * 0.3,
                direction: Math.random() > 0.5 ? 1 : -1,
                patrolRange: platform.width - 40, // Патрулируют по всей платформе
                startX: platform.x + platform.width / 2,
                color: '#E74C3C',
                type: 'platform',
                platformId: platforms.indexOf(platform),
                grounded: true,
                jumpCooldown: 0
            });
        }
    }
    
    // Летающие враги
    for (let i = 0; i < flyingEnemyCount; i++) {
        const flyX = 400 + (i * 400);
        const flyY = 500 + Math.random() * 400;
        
        enemies.push({
            x: flyX,
            y: flyY,
            width: 50,
            height: 50,
            speed: 2 + level * 0.3,
            direction: 1,
            patrolRange: 250,
            startX: flyX,
            isFlying: true,
            color: '#9B59B6',
            type: 'flying',
            verticalSpeed: 0.5 + Math.random() * 0.5,
            verticalRange: 80 + Math.random() * 70
        });
    }
    
    // Быстрые враги на высоких уровнях
    if (level >= 3) {
        const fastEnemyCount = Math.floor(level / 2);
        for (let i = 0; i < fastEnemyCount; i++) {
            const fastX = 600 + (i * 500);
            
            enemies.push({
                x: fastX,
                y: levelHeight - 70,
                width: 45,
                height: 45,
                speed: 4 + level * 0.5,
                direction: 1,
                patrolRange: 200,
                startX: fastX,
                color: '#C0392B',
                type: 'fast'
            });
        }
    }
    
    // Прыгающие враги на платформах (с 2 уровня)
    if (level >= 2) {
        const jumpingEnemyCount = 1 + Math.floor(level / 2);
        for (let i = 0; i < jumpingEnemyCount; i++) {
            const platformEnemy = findPlatformForEnemy(200);
            if (platformEnemy) {
                const platform = platformEnemy.platform;
                
                enemies.push({
                    x: platformEnemy.x,
                    y: platformEnemy.y,
                    width: 45,
                    height: 45,
                    speed: 2 + level * 0.2,
                    direction: 1,
                    patrolRange: platform.width - 60,
                    startX: platform.x + platform.width / 2,
                    color: '#D35400',
                    type: 'jumping',
                    platformId: platforms.indexOf(platform),
                    grounded: true,
                    jumpCooldown: 0,
                    velY: 0
                });
            }
        }
    }
    
    return enemies;
}

// Инициализация игры
function init() {
    console.log('Инициализация игры...');
    
    // Установка размера canvas
    resizeCanvas();
    
    // Сброс счетчиков уровня
    coinsCollectedInLevel = 0;
    coinsToWin = 15 + level * 3;
    
    // Создание уровня
    platforms = [];
    coinsList = [];
    
    // Основная земля
    platforms.push({
        x: 0, 
        y: levelHeight - 30, 
        width: levelWidth, 
        height: 30, 
        color: '#000000ff', 
        hasCoins: false
    });
    
    // Создание основного пути
    const mainPath = createLevelPath();
    platforms.push(...mainPath.platforms);
    coinsList.push(...mainPath.coins);
    
    console.log(`Основной путь: ${mainPath.totalCoins} монет`);
    
    // Если монет недостаточно, добавляем дополнительные платформы
    if (mainPath.totalCoins < coinsToWin) {
        const neededCoins = coinsToWin - mainPath.totalCoins + 10;
        const additional = createAdditionalPlatforms(mainPath.platforms, mainPath.coins, neededCoins);
        platforms.push(...additional.platforms);
        coinsList.push(...additional.coins);
        
        console.log(`Добавлено ${additional.coins.length} дополнительных монет`);
    }
    
    // Гарантируем, что монет достаточно для завершения уровня
    while (coinsList.length < coinsToWin) {
        console.log(`Недостаточно монет! Нужно: ${coinsToWin}, есть: ${coinsList.length}. Добавляем...`);
        
        const x = Math.random() * (levelWidth - 400) + 200;
        const y = Math.random() * 300 + 700;
        
        const platform = createRandomPlatform(x, y);
        platform.hasCoins = true;
        
        platforms.push(platform);
        const platformCoins = createCoinsOnPlatform(platform);
        coinsList.push(...platformCoins);
    }
    
    console.log(`Всего монет на уровне: ${coinsList.length}, нужно: ${coinsToWin}`);
    
    // Создание врагов
    enemies = createEnemies();
    
    const platformEnemies = enemies.filter(e => e.type === 'platform' || e.type === 'jumping').length;
    console.log(`Создано врагов: ${enemies.length} (${enemies.filter(e => e.isFlying).length} летающих, ${platformEnemies} на платформах)`);
    
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
    
    // Обновляем отображение цели уровня
    updateLevelGoalDisplay();
    
    // Сброс анимационных переменных
    isAttacking = false;
    attackCooldown = 0;
    isFacingRight = true;
    animationTime = 0;
    pauseKeyPressed = false;
}

// Обновление отображения цели уровня
function updateLevelGoalDisplay() {
    const levelGoalElement = document.getElementById('levelGoal');
    if (levelGoalElement) {
        levelGoalElement.textContent = `Цель: ${coinsCollectedInLevel}/${coinsToWin} монет`;
        
        // Меняем цвет в зависимости от прогресса
        if (coinsCollectedInLevel >= coinsToWin) {
            levelGoalElement.style.color = '#2ecc71';
        } else if (coinsCollectedInLevel >= coinsToWin * 0.7) {
            levelGoalElement.style.color = '#f39c12';
        } else {
            levelGoalElement.style.color = '#e74c3c';
        }
    }
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

// Обновление анимации монет
function updateCoinAnimations() {
    for (let coin of coinsList) {
        if (!coin.collected) {
            // Обновляем анимацию подпрыгивания с уменьшенной амплитудой
            coin.bouncePhase += coin.bounceSpeed;
            coin.bounceOffset = Math.sin(coin.bouncePhase) * 5; // Уменьшена амплитуда до 5 пикселей
        }
    }
}

// Обновление врагов на платформах
function updatePlatformEnemies() {
    for (let enemy of enemies) {
        if (enemy.type === 'platform' || enemy.type === 'jumping') {
            const platform = platforms[enemy.platformId];
            
            if (!platform) continue;
            
            // Горизонтальное движение
            enemy.x += enemy.speed * enemy.direction;
            
            // Проверка границ платформы
            if (enemy.x <= platform.x + 10 || enemy.x + enemy.width >= platform.x + platform.width - 10) {
                enemy.direction *= -1;
            }
            
            // Для прыгающих врагов
            if (enemy.type === 'jumping') {
                enemy.jumpCooldown--;
                
                // Периодически прыгают
                if (enemy.jumpCooldown <= 0 && Math.random() > 0.95) {
                    enemy.velY = -12;
                    enemy.grounded = false;
                    enemy.jumpCooldown = 60 + Math.random() * 60;
                }
                
                // Применение гравитации
                if (!enemy.grounded) {
                    enemy.velY += gravity * 0.8;
                    enemy.y += enemy.velY;
                    
                    // Проверка приземления на платформу
                    if (enemy.y + enemy.height > platform.y && enemy.velY > 0) {
                        enemy.y = platform.y - enemy.height;
                        enemy.velY = 0;
                        enemy.grounded = true;
                    }
                }
            } else {
                // Обычные враги на платформах всегда на платформе
                enemy.y = platform.y - enemy.height;
            }
        }
    }
}

// Обновление врагов
function updateEnemies() {
    // Обновляем врагов на платформах
    updatePlatformEnemies();
    
    for (let enemy of enemies) {
        // Пропускаем врагов на платформах, так как они уже обработаны
        if (enemy.type === 'platform' || enemy.type === 'jumping') continue;
        
        // Горизонтальное движение для остальных врагов
        enemy.x += enemy.speed * enemy.direction;
        
        if (enemy.x <= enemy.startX - enemy.patrolRange || 
            enemy.x >= enemy.startX + enemy.patrolRange) {
            enemy.direction *= -1;
        }
        
        // Вертикальное движение для летающих врагов
        if (enemy.isFlying) {
            if (enemy.verticalSpeed) {
                enemy.y += Math.sin(animationTime * enemy.verticalSpeed) * 2;
            }
        }
        
        // Особое поведение для быстрых врагов
        if (enemy.type === 'fast') {
            // Быстрые враги иногда ускоряются
            if (Math.random() > 0.98) {
                enemy.speed = 6 + level * 0.5;
                setTimeout(() => {
                    enemy.speed = 4 + level * 0.5;
                }, 1000);
            }
        }
    }
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
            
            // Текстура для платформ не на земле
            if (platform.y < levelHeight - 30) {
                ctx.fillStyle = '#A04000';
                ctx.fillRect(platform.x, platform.y, platform.width, 5);
                
                // Дополнительная детализация
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                for (let i = 0; i < platform.width; i += 20) {
                    ctx.fillRect(platform.x + i, platform.y + 5, 10, 3);
                }
            }
        }
    }
    
    // Рисование монет
    for (let coin of coinsList) {
        if (!coin.collected && coin.x < camera.x + camera.width && coin.x + coin.width > camera.x) {
            // Используем анимацию подпрыгивания с уменьшенной амплитудой
            const currentY = coin.originalY + coin.bounceOffset;
            
            ctx.save();
            ctx.translate(coin.x + coin.width/2, currentY + coin.height/2);
            
            // Разный цвет для высоких монет
            ctx.fillStyle = coin.color;
            ctx.beginPath();
            ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Блики на монете
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(-4, -4, coin.width/6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(2, 2, coin.width/8, 0, Math.PI * 2);
            ctx.fill();
            
            // Индикатор для высоких монет
            if (coin.isHighCoin) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(0, -20, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    // Рисование врагов
    for (let enemy of enemies) {
        if (enemy.x < camera.x + camera.width && enemy.x + enemy.width > camera.x) {
            // Разные цвета для разных типов врагов
            ctx.fillStyle = enemy.color;
            
            // Для летающих врагов рисуем крылья
            if (enemy.isFlying) {
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Крылья с анимацией
                ctx.fillStyle = '#8E44AD';
                const wingY = enemy.y - 8 + Math.sin(animationTime * 8) * 4;
                ctx.fillRect(enemy.x - 12, wingY, 12, 6);
                ctx.fillRect(enemy.x + enemy.width, wingY, 12, 6);
            } 
            // Для врагов на платформах
            else if (enemy.type === 'platform' || enemy.type === 'jumping') {
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Специальные индикаторы для прыгающих врагов
                if (enemy.type === 'jumping') {
                    // Индикатор готовности к прыжку
                    if (enemy.jumpCooldown < 30) {
                        ctx.fillStyle = 'yellow';
                        ctx.fillRect(enemy.x + enemy.width/2 - 2, enemy.y - 8, 4, 4);
                    }
                }
            }
            // Для наземных врагов
            else {
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
            
            // Глаза для всех врагов
            ctx.fillStyle = 'white';
            ctx.fillRect(enemy.x + 8, enemy.y + 15, 12, 12);
            ctx.fillRect(enemy.x + enemy.width - 20, enemy.y + 15, 12, 12);
            
            ctx.fillStyle = enemy.type === 'fast' ? 'red' : 'black';
            ctx.fillRect(enemy.x + 11, enemy.y + 18, 6, 6);
            ctx.fillRect(enemy.x + enemy.width - 17, enemy.y + 18, 6, 6);
            
            // Индикатор для быстрых врагов
            if (enemy.type === 'fast' && enemy.speed > 5) {
                ctx.fillStyle = 'red';
                ctx.fillRect(enemy.x + enemy.width/2 - 2, enemy.y - 5, 4, 4);
            }
        }
    }
    
    // Рисование флага (только если собрано достаточно монет)
    if (coinsCollectedInLevel >= coinsToWin) {
        if (flag.x < camera.x + camera.width && flag.x + flag.width > camera.x) {
            ctx.fillStyle = flag.color;
            ctx.fillRect(flag.x, flag.y, 8, flag.height);
            
            // Анимация флага
            const wave = Math.sin(animationTime * 3) * 5;
            ctx.beginPath();
            ctx.moveTo(flag.x, flag.y);
            ctx.lineTo(flag.x, flag.y - 30);
            ctx.lineTo(flag.x + 35 + wave, flag.y - 15);
            ctx.closePath();
            ctx.fill();
            
            // Частицы вокруг флага
            ctx.fillStyle = '#ff6b6b';
            for (let i = 0; i < 5; i++) {
                const angle = animationTime * 2 + i * 1.2;
                const radius = 20 + Math.sin(animationTime * 4 + i) * 5;
                const px = flag.x + 20 + Math.cos(angle) * radius;
                const py = flag.y - 15 + Math.sin(angle) * radius;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    } else {
        // Рисование заблокированного флага
        if (flag.x < camera.x + camera.width && flag.x + flag.width > camera.x) {
            ctx.fillStyle = '#666666';
            ctx.fillRect(flag.x, flag.y, 8, flag.height);
            ctx.beginPath();
            ctx.moveTo(flag.x, flag.y);
            ctx.lineTo(flag.x, flag.y - 30);
            ctx.lineTo(flag.x + 35, flag.y - 15);
            ctx.closePath();
            ctx.fill();
            
            // Замок
            ctx.fillStyle = '#333333';
            ctx.fillRect(flag.x + 10, flag.y - 20, 15, 10);
            ctx.beginPath();
            ctx.arc(flag.x + 17, flag.y - 10, 8, 0, Math.PI);
            ctx.fill();
        }
    }
    
    // Рисование кота из SVG частей
    drawCat();
    
    // Восстанавливаем состояние контекста
    ctx.restore();
    
    // Отрисовка HUD с информацией о цели уровня
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 300, 90);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Монеты: ${coins}`, 20, 35);
    ctx.fillText(`Жизни: ${lives}`, 20, 55);
    ctx.fillText(`Уровень: ${level}`, 20, 75);
    
    const goalText = `Цель: ${coinsCollectedInLevel}/${coinsToWin} монет`;
    const goalWidth = ctx.measureText(goalText).width;
    ctx.fillText(goalText, 320 - goalWidth, 35);
    
    // Прогресс-бар сбора монет
    const progressWidth = 280;
    const progress = Math.min(1, coinsCollectedInLevel / coinsToWin);
    
    ctx.fillStyle = '#34495e';
    ctx.fillRect(20, 85, progressWidth, 10);
    
    if (progress > 0) {
        const gradient = ctx.createLinearGradient(20, 85, 20 + progressWidth, 85);
        gradient.addColorStop(0, '#e74c3c');
        gradient.addColorStop(0.5, '#f39c12');
        gradient.addColorStop(1, '#2ecc71');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(20, 85, progressWidth * progress, 10);
    }
    
    // Если игра на паузе
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Собрано монет: ${coinsCollectedInLevel}/${coinsToWin}`, canvas.width / 2, canvas.height / 2 + 50);
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
    let pausePressed = keys['Escape'] || keys['KeyP'];
    
    // Проверяем паузу на геймпаде
    if (isGamepadConnected && gamepad && gamepad.buttons[9].pressed) {
        pausePressed = true;
    }
    
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
    
    // Сбрасываем флаг паузы, когда все клавиши/кнопки отпущены
    const keyboardPauseReleased = !keys['Escape'] && !keys['KeyP'];
    const gamepadPauseReleased = !isGamepadConnected || !gamepad || !gamepad.buttons[9].pressed;
    
    if (keyboardPauseReleased && gamepadPauseReleased) {
        pauseKeyPressed = false;
    }
    
    // Если игра не в состоянии playing, не обновляем игровую логику
    if (gameState !== 'playing') return;
    
    // Обновление времени анимации
    animationTime += 0.1;
    
    // Обновление анимации монет
    updateCoinAnimations();
    
    // Обновление врагов
    updateEnemies();
    
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
            player.y < coin.originalY + coin.bounceOffset + coin.height &&
            player.y + player.height > coin.originalY + coin.bounceOffset) {
            
            coin.collected = true;
            coins++;
            coinsCollectedInLevel++;
            coinCountElement.textContent = coins;
            updateLevelGoalDisplay();
        }
    }
    
    // Проверка столкновения с врагами
    for (let enemy of enemies) {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            if (player.velY > 0 && player.y + player.height < enemy.y + enemy.height/2) {
                // Игрок прыгает на врага
                enemy.y = levelHeight + 100; // Убираем врага
                player.velY = -12;
            } else {
                // Игрок получает урон
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
    
    // Проверка достижения флага (только если собрано достаточно монет)
    if (coinsCollectedInLevel >= coinsToWin &&
        player.x < flag.x + flag.width &&
        player.x + player.width > flag.x &&
        player.y < flag.y + flag.height &&
        player.y + player.height > flag.y) {
        
        gameState = 'levelComplete';
        levelCompleteScreen.classList.remove('hidden');
        levelCoinsElement.textContent = coinsCollectedInLevel;
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
    
    // Увеличиваем сложность
    player.speed += 0.3;
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