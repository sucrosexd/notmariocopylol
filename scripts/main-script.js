 
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
        
        // Размер уровня (увеличил высоту для более естественных пропорций)
        let levelWidth = 4800;
        let levelHeight = 1200;
        
        // Камера для прокрутки уровня
        let camera = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Загрузка фона
        let backgroundImage = new Image();
        backgroundImage.src = './assets/images/fon.svg';
        
        // Игровые объекты (увеличил размеры для нового масштаба)
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
            color: '#E74C3C'
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
            width: 55,
            height: 1000,
            color: '#FF6B6B'
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
            // Установка размера canvas
            resizeCanvas();
            
            // Создание платформ для уровня 1 (обновил позиции для новой высоты уровня)
            platforms = [
                {x: 0, y: levelHeight - 30, width: levelWidth, height: 30, color: '#000000ff'}, // земля
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
            
            // Создание монет (больше монет на увеличенном уровне)
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
            
            // Создание врагов (увеличил размер и обновил позиции)
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
            
            camera.x = 0;
            camera.y = 0;
            
            coins = 0;
            coinCountElement.textContent = coins;
            livesCountElement.textContent = lives;
            levelCountElement.textContent = level;
        }
        
        // Обновление камеры для следования за игроком
        function updateCamera() {
            // Камера следует за игроком по горизонтали
            camera.x = player.x - camera.width / 2;
            
            // Ограничение камеры в пределах уровня
            if (camera.x < 0) camera.x = 0;
            if (camera.x + camera.width > levelWidth) camera.x = levelWidth - camera.width;
            
         
        }
        
        // Отрисовка игры с учетом камеры
        function draw() {
            // Очистка canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Сохраняем текущее состояние контекста
            ctx.save();
            
            // Смещаем контекст на позицию камеры
            ctx.translate(-camera.x, -camera.y);
            
            // Рисование фона (повторяющегося)
            if (backgroundImage.complete) {
                // Рисуем фон, повторяя изображение по всему уровню
                const pattern = ctx.createPattern(backgroundImage, 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, levelWidth, levelHeight);
            } else {
                // Если фон еще не загрузился, используем градиент
                const gradient = ctx.createLinearGradient(0, 0, 0, levelHeight);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#1E90FF');
                gradient.addColorStop(1, '#0066CC');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, levelWidth, levelHeight);
            }
            
            // Рисование платформ
            for (let platform of platforms) {
                // Рисуем только те платформы, которые видны в камере
                if (platform.x < camera.x + camera.width && platform.x + platform.width > camera.x) {
                    ctx.fillStyle = platform.color;
                    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    
                    // Текстура для платформ (кроме земли)
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
                    
                    // Блеск монеты
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
                    
                    // Глаза врага
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
            
            // Рисование игрока (всегда виден, так как камера следует за ним)
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Лицо игрока
            ctx.fillStyle = 'white';
            ctx.fillRect(player.x + 35, player.y + 20, 15, 15);
            ctx.fillRect(player.x + 10, player.y + 20, 15, 15);
            
            ctx.fillStyle = 'black';
            ctx.fillRect(player.x + 40, player.y + 25, 7, 7);
            ctx.fillRect(player.x + 15, player.y + 25, 7, 7);
            
            // Улыбка
            ctx.beginPath();
            ctx.arc(player.x + 30, player.y + 45, 12, 0, Math.PI);
            ctx.stroke();
            
            // Колпак
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(player.x + player.width, player.y);
            ctx.lineTo(player.x + player.width/2, player.y - 30);
            ctx.closePath();
            ctx.fill();
            
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
        
        // Обновление игровой логики
        function update() {
            if (gameState !== 'playing') return;
            
            // Обновление камеры
            updateCamera();
            
            // Применение гравитации
            player.velY += gravity;
            
            // Применение трения при движении по земле
            if (player.grounded) {
                player.velX *= friction;
            }
            
            // Обработка ввода с геймпада
            if (isGamepadConnected && gamepad) {
                // Движение влево/вправо с левого стика
                const leftStickX = gamepad.axes[0];
                if (Math.abs(leftStickX) > 0.1) {
                    player.velX = leftStickX * player.speed;
                } else {
                    player.velX = 0;
                }
                
                // Прыжок с кнопки A
                if (gamepad.buttons[0].pressed && player.grounded) {
                    player.velY = -18;
                    player.jumping = true;
                    player.grounded = false;
                }
                
                // Пауза с кнопки Start
                if (gamepad.buttons[9].pressed) {
                    gameState = gameState === 'paused' ? 'playing' : 'paused';
                }
            }
            
            // Обновление позиции игрока
            player.x += player.velX;
            player.y += player.velY;
            
            // Ограничение игрока в пределах уровня
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > levelWidth) player.x = levelWidth - player.width;
            if (player.y > levelHeight) {
                // Игрок упал за пределы экрана
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
                
                // Изменение направления при столкновении с краем платформы
                if (enemy.x <= 0 || enemy.x + enemy.width >= levelWidth) {
                    enemy.direction *= -1;
                }
                
                // Проверка столкновения с игроком
                if (player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y) {
                    
                    // Если игрок прыгает на врага
                    if (player.velY > 0 && player.y + player.height < enemy.y + enemy.height/2) {
                        enemy.y = levelHeight + 100; // "Убираем" врага
                        player.velY = -12; // Отскок
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
        
        // Обработка подключения геймпада
        function handleGamepad() {
            const gamepads = navigator.getGamepads();
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] && gamepads[i].connected) {
                    gamepad = gamepads[i];
                    isGamepadConnected = true;
                    gamepadStatusElement.textContent = `Геймпад подключен! `;
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
            
            // Увеличиваем сложность для следующего уровня
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
        
        // Слушатели событий геймпада
        window.addEventListener("gamepadconnected", (e) => {
            gamepad = e.gamepad;
            isGamepadConnected = true;
            gamepadStatusElement.textContent = `Геймпад подключен: `;
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
        
        // Запуск игрового цикла
        gameLoop();
        
        // Создание начального экрана
        init();