// Основные переменные игры
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const preloadScreen = document.getElementById("preloadScreen");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const levelCompleteScreen = document.getElementById("levelCompleteScreen");
const pauseScreen = document.getElementById("pauseScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const nextLevelButton = document.getElementById("nextLevelButton");
const resumeButton = document.getElementById("resumeButton");
const restartPauseButton = document.getElementById("restartPauseButton");
const mainMenuButton = document.getElementById("mainMenuButton");
const coinCountElement = document.getElementById("coinCount");
const levelCountElement = document.getElementById("levelCount");
const finalScoreElement = document.getElementById("finalScore");
const levelCoinsElement = document.getElementById("levelCoins");
const pauseCoinsElement = document.getElementById("pauseCoins");
const pauseGoalElement = document.getElementById("pauseGoal");
const gamepadStatusElement = document.getElementById("gamepadStatus");
const errorMessageElement = document.getElementById("errorMessage");

// Элементы управления громкостью
const musicVolumeSlider = document.getElementById("musicVolume");
const sfxVolumeSlider = document.getElementById("sfxVolume");

// Игровые переменные
let gameState = "preload"; // preload, menu, playing, paused, gameOver, levelComplete
let coins = 0;
let level = 1;
let gamepad = null;
let isGamepadConnected = false;

// ПЕРЕМЕННАЯ ДЛЯ ЗАЩИТЫ ОТ ПОВТОРНЫХ НАЖАТИЙ
let isGameLoading = false;

// Настройки громкости
let musicVolume = 0.6;
let sfxVolume = 0.7;

// Цели уровня
let coinsToWin = 20; // Количество монет для завершения уровня
let coinsCollectedInLevel = 0;

// Состояние клавиш клавиатуры
let keys = {};
let pauseKeyPressed = false;
let downKeyPressed = false;

// Анимационные переменные для ниндзи
let isFacingRight = true;
let isAttacking = false;
const ATTACK_DURATION = 30; // длительность анимации атаки в кадрах
const ATTACK_COOLDOWN = 30; // кд после атаки в кадрах (0.5 секунд при 60 FPS)
let attackCooldown = 0;
let animationTime = 0;

// НОВАЯ СИСТЕМА АТАКИ - УЛУЧШЕННАЯ
let attackState = "ready"; // "ready", "attacking", "cooldown"
let attackKeyPressed = false;
let gamepadAttackPressed = false;

// Хитбокс атаки
let attackHitbox = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  active: false
};

// Система получения урона
let isInvulnerable = false;
let invulnerabilityTimer = 0;
const INVULNERABILITY_DURATION = 180; // 3 секунды при 60 FPS
let damageFlashTimer = 0;

let savedMovement = {
  left: false,
  right: false,
  gamepadX: 0,
};

let hpSystem = {
    currentHp: 150,
    maxHp: 150,
    displayHp: 150, // Текущее отображаемое значение для анимации
    hpFrames: {}, // Загруженные SVG для HP
    animationSpeed: 0.5, // Скорость анимации уменьшения HP
    isAnimating: false,
    isLevelUp: false,
    targetHp: 150,
    levelUpAnimationSpeed: 1,
    previousMaxHp: 150
};

let damageAnimationActive = false;
let damageAnimationTimer = 0;
const DAMAGE_ANIMATION_DURATION = 15;

// Система анимации персонажа
let characterFrames = {
  idle: null,
  run: [],
  jump: [],
  fall: null, // отдельная анимация падения
  attack: null, // удар в статике
  jump_attack: null, // удар в прыжке
  damaged: null
};
let currentAnimation = "idle";
let animationFrame = 0;
let animationTimer = 0;
const ANIMATION_SPEED = 100; // ms между кадрами

// DeltaTime для точной анимации
let lastFrameTime = performance.now();
let deltaTime = 0;

// Система сохранения
let gameSave = null;
let saveIndicatorVisible = false;
let saveIndicatorTimer = 0;
const SAVE_INDICATOR_DURATION = 120; // 2 секунды при 60 FPS

// Добавляем в раздел с другими переменными
let enemyFrames = {
    standard1: [],
    standard2: [],
    jumper: [],
    fast: [],
    flying: [],
    armored: []
};

let enemyAnimations = {}; // Хранит текущее состояние анимации для каждого врага

// ✅ НОВОЕ: Добавляем анимацию смерти врагов
let enemyDeathFrames = [];
let dyingEnemies = []; // Массив умирающих врагов

// Размер уровня
let levelWidth = 4800;
let levelHeight = 1200;

// Камера для прокрутки уровня
let camera = {
  x: 0,
  y: 0,
  width: window.innerWidth,
  height: window.innerHeight,
};

// Загруженные SVG изображения для кота
const svgImages = {};

// Звуковая система
let audioContext = null;
let sounds = {};
let audioInitialized = false;
let audioEnabled = false;

// Музыкальные треки
let currentMusic = null;
let currentMusicGainNode = null;

// ФУНКЦИЯ ВОССТАНОВЛЕНИЯ КНОПКИ СТАРТ
function resetStartButton() {
  const startButtonText = document.getElementById("startButtonText");
  const startButtonLoader = document.getElementById("startButtonLoader");

  if (startButtonText) startButtonText.textContent = "Начать игру";
  if (startButtonLoader) {
    startButtonLoader.classList.add("hidden");
  }
  if (startButton) {
    startButton.disabled = false;
    startButton.style.pointerEvents = "auto";
  }
  isGameLoading = false;
  console.log("Кнопка 'Начать игру' восстановлена");
}

// Сохранение игры
function saveGame() {
    try {
        gameSave = {
            coins: coins,
            level: level,
            playerSpeed: player.speed,
            maxHp: hpSystem.maxHp,          // ✅ ДОБАВЛЯЕМ
            currentHp: hpSystem.currentHp,  // ✅ ДОБАВЛЯЕМ
            timestamp: Date.now()
        };
        
        localStorage.setItem('ninjaPlatformerSave', JSON.stringify(gameSave));
        
        // Показываем индикатор сохранения
        showSaveIndicator();
        
        console.log("Игра сохранена:", gameSave);
        return true;
    } catch (error) {
        console.error("Ошибка сохранения игры:", error);
        return false;
    }
}

// Загрузка сохранения
function loadGame() {
    const saveData = localStorage.getItem('ninjaPlatformerSave');
    if (saveData) {
        try {
            gameSave = JSON.parse(saveData);
            
            // ✅ ВОССТАНАВЛИВАЕМ HP ПРИ ЗАГРУЗКЕ
            if (gameSave.maxHp) {
                hpSystem.maxHp = gameSave.maxHp;
                hpSystem.currentHp = gameSave.currentHp || gameSave.maxHp;
                hpSystem.displayHp = hpSystem.currentHp;
                
                console.log(`💾 Загружено сохранение: уровень ${gameSave.level}, HP: ${hpSystem.currentHp}/${hpSystem.maxHp}`);
            }
            
            return true;
        } catch (error) {
            console.error("Ошибка загрузки сохранения:", error);
            return false;
        }
    }
    return false;
}

// Показать индикатор сохранения
function showSaveIndicator() {
    saveIndicatorVisible = true;
    saveIndicatorTimer = SAVE_INDICATOR_DURATION;
    
    // Создаем или обновляем индикатор
    let saveIndicator = document.getElementById('saveIndicator');
    if (!saveIndicator) {
        saveIndicator = document.createElement('div');
        saveIndicator.id = 'saveIndicator';
        saveIndicator.className = 'save-indicator';
        saveIndicator.textContent = 'Игра сохранена!';
        document.querySelector('.game-container').appendChild(saveIndicator);
    }
    
    saveIndicator.classList.remove('hidden');
}

// Обновление индикатора сохранения
function updateSaveIndicator() {
    if (saveIndicatorVisible) {
        saveIndicatorTimer--;
        if (saveIndicatorTimer <= 0) {
            saveIndicatorVisible = false;
            const saveIndicator = document.getElementById('saveIndicator');
            if (saveIndicator) {
                saveIndicator.classList.add('hidden');
            }
        }
    }
}

// Проверка наличия сохранения и обновление кнопки
function updateContinueButton() {
    const continueButton = document.getElementById('continueButton');
    const startButtonText = document.getElementById('startButtonText');
    
    console.log("Обновление кнопки продолжения...");
    
    // Перезагружаем сохранение
    const hasSave = loadGame();
    
    if (hasSave && gameSave) {
        console.log("Сохранение найдено, показываем кнопку 'Продолжить'");
        if (continueButton) continueButton.classList.remove('hidden');
        if (startButtonText) startButtonText.textContent = "Новая игра";
    } else {
        console.log("Сохранение не найдено, скрываем кнопку 'Продолжить'");
        if (continueButton) continueButton.classList.add('hidden');
        if (startButtonText) startButtonText.textContent = "Начать игру";
    }
}
// Инициализация аудио контекста
function initializeAudio() {
  if (audioInitialized) return;

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // создаем тихий звук для разблокировки аудио
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    // Останавливаем сразу
    source.stop(0.001);

    audioInitialized = true;
    console.log("AudioContext инициализирован");
  } catch (error) {
    console.error("Ошибка инициализации AudioContext:", error);
  }
}

// Загрузка звуков
async function loadSound(name, url) {
  if (!audioContext) return;

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    sounds[name] = audioBuffer;
    console.log(`Звук загружен: ${name}`);
  } catch (error) {
    console.error(`Ошибка загрузки звука ${name}:`, error);
  }
}

// Воспроизведение звука
function playSound(name, volume = 1.0, rate = 1.0) {
  if (!audioContext || !sounds[name]) {
    console.warn(`Звук не найден или аудио не инициализировано: ${name}`);
    return null;
  }

  try {
    // Возобновляем контекст если приостановлен
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = sounds[name];
    source.playbackRate.value = rate;
    gainNode.gain.value = volume * sfxVolume;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start(0);
    return source;
  } catch (error) {
    console.error(`Ошибка воспроизведения звука ${name}:`, error);
    return null;
  }
}

// Загрузка всех звуков
async function loadAllSounds() {
  if (!audioContext) return;

  const soundFiles = [
    // Музыка
    {
      name: "main_menu_theme",
      url: "assets/audio/music/mainTheme/main_menu_theme.mp3",
    },
    {
      name: "forest_theme",
      url: "assets/audio/music/mainTheme/forest_theme.mp3",
    },
    {
      name: "level_complete",
      url: "assets/audio/music/levels/level_complete.mp3",
    },
    { name: "game_over", url: "assets/audio/music/events/game_over.mp3" },

    // SFX игрока
    { name: "jump", url: "assets/audio/sfx/player/jump.mp3" },
    { name: "jump_hit", url: "assets/audio/sfx/player/jump_hit.mp3" },
    { name: "land", url: "assets/audio/sfx/player/land.mp3" },
    { name: "player_damage", url: "assets/audio/sfx/player/player_damage.mp3" },
    { name: "player_death", url: "assets/audio/sfx/player/death.mp3" },

    // SFX врагов
    { name: "enemy_coin", url: "assets/audio/sfx/enemies/enemy_coin.mp3" },
    { name: "enemy_defeat", url: "assets/audio/sfx/enemies/enemy_defeat.mp3" },
    { name: "enemy_attack", url: "assets/audio/sfx/enemies/enemy_hit.mp3" }, // пока не используется

    // SFX окружения
    { name: "coin_1", url: "assets/audio/sfx/environment/coin_1.mp3" },
    { name: "coin_2", url: "assets/audio/sfx/environment/coin_2.mp3" },

    // SFX UI
    { name: "ui_click", url: "assets/audio/sfx/ui/click.wav" },
    { name: "ui_pause", url: "assets/audio/sfx/ui/pause.mp3" },
  ];

  await Promise.all(
    soundFiles.map((sound) => loadSound(sound.name, sound.url)),
  );
  console.log("Все звуки загружены");
}

// Загрузка анимаций монет
async function loadCoinAnimations() {
  console.log("Начинаем загрузку анимаций монет...");

  try {
    // ✅ ЗАГРУЖАЕМ 2 КАДРА ДЛЯ АНИМАЦИИ МОНЕТ
    const coinFrame1 = await loadImage('assets/animations/environment/coin/coin1.svg')
      .catch(err => {
        console.warn("coin1.svg - Ошибка загрузки");
        return createFallbackCoinImage();
      });
    
    const coinFrame2 = await loadImage('assets/animations/environment/coin/coin3.svg')
      .catch(err => {
        console.warn("coin3.svg - Ошибка загрузки");
        return createFallbackCoinImage();
      });

    // Сохраняем в глобальной переменной
    window.coinFrames = [coinFrame1, coinFrame2];

    console.log("Анимации монет загружены!");
    console.log(`  - Coin Frame 1: ${coinFrame1 ? "OK" : "FAIL"}`);
    console.log(`  - Coin Frame 2: ${coinFrame2 ? "OK" : "FAIL"}`);

    return true;
  } catch (error) {
    console.error("Критическая ошибка загрузки анимаций монет:", error);
    // Создаем фоллбэк анимации
    window.coinFrames = [createFallbackCoinImage(), createFallbackCoinImage()];
    return true;
  }
}

// Создание фоллбэк изображения для монеты
function createFallbackCoinImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 30;
  canvas.height = 30;
  const ctx = canvas.getContext("2d");

  // Рисуем простую монету
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.arc(15, 15, 12, 0, Math.PI * 2);
  ctx.fill();

  // Детали монеты
  ctx.fillStyle = "#FFEC8B";
  ctx.beginPath();
  ctx.arc(15, 15, 8, 0, Math.PI * 2);
  ctx.fill();

  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

// Загрузка анимаций HP
async function loadHpAnimations() {
    console.log("Начинаем загрузку анимаций HP...");

    try {
        // ✅ ЗАГРУЖАЕМ ВСЕ SVG ДЛЯ HP
        const hpFrames = {};

        // HP 3
        hpFrames.hp3 = {
            full: await loadImage('assets/images/elements/hp/hp3/hp-3-full.svg')
                .catch(err => createFallbackHpImage(3, 'full')),
            hp2: await loadImage('assets/images/elements/hp/hp3/hp-3-2.svg')
                .catch(err => createFallbackHpImage(3, 'hp2')),
            hp1: await loadImage('assets/images/elements/hp/hp3/hp-3-1.svg')
                .catch(err => createFallbackHpImage(3, 'hp1')),
            died: await loadImage('assets/images/elements/hp/hp3/hp-3-died.svg')
                .catch(err => createFallbackHpImage(3, 'died'))
        };

        // HP 4
        hpFrames.hp4 = {
            full: await loadImage('assets/images/elements/hp/hp4/hp-4-full.svg')
                .catch(err => createFallbackHpImage(4, 'full')),
            hp3: await loadImage('assets/images/elements/hp/hp4/hp-4-3.svg')
                .catch(err => createFallbackHpImage(4, 'hp3')),
            hp2: await loadImage('assets/images/elements/hp/hp4/hp-4-2.svg')
                .catch(err => createFallbackHpImage(4, 'hp2')),
            hp1: await loadImage('assets/images/elements/hp/hp4/hp-4-1.svg')
                .catch(err => createFallbackHpImage(4, 'hp1')),
            died: await loadImage('assets/images/elements/hp/hp4/hp-4-died.svg')
                .catch(err => createFallbackHpImage(4, 'died'))
        };

        // HP 5
        hpFrames.hp5 = {
            full: await loadImage('assets/images/elements/hp/hp5/hp-5-full.svg')
                .catch(err => createFallbackHpImage(5, 'full')),
            hp4: await loadImage('assets/images/elements/hp/hp5/hp-5-4.svg')
                .catch(err => createFallbackHpImage(5, 'hp4')),
            hp3: await loadImage('assets/images/elements/hp/hp5/hp-5-3.svg')
                .catch(err => createFallbackHpImage(5, 'hp3')),
            hp2: await loadImage('assets/images/elements/hp/hp5/hp-5-2.svg')
                .catch(err => createFallbackHpImage(5, 'hp2')),
            hp1: await loadImage('assets/images/elements/hp/hp5/hp-5-1.svg')
                .catch(err => createFallbackHpImage(5, 'hp1')),
            died: await loadImage('assets/images/elements/hp/hp5/hp-5-died.svg')
                .catch(err => createFallbackHpImage(5, 'died'))
        };

        // HP 6
        hpFrames.hp6 = {
            full: await loadImage('assets/images/elements/hp/hp6/hp-6-full.svg')
                .catch(err => createFallbackHpImage(6, 'full')),
            hp5: await loadImage('assets/images/elements/hp/hp6/hp-6-5.svg')
                .catch(err => createFallbackHpImage(6, 'hp5')),
            hp4: await loadImage('assets/images/elements/hp/hp6/hp-6-4.svg')
                .catch(err => createFallbackHpImage(6, 'hp4')),
            hp3: await loadImage('assets/images/elements/hp/hp6/hp-6-3.svg')
                .catch(err => createFallbackHpImage(6, 'hp3')),
            hp2: await loadImage('assets/images/elements/hp/hp6/hp-6-2.svg')
                .catch(err => createFallbackHpImage(6, 'hp2')),
            hp1: await loadImage('assets/images/elements/hp/hp6/hp-6-1.svg')
                .catch(err => createFallbackHpImage(6, 'hp1')),
            died: await loadImage('assets/images/elements/hp/hp6/hp-6-died.svg')
                .catch(err => createFallbackHpImage(6, 'died'))
        };

        hpSystem.hpFrames = hpFrames;
        console.log("Анимации HP загружены успешно!");
        return true;

    } catch (error) {
        console.error("Ошибка загрузки анимаций HP:", error);
        // Создаем фоллбэк анимации
        hpSystem.hpFrames = createFallbackHpFrames();
        return true;
    }
}

// Создание фоллбэк изображения для HP
function createFallbackHpImage(hpLevel, state) {
    const canvas = document.createElement("canvas");
    const width = 200;
    const height = 60;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Фон
    ctx.fillStyle = "#2C3E50";
    ctx.fillRect(0, 0, width, height);

    // Текст
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText(`HP ${hpLevel} - ${state}`, 10, 30);

    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
}

// ✅ ИСПРАВЛЕННАЯ ОТРИСОВКА HP С СОХРАНЕНИЕМ ПРОПОРЦИЙ
function getCurrentHpFrame() {
    const hpFrames = hpSystem.hpFrames;
    if (!hpFrames || Object.keys(hpFrames).length === 0) {
        return null;
    }

    const displayHp = hpSystem.displayHp;
    const maxHp = hpSystem.maxHp;
    
    // ✅ ОПРЕДЕЛЯЕМ ТЕКУЩИЙ УРОВЕНЬ HP
    let hpLevel;
    if (maxHp <= 3) hpLevel = 3;
    else if (maxHp <= 4) hpLevel = 4;
    else if (maxHp <= 5) hpLevel = 5;
    else hpLevel = 6;

    const levelFrames = hpFrames[`hp${hpLevel}`];
    if (!levelFrames) {
        return null;
    }

    const currentLives = Math.floor(displayHp);
    
    if (currentLives <= 0) {
        return levelFrames.died;
    }
    
    // ✅ ПРАВИЛЬНЫЕ ПОРОГИ ДЛЯ КАЖДОГО УРОВНЯ HP
    if (hpLevel === 6) {
        if (currentLives >= 6) return levelFrames.full;
        else if (currentLives >= 5) return levelFrames.hp5 || levelFrames.full;
        else if (currentLives >= 4) return levelFrames.hp4 || levelFrames.full;
        else if (currentLives >= 3) return levelFrames.hp3 || levelFrames.full;
        else if (currentLives >= 2) return levelFrames.hp2 || levelFrames.full;
        else return levelFrames.hp1 || levelFrames.full;
    }
    else if (hpLevel === 5) {
        if (currentLives >= 5) return levelFrames.full;
        else if (currentLives >= 4) return levelFrames.hp4 || levelFrames.full;
        else if (currentLives >= 3) return levelFrames.hp3 || levelFrames.full;
        else if (currentLives >= 2) return levelFrames.hp2 || levelFrames.full;
        else return levelFrames.hp1 || levelFrames.full;
    }
    else if (hpLevel === 4) {
        if (currentLives >= 4) return levelFrames.full;
        else if (currentLives >= 3) return levelFrames.hp3 || levelFrames.full;
        else if (currentLives >= 2) return levelFrames.hp2 || levelFrames.full;
        else return levelFrames.hp1 || levelFrames.full;
    }
    else {
        if (currentLives >= 3) return levelFrames.full;
        else if (currentLives >= 2) return levelFrames.hp2 || levelFrames.full;
        else return levelFrames.hp1 || levelFrames.full;
    }
}

// ✅ ДОБАВЛЯЕМ НОВУЮ ФУНКЦИЮ ДЛЯ ПРАВИЛЬНОЙ ОТРИСОВКИ HP
function drawHpBar() {
    const currentHpFrame = getCurrentHpFrame();
    if (currentHpFrame) {
        const hpX = 20; // Отступ слева
        const hpY = 20; // Отступ сверху
        
        // ✅ АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ РАЗМЕРОВ С СОХРАНЕНИЕМ ПРОПОРЦИЙ
        const maxWidth = 200; // Максимальная ширина
        const maxHeight = 60; // Максимальная высота
        
        // Получаем натуральные размеры изображения
        const naturalWidth = currentHpFrame.naturalWidth || currentHpFrame.width;
        const naturalHeight = currentHpFrame.naturalHeight || currentHpFrame.height;
        
        // Вычисляем пропорции
        const aspectRatio = naturalWidth / naturalHeight;
        
        let drawWidth, drawHeight;
        
        if (aspectRatio > (maxWidth / maxHeight)) {
            // Широкое изображение - ограничиваем по ширине
            drawWidth = maxWidth;
            drawHeight = maxWidth / aspectRatio;
        } else {
            // Высокое изображение - ограничиваем по высоте
            drawHeight = maxHeight;
            drawWidth = maxHeight * aspectRatio;
        }
        
        // Центрируем по вертикали если нужно
        const centeredY = hpY + (maxHeight - drawHeight) / 2;
        
        ctx.drawImage(currentHpFrame, hpX, centeredY, drawWidth, drawHeight);
    }
}

// Создание фоллбэк фреймов для HP
function createFallbackHpFrames() {
    return {
        hp3: {
            full: createFallbackHpImage(3, 'full'),
            hp2: createFallbackHpImage(3, 'hp2'),
            hp1: createFallbackHpImage(3, 'hp1'),
            died: createFallbackHpImage(3, 'died')
        },
        hp4: {
            full: createFallbackHpImage(4, 'full'),
            hp3: createFallbackHpImage(4, 'hp3'),
            hp2: createFallbackHpImage(4, 'hp2'),
            hp1: createFallbackHpImage(4, 'hp1'),
            died: createFallbackHpImage(4, 'died')
        },
        hp5: {
            full: createFallbackHpImage(5, 'full'),
            hp4: createFallbackHpImage(5, 'hp4'),
            hp3: createFallbackHpImage(5, 'hp3'),
            hp2: createFallbackHpImage(5, 'hp2'),
            hp1: createFallbackHpImage(5, 'hp1'),
            died: createFallbackHpImage(5, 'died')
        },
        hp6: {
            full: createFallbackHpImage(6, 'full'),
            hp5: createFallbackHpImage(6, 'hp5'),
            hp4: createFallbackHpImage(6, 'hp4'),
            hp3: createFallbackHpImage(6, 'hp3'),
            hp2: createFallbackHpImage(6, 'hp2'),
            hp1: createFallbackHpImage(6, 'hp1'),
            died: createFallbackHpImage(6, 'died')
        }
    };
}

// Загрузка анимаций персонажа
async function loadCharacterAnimations() {
  console.log("Начинаем загрузку анимаций персонажа...");

  try {
    // Загрузка idle и run анимаций
    const idlePromise = loadImage(
      "assets/animations/characters/ninja/running/ninja_static.svg",
    ).catch((err) => {
      console.warn("ninja_static - Ошибка загрузки");
      return createFallbackImage(80, 120, "#4ECDC4");
    });

    const run1Promise = loadImage(
      "assets/animations/characters/ninja/running/ninja_running_1.svg",
    ).catch((err) => {
      console.log("ninja_running_1 - Ошибка загрузки");
      return createFallbackImage(80, 120, "#FF6B6B");
    });
    const run2Promise = loadImage(
      "assets/animations/characters/ninja/running/ninja_running_2.svg",
    ).catch((err) => {
      console.log("ninja_running_2 - Ошибка загрузки");
      return createFallbackImage(80, 120, "#FF8C94");
    });
    const run3Promise = loadImage(
      "assets/animations/characters/ninja/running/ninja_running_3.svg",
    ).catch((err) => {
      console.log("ninja_running_3 - Ошибка загрузки");
      return createFallbackImage(80, 120, "#FFAAB0");
    });

    // Анимации прыжка (2 кадра)
    const jump1Promise = loadImage(
      "assets/animations/characters/ninja/jumping/ninja_jump.svg",
    ).catch((err) => {
      console.log("ninja_jump - Ошибка загрузки");
      return createFallbackImage(80, 120, "#45B7D1");
    });

    const kolobokPromise = loadImage(
      "assets/animations/characters/ninja/jumping/ninja_kolobok.svg",
    ).catch((err) => {
      console.log("ninja_kolobok - Ошибка загрузки");
      return createFallbackImage(80, 120, "#4ECDC4");
    });

    // Анимация падения
    const fallPromise = loadImage(
      "assets/animations/characters/ninja/jumping/ninja_fall.svg",
    ).catch((err) => {
      console.log("ninja_fall - Ошибка загрузки");
      return createFallbackImage(80, 120, "#96CEB4");
    });

    // Загрузка анимаций атаки
    const attackPromise = loadImage(
      "assets/animations/characters/ninja/attacking/ninja_afk_attack.svg",
    ).catch((err) => {
      console.log("ninja_afk_attack - Ошибка загрузки");
      return createFallbackImage(80, 120, "#FF0000");
    });

    const jumpAttackPromise = loadImage(
      "assets/animations/characters/ninja/attacking/ninja_jump_attack.svg",
    ).catch((err) => {
      console.log("ninja_jump_attack - Ошибка загрузки");
      return createFallbackImage(80, 120, "#FF0000");
    });

    // ✅ ЗАГРУЗКА АНИМАЦИИ ПОЛУЧЕНИЯ УРОНА
    const damagedPromise = loadImage(
      "assets/animations/characters/ninja/damaged/ninja_damaged.svg",
    ).catch((err) => {
      console.log("ninja_damaged - Ошибка загрузки");
      return createFallbackImage(80, 120, "#FF0000");
    });

    // Ждем загрузку всех анимаций
    characterFrames.idle = await idlePromise;
    characterFrames.run = await Promise.all([
      run1Promise,
      run2Promise,
      run3Promise,
    ]);
    characterFrames.jump = await Promise.all([jump1Promise, kolobokPromise]);
    characterFrames.fall = await fallPromise;
    characterFrames.attack = await attackPromise;
    characterFrames.jump_attack = await jumpAttackPromise;
    characterFrames.damaged = await damagedPromise; // ✅ НОВОЕ

    console.log("Все анимации загружены!");
    console.log(`  - Idle: ${characterFrames.idle ? "OK" : "FAIL"}`);
    console.log(`  - Run frames: ${characterFrames.run.length}/3`);
    console.log(`  - Jump frames: ${characterFrames.jump.length}/2`);
    console.log(`  - Fall: ${characterFrames.fall ? "OK" : "FAIL"}`);
    console.log(`  - Attack: ${characterFrames.attack ? "OK" : "FAIL"}`);
    console.log(`  - Jump Attack: ${characterFrames.jump_attack ? "OK" : "FAIL"}`);
    console.log(`  - Damaged: ${characterFrames.damaged ? "OK" : "FAIL"}`); // ✅ НОВОЕ

    return true;
  } catch (error) {
    console.error("Критическая ошибка загрузки анимаций:", error);
    // Создаем фоллбэк для всех анимаций
    characterFrames.idle = createFallbackImage(80, 120, "#4ECDC4");
    characterFrames.run = [
      createFallbackImage(80, 120, "#FF6B6B"),
      createFallbackImage(80, 120, "#FF8C94"),
      createFallbackImage(80, 120, "#FFAAB0"),
    ];
    characterFrames.jump = [
      createFallbackImage(80, 120, "#45B7D1"),
      createFallbackImage(80, 120, "#4ECDC4"),
    ];
    characterFrames.fall = createFallbackImage(80, 120, "#96CEB4");
    characterFrames.attack = createFallbackImage(80, 120, "#FF0000");
    characterFrames.jump_attack = createFallbackImage(80, 120, "#FF0000");
    characterFrames.damaged = createFallbackImage(80, 120, "#FF0000"); // ✅ НОВОЕ
    return true;
  }
}

// Создание фоллбэк изображения
function createFallbackImage(width, height, color) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Рисуем простого ниндзя
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  // Голова
  ctx.fillStyle = "#2C3E50";
  ctx.fillRect(width * 0.25, height * 0.1, width * 0.5, height * 0.3);

  // Глаза
  ctx.fillStyle = "white";
  ctx.fillRect(width * 0.3, height * 0.2, width * 0.15, height * 0.1);
  ctx.fillRect(width * 0.55, height * 0.2, width * 0.15, height * 0.1);

  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

// Загрузка анимаций врагов
async function loadEnemyAnimations() {
    console.log("Начинаем загрузку анимаций врагов...");
    
    try {
        // Загрузка анимаций для стандартного врага 1
        const standard1Frame1 = await loadImage('assets/animations/characters/enemies/enemy_standart_1/standart1_frame1.svg')
            .catch(err => createFallbackEnemyImage(60, 60, '#8E44AD'));
        const standard1Frame2 = await loadImage('assets/animations/characters/enemies/enemy_standart_1/standart1_frame2.svg')
            .catch(err => createFallbackEnemyImage(60, 60, '#8E44AD'));
        
        enemyFrames.standard1 = [standard1Frame1, standard1Frame2];
        
        // Загрузка анимаций для стандартного врага 2
        const standard2Frame1 = await loadImage('assets/animations/characters/enemies/enemy_standart_2/standart2_frame1.svg')
            .catch(err => createFallbackEnemyImage(60, 60, '#E74C3C'));
        const standard2Frame2 = await loadImage('assets/animations/characters/enemies/enemy_standart_2/standart2_frame2.svg')
            .catch(err => createFallbackEnemyImage(60, 60, '#E74C3C'));
        
        enemyFrames.standard2 = [standard2Frame1, standard2Frame2];
        
        // Анимации для прыгунов
        const jumperFrame1 = await loadImage('assets/animations/characters/enemies/enemy_jumper/jumper_frame1.svg')
            .catch(err => createFallbackEnemyImage(45, 45, '#D35400'));
        const jumperFrame2 = await loadImage('assets/animations/characters/enemies/enemy_jumper/jumper_frame2.svg')
            .catch(err => createFallbackEnemyImage(45, 45, '#D35400'));
        
        enemyFrames.jumper = [jumperFrame1, jumperFrame2];
        
        // Анимации для летающих врагов
        const flyingFrame1 = await loadImage('assets/animations/characters/enemies/enemy_flying/flying_frame1.svg')
            .catch(err => createFallbackEnemyImage(50, 50, '#9B59B6'));
        const flyingFrame2 = await loadImage('assets/animations/characters/enemies/enemy_flying/flying_frame2.svg')
            .catch(err => createFallbackEnemyImage(50, 50, '#9B59B6'));
        
        enemyFrames.flying = [flyingFrame1, flyingFrame2];
        
        // Анимации для быстрых врагов (бегунов)
        const runnerFrame1 = await loadImage('assets/animations/characters/enemies/enemy_runner/runner_frame1.svg')
            .catch(err => createFallbackEnemyImage(45, 45, '#C0392B'));
        const runnerFrame2 = await loadImage('assets/animations/characters/enemies/enemy_runner/runner_frame2.svg')
            .catch(err => createFallbackEnemyImage(45, 45, '#C0392B'));
        
        enemyFrames.runner = [runnerFrame1, runnerFrame2];
        
        // ✅ ДОБАВЛЯЕМ АНИМАЦИИ ДЛЯ БРОНИРОВАННЫХ ВРАГОВ
        const armoredFrame1 = await loadImage('assets/animations/characters/enemies/enemy_armored/armored_frame1.svg')
            .catch(err => createFallbackEnemyImage(70, 70, '#34495E'));
        const armoredFrame2 = await loadImage('assets/animations/characters/enemies/enemy_armored/armored_frame2.svg')
            .catch(err => createFallbackEnemyImage(70, 70, '#34495E'));
        
        enemyFrames.armored = [armoredFrame1, armoredFrame2];
        
        console.log("Анимации врагов загружены: стандартные 1, стандартные 2, прыгуны, летающие, бегуны, бронированные!");
        return true;
    } catch (error) {
        console.error("Ошибка загрузки анимаций врагов:", error);
        // Создаем фоллбэк анимации
        enemyFrames.standard1 = [
            createFallbackEnemyImage(60, 60, '#8E44AD'),
            createFallbackEnemyImage(60, 60, '#9B59B6')
        ];
        enemyFrames.standard2 = [
            createFallbackEnemyImage(60, 60, '#E74C3C'),
            createFallbackEnemyImage(60, 60, '#C0392B')
        ];
        enemyFrames.jumper = [
            createFallbackEnemyImage(45, 45, '#D35400'),
            createFallbackEnemyImage(45, 45, '#E67E22')
        ];
        enemyFrames.flying = [
            createFallbackEnemyImage(50, 50, '#9B59B6'),
            createFallbackEnemyImage(50, 50, '#8E44AD')
        ];
        enemyFrames.runner = [
            createFallbackEnemyImage(45, 45, '#C0392B'),
            createFallbackEnemyImage(45, 45, '#E74C3C')
        ];
        // ✅ ФОЛЛБЭК ДЛЯ БРОНИРОВАННЫХ ВРАГОВ
        enemyFrames.armored = [
            createFallbackEnemyImage(70, 70, '#34495E'),
            createFallbackEnemyImage(70, 70, '#2C3E50')
        ];
        return true;
    }
}

// Создание фоллбэк изображения для врага
function createFallbackEnemyImage(width, height, color) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Рисуем простого врага
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Глаза
    ctx.fillStyle = 'white';
    ctx.fillRect(width * 0.2, height * 0.3, width * 0.15, height * 0.15);
    ctx.fillRect(width * 0.65, height * 0.3, width * 0.15, height * 0.15);
    
    ctx.fillStyle = 'black';
    ctx.fillRect(width * 0.23, height * 0.33, width * 0.09, height * 0.09);
    ctx.fillRect(width * 0.68, height * 0.33, width * 0.09, height * 0.09);
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
}

// ✅ НОВАЯ ФУНКЦИЯ: Загрузка анимаций смерти врагов
async function loadEnemyDeathAnimations() {
    console.log("Начинаем загрузку анимаций смерти врагов...");
    
    try {
        // Загружаем 4 кадра анимации смерти
        const deathFrame1 = await loadImage('assets/animations/characters/enemies/enemy_death/enemy_death_1.svg')
            .catch(err => createFallbackDeathImage(1));
        const deathFrame2 = await loadImage('assets/animations/characters/enemies/enemy_death/enemy_death_2.svg')
            .catch(err => createFallbackDeathImage(2));
        const deathFrame3 = await loadImage('assets/animations/characters/enemies/enemy_death/enemy_death_3.svg')
            .catch(err => createFallbackDeathImage(3));
        const deathFrame4 = await loadImage('assets/animations/characters/enemies/enemy_death/enemy_death_4.svg')
            .catch(err => createFallbackDeathImage(4));
        
        enemyDeathFrames = [deathFrame1, deathFrame2, deathFrame3, deathFrame4];
        
        console.log("Анимации смерти врагов загружены успешно!");
        return true;
    } catch (error) {
        console.error("Ошибка загрузки анимаций смерти врагов:", error);
        // Создаем фоллбэк анимации
        enemyDeathFrames = [
            createFallbackDeathImage(1),
            createFallbackDeathImage(2),
            createFallbackDeathImage(3),
            createFallbackDeathImage(4)
        ];
        return true;
    }
}

// ✅ НОВАЯ ФУНКЦИЯ: Создание фоллбэк изображения для смерти
function createFallbackDeathImage(frameNumber) {
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    
    // Рисуем простую анимацию смерти
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0, 0, 60, 60);
    
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`Death ${frameNumber}`, 5, 30);
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
}

// ✅ НОВАЯ ФУНКЦИЯ: Запуск анимации смерти врага
function startEnemyDeathAnimation(enemy, enemyIndex) {
    // Удаляем врага из основного массива
    enemies.splice(enemyIndex, 1);
    
    // Добавляем в массив умирающих врагов
    const dyingEnemy = {
        x: enemy.x,
        y: enemy.y,
        width: enemy.width * 3.5,
        height: enemy.height * 3.5,
        deathTimer: 60, // 1 секунда при 60 FPS
        currentFrame: 0,
        frameTimer: 0,
        frameSpeed: 15, // Смена кадра каждые 15 кадров
        direction: enemy.direction,
        enemyType: enemy.enemyType,
        type: enemy.type
    };
    
    dyingEnemies.push(dyingEnemy);
    
    // Удаляем анимацию этого врага
    delete enemyAnimations[enemyIndex];
    
    // Перенумеруем оставшиеся анимации врагов
    reorganizeEnemyAnimations(enemyIndex);
}

// ✅ НОВАЯ ФУНКЦИЯ: Реорганизация анимаций после удаления врага
function reorganizeEnemyAnimations(removedIndex) {
    const newAnimations = {};
    
    // Копируем анимации, смещая индексы
    for (let i = 0; i < enemies.length; i++) {
        const oldIndex = i >= removedIndex ? i + 1 : i;
        if (enemyAnimations[oldIndex]) {
            newAnimations[i] = enemyAnimations[oldIndex];
        }
    }
    
    enemyAnimations = newAnimations;
}

// ✅ НОВАЯ ФУНКЦИЯ: Обновление анимаций смерти
function updateDeathAnimations() {
    for (let i = dyingEnemies.length - 1; i >= 0; i--) {
        const dyingEnemy = dyingEnemies[i];
        
        // Уменьшаем таймер
        dyingEnemy.deathTimer--;
        
        // Обновляем анимацию
        dyingEnemy.frameTimer++;
        if (dyingEnemy.frameTimer >= dyingEnemy.frameSpeed) {
            dyingEnemy.frameTimer = 0;
            dyingEnemy.currentFrame++;
            
            // Эффект "всплытия" в последнем кадре
            if (dyingEnemy.currentFrame >= 3) {
                dyingEnemy.y -= 2;
            }
        }
        
        // Удаляем завершенную анимацию
        if (dyingEnemy.deathTimer <= 0) {
            dyingEnemies.splice(i, 1);
        }
    }
}

// ✅ НОВАЯ ФУНКЦИЯ: Отрисовка анимаций смерти
function drawDeathAnimations() {
    for (const dyingEnemy of dyingEnemies) {
        if (enemyDeathFrames.length === 0) continue;
        
        const frameIndex = Math.min(dyingEnemy.currentFrame, enemyDeathFrames.length - 1);
        const deathFrame = enemyDeathFrames[frameIndex];
        
        if (!deathFrame) continue;
        
        ctx.save();
        
        // Эффект прозрачности в конце
        if (dyingEnemy.deathTimer < 20) {
            ctx.globalAlpha = dyingEnemy.deathTimer / 20;
        }
        
        // Центрирование анимации смерти
        const drawX = dyingEnemy.x - (dyingEnemy.width - dyingEnemy.width/3.5) / 2;
        const drawY = dyingEnemy.y - (dyingEnemy.height - dyingEnemy.height/3.5) / 2 - 50;
        
        // Отражение для врагов, смотрящих влево
        if (dyingEnemy.direction === -1) {
            ctx.translate(drawX + dyingEnemy.width / 2, drawY);
            ctx.scale(-1, 1);
            ctx.drawImage(deathFrame, -dyingEnemy.width / 2, 0, dyingEnemy.width, dyingEnemy.height);
        } else {
            ctx.drawImage(deathFrame, drawX, drawY, dyingEnemy.width, dyingEnemy.height);
        }
        
        ctx.restore();
    }
}

// Инициализация анимации для врага
function initEnemyAnimation(enemy) {
    const enemyId = enemies.indexOf(enemy);
    enemyAnimations[enemyId] = {
        currentFrame: 0,
        animationTimer: 0,
        animationSpeed: 200, // ms между кадрами
        direction: enemy.direction
    };
}

// Обновление анимации врагов
function updateEnemyAnimations() {
    const currentTime = performance.now();
    
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const anim = enemyAnimations[i];
        
        if (!anim) {
            initEnemyAnimation(enemy);
            continue;
        }
        
        // ✅ РАЗНАЯ СКОРОСТЬ АНИМАЦИИ ДЛЯ РАЗНЫХ ТИПОВ ВРАГОВ
        let animationSpeed;
        
        if (enemy.type === "flying") {
            // ЛЕТУНЫ - МЕДЛЕННАЯ АНИМАЦИЯ
            animationSpeed = 400; // ms между кадрами (вместо 200)
        } else if (enemy.type === "fast" || enemy.type === "fastPlatform") {
            // БЫСТРЫЕ ВРАГИ - БЫСТРАЯ АНИМАЦИЯ
            animationSpeed = 120;
        } else {
            // ВСЕ ОСТАЛЬНЫЕ - СТАНДАРТНАЯ СКОРОСТЬ
            animationSpeed = 200;
        }
        
        // Обновляем анимацию только для движущихся врагов
        if (enemy.speed > 0 && !enemy.isStuck) {
            anim.animationTimer += deltaTime;
            
            if (anim.animationTimer >= animationSpeed) {
                anim.animationTimer = 0;
                anim.currentFrame = (anim.currentFrame + 1) % 2; // 2 кадра анимации
            }
        } else {
            // Если враг не двигается, показываем первый кадр
            anim.currentFrame = 0;
        }
    }
}

// Вспомогательная функция загрузки изображения
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let timeoutId;

    img.onload = () => {
      clearTimeout(timeoutId);
      console.log(`Загружено: ${src}`);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      console.error(`Ошибка загрузки: ${src}`);
      reject(new Error(`Не удалось загрузить ${src}`));
    };

    // Таймаут 10 секунд
    timeoutId = setTimeout(() => {
      console.error(`Таймаут загрузки: ${src}`);
      reject(new Error(`Таймаут загрузки ${src}`));
    }, 10000);

    img.src = src;
  });
}

// Воспроизведение музыки
function playMusic(name, loop = true, volume = 0.6) {
  if (!audioContext || !sounds[name]) {
    console.warn(`Музыка не найдена или аудио не инициализировано: ${name}`);
    return null;
  }

  // Останавливаем текущую музыку
  if (currentMusic) {
    currentMusic.stop();
  }

  try {
    // Возобновляем контекст если приостановлен
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = sounds[name];
    source.loop = loop;
    gainNode.gain.value = volume * musicVolume;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start(0);
    currentMusic = source;
    currentMusicGainNode = gainNode;

    source.onended = () => {
      if (currentMusic === source) {
        currentMusic = null;
        currentMusicGainNode = null;
      }
    };

    return source;
  } catch (error) {
    console.error(`Ошибка воспроизведения музыки ${name}:`, error);
    return null;
  }
}

// Остановка музыки
function stopMusic() {
  if (currentMusic) {
    currentMusic.stop();
    currentMusic = null;
    currentMusicGainNode = null;
  }
}

// Обновление громкости музыки
function updateMusicVolume() {
  if (currentMusicGainNode) {
    currentMusicGainNode.gain.value = musicVolume;
  }
}

// Обновление громкости SFX
function updateSFXVolume() {
  // Громкость SFX обновляется при каждом воспроизведении звука
}

// ВКЛЮЧЕНИЕ ИГРОВОГО ЗВУКА ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
async function enableGameAudio() {
  if (audioEnabled) return;

  initializeAudio();
  await loadAllSounds();
  audioEnabled = true;
  console.log("Игровой звук включен");
  return true; // возвращаем значение для Promise.all
}

// Функция для показа главного меню
function showMainMenu() {
  preloadScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  gameState = "menu";
  resetStartButton();
  // Воспроизводим музыку меню
  if (audioEnabled) {
    playMusic("main_menu_theme", true, musicVolume);
  }
}

// ОБНОВЛЕННЫЙ ОБРАБОТЧИК PRELOAD SCREEN С ЗАЩИТОЙ ОТ ПОВТОРНЫХ НАЖАТИЙ
preloadScreen.addEventListener("click", async () => {
  // Блокируем повторные нажатия
  preloadScreen.style.pointerEvents = "none";

  try {
    console.log("Загружаем аудио...");
    await enableGameAudio();
    console.log("Аудио загружено успешно");
    showMainMenu();
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    // Разблокируем при ошибке
    preloadScreen.style.pointerEvents = "auto";
  }
});

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

    // ДОБАВЛЯЕМ ТАЙМАУТ НА СЛУЧАЙ ЕСЛИ ЗАГРУЗКА ЗАВИСНЕТ
    setTimeout(() => {
      if (!svgImages[id]) {
        console.error(`Таймаут загрузки SVG: ${src}`);
        reject(new Error(`Таймаут загрузки ${src}`));
      }
    }, 10000); // 10 секунд таймаут
  });
}

// ОБНОВЛЕННАЯ ЗАГРУЗКА ВСЕХ SVG С УЛУЧШЕННОЙ ОБРАБОТКОЙ ОШИБОК
async function loadAllSVGs() {
  console.log("Начинаем загрузку SVG...");

  const svgFiles = [
    { id: "background", path: "assets/images/backgrounds/forest/forest-1.svg" },
    { id: "coin", path: "assets/images/elements/coin.svg" },
    { id: "silver_coin", path: "assets/images/elements/silver-coin.svg" },
    { id: "flag", path: "assets/images/elements/flag.svg" },
    { id: "flagDisabled", path: "assets/images/elements/flag-disabled.svg" },
  ];

  for (const file of svgFiles) {
    try {
      svgImages[file.id] = await loadImage(file.path);
    } catch (error) {
      console.warn(`Используем фоллбэк для ${file.id}`);
      svgImages[file.id] = createFallbackSVG(file.id);
    }
  }

  console.log("SVG загружены!");
  return true;
}

function createFallbackSVG(id) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  switch (id) {
    case "coin":
      canvas.width = canvas.height = 30;
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(15, 15, 12, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "flag":
      canvas.width = 60;
      canvas.height = 100;
      ctx.fillStyle = "#00FF00";
      ctx.fillRect(0, 0, 60, 100);
      break;
    case "flagDisabled":
      canvas.width = 60;
      canvas.height = 100;
      ctx.fillStyle = "#666666";
      ctx.fillRect(0, 0, 60, 100);
      break;
    default:
      canvas.width = 800;
      canvas.height = 600;
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(1, "#0066CC");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);
  }

  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

// Игровые объекты
let player = {
  x: 100,
  y: 800,
  width: 80,
  height: 120,
  speed: 8,
  velX: 0,
  velY: 0,
  jumping: false,
  grounded: false,
  direction: 1,
  lastGroundedState: false,
};

let gravity = 0.8;
let friction = 0.8;

// Шаблоны платформ
const platformTemplates = [
  // Маленькие платформы
  [
    { width: 80, height: 25, color: "#D35400" },
    { width: 100, height: 25, color: "#D35400" },
    { width: 120, height: 25, color: "#D35400" },
  ],
  // Средние платформы
  [
    { width: 150, height: 25, color: "#E67E22" },
    { width: 180, height: 25, color: "#E67E22" },
    { width: 200, height: 25, color: "#E67E22" },
  ],
  // Большие платформы
  [
    { width: 250, height: 25, color: "#F39C12" },
    { width: 300, height: 25, color: "#F39C12" },
    { width: 350, height: 25, color: "#F39C12" },
  ],
  // Очень большие платформы
  [
    { width: 400, height: 25, color: "#F1C40F" },
    { width: 500, height: 25, color: "#F1C40F" },
    { width: 600, height: 25, color: "#F1C40F" },
  ],
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
  color: "#ff0000ff",
};

// Функция для обновления размеров canvas
function resizeCanvas() {
  camera.width = window.innerWidth;
  camera.height = window.innerHeight;

  // ВАЖНО: Устанавливаем размер canvas равным размеру окна просмотра
  canvas.width = camera.width;
  canvas.height = camera.height;

  canvas.style.width = "100%";
  canvas.style.height = "100%";

  // Фиксируем камеру на нижней части уровня при ресайзе
  if (gameState === "playing") {
    camera.y = levelHeight - camera.height;

    // Ограничения по вертикали
    if (camera.y < 0) camera.y = 0;
    if (camera.y + camera.height > levelHeight)
      camera.y = levelHeight - camera.height;
  }
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
    hasCoins: Math.random() > 0.3,
  };
}

// Создание монет на платформе
function createCoinsOnPlatform(platform) {
  const coins = [];
  const coinCount = Math.floor(Math.random() * 3) + 1;

  const spacing = platform.width / (coinCount + 1);

  for (let i = 0; i < coinCount; i++) {
    const offsetX = spacing * (i + 1);

    const isHighCoin = Math.random() > 0.7;
    const isSilverCoin = isHighCoin && Math.random() > 0.5; // Серебряные монеты в труднодоступных местах

    let heightOffset;

    if (isHighCoin) {
      heightOffset = -80 - Math.random() * 40;
    } else {
      heightOffset = Math.random() * 30 - 15;
    }

    coins.push({
      x: platform.x + offsetX - 15,
      y: platform.y - 50 + heightOffset,
      width: 30,
      height: 30,
      color: isSilverCoin ? "#C0C0C0" : isHighCoin ? "#ff9900" : "#ffcc00",
      collected: false,
      platformId: platforms.length,
      originalY: platform.y - 50 + heightOffset,
      bounceOffset: 0,
      bounceSpeed: 0.08 + Math.random() * 0.04,
      bouncePhase: Math.random() * Math.PI * 2,
      isHighCoin: isHighCoin,
      isSilverCoin: isSilverCoin, // НОВОЕ: флаг серебряной монеты
      // ✅ ДОБАВЛЯЕМ АНИМАЦИОННЫЕ СВОЙСТВА
      animationTimer: 0,
      currentFrame: Math.random() > 0.5 ? 0 : 1, // Случайный начальный кадр
    });
  }

  return coins;
}

function isPlatformReachable(platform1, platform2) {
  const maxJumpHorizontal = 400; // Максимальная дистанция прыжка по горизонтали
  const maxJumpVertical = 250; // Максимальная высота прыжка

  const horizontalDist = Math.abs(
    platform2.x - (platform1.x + platform1.width),
  );
  const verticalDist = Math.abs(platform2.y - platform1.y);

  return horizontalDist <= maxJumpHorizontal && verticalDist <= maxJumpVertical;
}

// Создание пути через уровень
function createLevelPath() {
  const pathPlatforms = [];
  const pathCoins = [];

  let currentX = 200;
  let currentY = 950;
  let totalCoins = 0;
  let attempts = 0;
  const maxAttempts = 50; // Защита от бесконечного цикла

  while (currentX < flag.x - 300 && attempts < maxAttempts) {
    attempts++;

    const platformType = Math.floor(Math.random() * 3);
    const templates = platformTemplates[platformType];
    const template = templates[Math.floor(Math.random() * templates.length)];

    const heightChange = Math.random() * 120 - 60;
    const gapSize = 80 + Math.random() * 60;

    currentY = Math.max(400, Math.min(1100, currentY + heightChange));

    // Проверяем, чтобы платформы не накладывались и были достижимы
    let overlaps = false;
    let unreachable = false;

    if (pathPlatforms.length > 0) {
      const lastPlatform = pathPlatforms[pathPlatforms.length - 1];
      if (
        !isPlatformReachable(lastPlatform, {
          x: currentX,
          y: currentY,
          width: template.width,
          height: template.height,
        })
      ) {
        unreachable = true;
      }
    }

    for (let platform of pathPlatforms) {
      if (
        Math.abs(currentX - platform.x) < 120 &&
        Math.abs(currentY - platform.y) < 40
      ) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps && !unreachable) {
      const platform = {
        x: currentX,
        y: currentY,
        width: template.width,
        height: template.height,
        color: template.color,
        hasCoins: Math.random() > 0.3,
      };

      pathPlatforms.push(platform);

      if (platform.hasCoins) {
        const platformCoins = createCoinsOnPlatform(platform);
        pathCoins.push(...platformCoins);
        totalCoins += platformCoins.length;
      }

      currentX += platform.width + gapSize;

      if (Math.random() > 0.7 && currentX < levelWidth - 1000) {
        // ... существующий код ...
      }
    } else {
      // Если платформа недостижима, корректируем позицию
      currentX += 50;
      currentY = 950; // Возвращаем на стандартную высоту
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
    const x = Math.random() * (levelWidth - 800) + 200;
    const y = Math.random() * 300 + 700;

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
      platform.hasCoins = true;

      additionalPlatforms.push(platform);
      const platformCoins = createCoinsOnPlatform(platform);
      additionalCoins.push(...platformCoins);
      currentCoins += platformCoins.length;
    }
  }

  return {
    platforms: additionalPlatforms,
    coins: additionalCoins,
  };
}

// Найти платформу для врага
function findPlatformForEnemy(minWidth = 150) {
  const suitablePlatforms = platforms.filter(
    (p) =>
      p.width >= minWidth &&
      p.y < levelHeight - 100 &&
      p.x > 300 &&
      p.x < levelWidth - 500,
  );

  if (suitablePlatforms.length === 0) return null;

  const platform =
    suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)];
  return {
    platform: platform,
    x: platform.x + 20,
    y: platform.y - 60,
  };
}

// Создание врагов
function createEnemies() {
  const enemies = [];

  // Уровни без врагов (для будущих боссов)
  if ([4, 7, 10].includes(level)) {
    return enemies; // Возвращаем пустой массив врагов
  }

  // Обычные враги (уровни 1, 2, 3, 5, 9)
  if ([1, 2, 3, 5, 9].includes(level)) {
    const groundEnemyCount = level <= 3 ? 4 + Math.floor(level * 1.2) : 2;
    for (let i = 0; i < groundEnemyCount; i++) {
      const enemyX =
        300 + i * Math.floor((levelWidth - 600) / groundEnemyCount);
      const patrolRange = 120 + Math.random() * 100;

      enemies.push({
        x: enemyX,
        y: levelHeight - 70,
        width: 60,
        height: 60,
        speed: 2 + level * 0.3,
        direction: i % 2 === 0 ? 1 : -1,
        patrolRange: patrolRange,
        startX: enemyX,
        color: "#8E44AD",
        type: "ground",
        enemyType: "standard1"
      });
    }
  }

  // Прыгуны (уровни 2, 3, 6, 9)
  if ([2, 3, 6, 9].includes(level)) {
    const jumpingEnemyCount = level <= 3 ? 2 : 3;
    for (let i = 0; i < jumpingEnemyCount; i++) {
      const suitablePlatforms = platforms.filter(
        (p) =>
          p.width >= 180 &&
          p.y < levelHeight - 100 &&
          p.x > 200 &&
          p.x < levelWidth - 400,
      );

      if (suitablePlatforms.length > 0) {
        const platform =
          suitablePlatforms[
            Math.floor(Math.random() * suitablePlatforms.length)
          ];

        enemies.push({
          x: platform.x + 20,
          y: platform.y - 60,
          width: 45,
          height: 45,
          speed: 1.8 + level * 0.15,
          direction: 1,
          patrolRange: platform.width - 80,
          startX: platform.x + platform.width / 2,
          color: "#D35400",
          type: "jumping",
          enemyType: "jumper",
          platformId: platforms.indexOf(platform),
          grounded: true,
          jumpCooldown: 0,
          velY: 0,
        });
      }
    }
  }

  // Быстрые враги (уровни 3, 6, 8, 9)
  if ([3, 6, 8, 9].includes(level)) {
    const fastEnemyCount = level <= 6 ? 1 : 2;
    for (let i = 0; i < fastEnemyCount; i++) {
      const fastX = 600 + i * 500;

      enemies.push({
        x: fastX,
        y: levelHeight - 70,
        width: 45,
        height: 45,
        speed: 3.5 + level * 0.4,
        direction: 1,
        patrolRange: 150,
        startX: fastX,
        color: "#C0392B",
        type: "fast",
        enemyType: "runner",
      });
    }
  }

  // Летающие враги (уровни 5, 6, 8, 9)
  if ([5, 6, 8, 9].includes(level)) {
    const flyingEnemyCount = level <= 6 ? 2 : 3;
    for (let i = 0; i < flyingEnemyCount; i++) {
      const flyX = 400 + i * Math.floor((levelWidth - 800) / flyingEnemyCount);

      let flyY;
      const heightTier = i % 3;

      if (heightTier === 0) {
        flyY = 700 + Math.random() * 150;
      } else if (heightTier === 1) {
        flyY = 550 + Math.random() * 100;
      } else {
        flyY = 400 + Math.random() * 100;
      }

      flyY += Math.random() * 50 - 25;
      flyY = Math.max(150, Math.min(700, flyY));

      enemies.push({
        x: flyX,
        y: flyY,
        width: 50,
        height: 50,
        speed: 1.8 + level * 0.2,
        direction: 1,
        patrolRange: 200,
        startX: flyX,
        isFlying: true,
        color: "#9B59B6",
        type: "flying",
        enemyType: "flying",
        verticalSpeed: 0.4 + Math.random() * 0.3,
        verticalRange: 60 + Math.random() * 50,
        heightTier: heightTier,
      });
    }
  }

  // Бронированные враги на платформах (уровни 8, 9)
  if ([8, 9].includes(level)) {
    const armoredEnemyCount = level === 8 ? 3 : 5;
    for (let i = 0; i < armoredEnemyCount; i++) {
      const suitablePlatforms = platforms.filter(
        (p) =>
          p.width >= 200 && // Нужны широкие платформы для бронированных
          p.y < levelHeight - 150 &&
          p.x > 300 &&
          p.x < levelWidth - 500,
      );

      if (suitablePlatforms.length > 0) {
        const platform =
          suitablePlatforms[
            Math.floor(Math.random() * suitablePlatforms.length)
          ];

        enemies.push({
          x: platform.x + 30,
          y: platform.y - 70,
          width: 70,
          height: 70,
          speed: 1.2 + level * 0.15,
          direction: Math.random() > 0.5 ? 1 : -1,
          patrolRange: platform.width - 100,
          startX: platform.x + platform.width / 2,
          color: "#34495E",
          type: "armored",
          enemyType: "armored",
          isArmored: true,
          platformId: platforms.indexOf(platform),
          grounded: true,
        });
      }
    }
  }

  // Обычные враги на платформах (для всех уровней, кроме 6, 8 и 9)
  // На 6 уровне заменяем обычных врагов на быстрых на платформах
  // На 8 уровне быстрые враги также могут появляться на платформах
  if (![8, 9].includes(level)) {
    const platformEnemyCount = 3 + Math.floor(level * 0.6);
    for (let i = 0; i < platformEnemyCount; i++) {
      const suitablePlatforms = platforms.filter(
        (p) =>
          p.width >= 150 &&
          p.y < levelHeight - 100 &&
          p.x > 200 &&
          p.x < levelWidth - 400,
      );

      if (suitablePlatforms.length > 0) {
        const platform =
          suitablePlatforms[
            Math.floor(Math.random() * suitablePlatforms.length)
          ];

        // На 6 уровне заменяем обычных врагов на быстрых на платформах
        const enemyType = level === 6 ? "fastPlatform" : "platform";
        const enemySpeed = level === 6 ? 3.5 + level * 0.4 : 1.5 + level * 0.2;

        enemies.push({
          x: platform.x + 20,
          y: platform.y - 60,
          width: level === 6 ? 45 : 50,
          height: level === 6 ? 45 : 50,
          speed: enemySpeed,
          direction: Math.random() > 0.5 ? 1 : -1,
          patrolRange: platform.width - 60,
          startX: platform.x + platform.width / 2,
          color: level === 6 ? "#C0392B" : "#E74C3C",
          type: enemyType,
          enemyType: level === 6 ? "runner" : "standard2",
          platformId: platforms.indexOf(platform),
          grounded: true,
          jumpCooldown: 0,
          isStuck: false,
          stuckTimer: 0,
          originalSpeed: enemySpeed,
        });
      }
    }
  }

  // На 8 уровне добавляем быстрых врагов на платформах
  if (level === 8) {
    const fastPlatformEnemyCount = 2;
    for (let i = 0; i < fastPlatformEnemyCount; i++) {
      const suitablePlatforms = platforms.filter(
        (p) =>
          p.width >= 180 &&
          p.y < levelHeight - 100 &&
          p.x > 300 &&
          p.x < levelWidth - 500,
      );

      if (suitablePlatforms.length > 0) {
        const platform =
          suitablePlatforms[
            Math.floor(Math.random() * suitablePlatforms.length)
          ];

        enemies.push({
          x: platform.x + 20,
          y: platform.y - 60,
          width: 45,
          height: 45,
          speed: 3.5 + level * 0.4,
          direction: Math.random() > 0.5 ? 1 : -1,
          patrolRange: platform.width - 80,
          startX: platform.x + platform.width / 2,
          color: "#C0392B",
          type: "fastPlatform",
          enemyType: "runner",
          platformId: platforms.indexOf(platform),
          grounded: true,
          isStuck: false,
          stuckTimer: 0,
          originalSpeed: 3.5 + level * 0.4,
        });
      }
    }
  }

  return enemies;
}

// ПОЛНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ИГРЫ С HP СИСТЕМОЙ И СОХРАНЕНИЕМ
function init() {
  loadCharacterAnimations();

  // ✅ ИНИЦИАЛИЗИРУЕМ HP СИСТЕМУ КАК 3 ЖИЗНИ
  if (level === 1) {
    hpSystem.currentHp = 3;
    hpSystem.maxHp = 3;
    hpSystem.displayHp = 3;
    hpSystem.isAnimating = false;
    hpSystem.isLevelUp = false;
    console.log("HP система инициализирована: 3 жизни");
    
    // Проверим какой кадр загружается
    const testFrame = getCurrentHpFrame();
    console.log("Initial HP frame:", testFrame);
  }

  // ✅ ДОБАВЛЯЕМ: Проверка и повышение HP при начале уровня
  // Только для новых игр, при загрузке сохранения HP уже загружено
  if (!gameSave || gameSave.level !== level) {
    checkAndUpgradeHpAtLevelStart();
  }

  // ПРОВЕРЯЕМ, ЧТО SVG ЗАГРУЖЕНЫ
  if (Object.keys(svgImages).length === 0) {
    console.error("SVG не загружены! Игра не может быть запущена.");
    // ВОЗВРАЩАЕМ ПОЛЬЗОВАТЕЛЯ В МЕНЮ
    startScreen.classList.remove("hidden");
    gameState = "menu";
    resetStartButton();
    return;
  }

  console.log("Инициализация игры...");

  // ПОКАЗЫВАЕМ UI ЭЛЕМЕНТЫ ПРИ НАЧАЛЕ ИГРЫ
  const uiOverlay = document.querySelector(".ui-overlay");
  const gamepadStatus = document.getElementById("gamepadStatus");
  if (uiOverlay) uiOverlay.classList.remove("hidden");
  if (gamepadStatus) gamepadStatus.classList.remove("hidden");

  // Останавливаем музыку меню при начале игры
  if (gameState === "menu") {
    stopMusic();
    // Воспроизводим музыку леса для первых уровней
    if (level >= 1 && level <= 3) {
      playMusic("forest_theme", true, musicVolume);
    }
  }

  // Установка размера canvas
  resizeCanvas();

  // Сброс счетчиков уровня (НЕ сбрасываем общие монеты)
  coinsCollectedInLevel = 0;
  coinsToWin = 15 + level * 7;

  // Создание уровня
  platforms = [];
  coinsList = [];

  // Основная земля
  platforms.push({
    x: 0,
    y: levelHeight - 30,
    width: levelWidth,
    height: 30,
    color: "#000000ff",
    hasCoins: false,
  });

  // Создание основного пути
  const mainPath = createLevelPath();
  platforms.push(...mainPath.platforms);
  coinsList.push(...mainPath.coins);

  console.log(`Основной путь: ${mainPath.totalCoins} монет`);

  // Добавляем монеты на земле
  const groundCoins = createGroundCoins();
  coinsList.push(...groundCoins);
  console.log(`Добавлено ${groundCoins.length} монет на земле`);

  // Если монет недостаточно, добавляем дополнительные платформы
  if (mainPath.totalCoins + groundCoins.length < coinsToWin) {
    const neededCoins =
      coinsToWin - (mainPath.totalCoins + groundCoins.length) + 5;
    const additional = createAdditionalPlatforms(
      mainPath.platforms,
      [...mainPath.coins, ...groundCoins],
      neededCoins,
    );
    platforms.push(...additional.platforms);
    coinsList.push(...additional.coins);

    console.log(`Добавлено ${additional.coins.length} дополнительных монет`);
  }

  // Гарантируем, что монет достаточно для завершения уровня
  while (coinsList.length < coinsToWin) {
    console.log(
      `Недостаточно монет! Нужно: ${coinsToWin}, есть: ${coinsList.length}. Добавляем...`,
    );

    const x = Math.random() * (flag.x - 600) + 200;
    const y = Math.random() * 300 + 700;

    let overlaps = false;
    for (let platform of platforms) {
      if (Math.abs(x - platform.x) < 200 && Math.abs(y - platform.y) < 100) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      const platform = createRandomPlatform(x, y);
      platform.hasCoins = true;

      platforms.push(platform);
      const platformCoins = createCoinsOnPlatform(platform);
      if (platformCoins.length > 1) {
        platformCoins.splice(1);
      }
      coinsList.push(...platformCoins);
    }
  }

  console.log(
    `Всего монет на уровне: ${coinsList.length}, нужно: ${coinsToWin}`,
  );

  // Создание врагов
  enemies = createEnemies();

  const platformEnemies = enemies.filter(
    (e) => e.type === "platform" || e.type === "jumping",
  ).length;
  console.log(
    `Создано врагов: ${enemies.length} (${enemies.filter((e) => e.isFlying).length} летающих, ${platformEnemies} на платформах)`,
  );

  // Сброс позиции игрока и камеры
  player.x = 100;
  player.y = 800;
  player.velX = 0;
  player.velY = 0;
  player.jumping = false;
  player.grounded = false;
  player.lastGroundedState = false;
  player.direction = 1;

  // Сброс системы урона
  isInvulnerable = false;
  invulnerabilityTimer = 0;
  damageFlashTimer = 0;

  // Сброс системы атаки
  isAttacking = false;
  attackState = "ready";
  attackCooldown = 0;
  attackKeyPressed = false;
  gamepadAttackPressed = false;
  attackHitbox.active = false;

  // Инициализация камеры
  camera.x = 0;
  camera.y = levelHeight - camera.height;

  // Ограничения по вертикали
  if (camera.y < 0) camera.y = 0;
  if (camera.y + camera.height > levelHeight)
    camera.y = levelHeight - camera.height;

  // УБРАН СБРОС ОБЩИХ МОНЕТ: coins = 0;
  coinCountElement.textContent = coins; // Отображаем накопленные монеты
  levelCountElement.textContent = level;

  // Обновляем отображение цели уровня
  updateLevelGoalDisplay();

  // ✅ СОХРАНЯЕМ ИГРУ (ВАЖНО - НЕ УДАЛЯТЬ!)
  saveGame();

  // Сброс анимационных переменных
  isFacingRight = true;
  animationTime = 0;
  pauseKeyPressed = false;
  
  // ✅ ДОБАВЛЯЕМ: Инициализация анимаций для врагов
  enemyAnimations = {};
  for (let i = 0; i < enemies.length; i++) {
    initEnemyAnimation(enemies[i]);
  }
}

// Обновление отображения цели уровня
function updateLevelGoalDisplay() {
  const levelGoalElement = document.getElementById("levelGoal");
  if (levelGoalElement) {
    levelGoalElement.textContent = `Цель: ${coinsCollectedInLevel}/${coinsToWin} монет`;

    // Меняем цвет в зависимости от прогресса
    if (coinsCollectedInLevel >= coinsToWin) {
      levelGoalElement.style.color = "#2ecc71";
    } else if (coinsCollectedInLevel >= coinsToWin * 0.7) {
      levelGoalElement.style.color = "#f39c12";
    } else {
      levelGoalElement.style.color = "#e74c3c";
    }
  }
}

// Обновление камеры для следования за игроком
function updateCamera() {
  // Горизонтальное положение камеры
  camera.x = player.x - camera.width / 2;

  // Фиксированная вертикальная позиция - показываем нижнюю часть уровня
  camera.y = levelHeight - camera.height;

  // Ограничения по горизонтали
  if (camera.x < 0) camera.x = 0;
  if (camera.x + camera.width > levelWidth)
    camera.x = levelWidth - camera.width;

  // Ограничения по вертикали (на всякий случай)
  if (camera.y < 0) camera.y = 0;
  if (camera.y + camera.height > levelHeight)
    camera.y = levelHeight - camera.height;
}

// Отрисовка SVG части кота
function drawSVGPart(id, x, y, width, height, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const svgImage = svgImages[id];
  if (svgImage) {
    ctx.drawImage(svgImage, -width / 2, -height / 2, width, height);
  } else {
    // Заглушка
    ctx.fillStyle = "#888888";
    ctx.fillRect(-width / 4, -height / 2, width / 2, height);
  }

  ctx.restore();
}

// Отрисовка персонажа
function drawCharacter() {
  let currentFrame;

  // БАЗОВЫЕ РАЗМЕРЫ
  let drawWidth = player.width;  // 80px
  let drawHeight = player.height; // 120px
  let yOffset = 0;

  // АНИМАЦИЯ УРОНА
  if (currentAnimation === "damaged" && characterFrames.damaged) {
    currentFrame = characterFrames.damaged;
    drawWidth = player.width * 1.4;
    drawHeight = player.height * 1.4;
  }
  // АНИМАЦИЯ АТАКИ НА ЗЕМЛЕ
  else if (currentAnimation === "attack" && characterFrames.attack) {
    currentFrame = characterFrames.attack;
    
    // Сохраняем пропорции оригинального SVG
    const svgAspectRatio = 1920 / 1080; // 1.777... (16:9)
    const targetHeight = player.height; // 120px
    const targetWidth = targetHeight * svgAspectRatio; // ≈ 213px
    
    drawWidth = targetWidth;
    drawHeight = targetHeight;
  }
  // АНИМАЦИЯ АТАКИ В ПРЫЖКЕ
  else if (currentAnimation === "jump_attack" && characterFrames.jump_attack) {
    currentFrame = characterFrames.jump_attack;
    
    const svgAspectRatio = 1920 / 1080;
    const targetHeight = player.height;
    const targetWidth = targetHeight * svgAspectRatio;
    
    drawWidth = targetWidth;
    drawHeight = targetHeight;
  }
  // Остальные анимации
  else if (currentAnimation === "run" && characterFrames.run.length > 0) {
    currentFrame = characterFrames.run[animationFrame];
  } else if (currentAnimation === "jump" && characterFrames.jump.length > 0) {
    currentFrame = characterFrames.jump[animationFrame];
    
    if (animationFrame === 0) {
      drawWidth = player.width * 1.3;
      drawHeight = player.height * 1.3;
    } else if (animationFrame === 1) {
      drawWidth = player.width * 0.7;
      drawHeight = player.height * 0.7;
    }
  } else if (currentAnimation === "fall" && characterFrames.fall) {
    currentFrame = characterFrames.fall;
    drawWidth = player.width * 1.3;
    drawHeight = player.height * 1.3;
  } else {
    currentFrame = characterFrames.idle;
  }

  if (!currentFrame) {
    console.error("Анимации не загружены!");
    return;
  }

  // Отрисовка
  ctx.save();

  // Эффект мигания при получении урона
  if (damageFlashTimer > 0) {
    ctx.globalAlpha = 0.5;
  }

  // ФИКСИРОВАННЫЕ КООРДИНАТЫ
  const drawX = player.x;
  const drawY = player.y + yOffset;

  // КОРРЕКТИРОВКА ПОЗИЦИИ
  let adjustedX = drawX;
  let adjustedY = drawY;

  // Корректировка только для прыжка и падения
  if (currentAnimation === "jump") {
    if (animationFrame === 0 || animationFrame === 1) {
      adjustedX = drawX - (drawWidth - player.width) / 2;
      adjustedY = drawY - (drawHeight - player.height) / 2;
    }
  } else if (currentAnimation === "fall") {
    adjustedX = drawX - (drawWidth - player.width) / 2;
    adjustedY = drawY - (drawHeight - player.height) / 2;
  }
  // Для атаки и урона - никакой корректировки

  // ОТРАЖЕНИЕ ДЛЯ НАПРАВЛЕНИЯ ВЛЕВО
  if (player.direction === -1) {
    const reflectionPoint = adjustedX + player.width;
    
    ctx.translate(reflectionPoint, adjustedY);
    ctx.scale(-1, 1);
    ctx.drawImage(currentFrame, 0, 0, drawWidth, drawHeight);
  } else {
    // Враг смотрит ВПРАВО
    ctx.drawImage(currentFrame, adjustedX, adjustedY, drawWidth, drawHeight);
  }

  // Восстанавливаем контекст
  ctx.restore();
}

// Обновление анимации монет
function updateCoinAnimations() {
  for (let coin of coinsList) {
    if (!coin.collected) {
      // Обновляем анимацию подпрыгивания (левитация)
      coin.bouncePhase += coin.bounceSpeed;
      coin.bounceOffset = Math.sin(coin.bouncePhase) * 5;
      
      // ✅ ОБНОВЛЯЕМ АНИМАЦИЮ ВРАЩЕНИЯ С ИСПОЛЬЗОВАНИЕМ 2 КАДРОВ
      coin.animationTimer = (coin.animationTimer || 0) + 1;
      
      // Меняем кадры для создания эффекта вращения
      if (coin.animationTimer >= 15) { // Скорость смены кадров
        coin.animationTimer = 0;
        coin.currentFrame = (coin.currentFrame || 0) === 0 ? 1 : 0;
      }
    }
  }
}

// Обновление анимации HP
function updateHpAnimation() {
    if (hpSystem.isAnimating) {
        if (hpSystem.isLevelUp) {
            // ✅ АНИМАЦИЯ ПОВЫШЕНИЯ HP
            if (hpSystem.displayHp < hpSystem.targetHp) {
                hpSystem.displayHp += hpSystem.levelUpAnimationSpeed;
                
                if (hpSystem.displayHp >= hpSystem.targetHp) {
                    hpSystem.displayHp = hpSystem.targetHp;
                    hpSystem.currentHp = hpSystem.targetHp;
                    hpSystem.isAnimating = false;
                    hpSystem.isLevelUp = false;
                }
            }
        } else {
            // ✅ АНИМАЦИЯ УМЕНЬШЕНИЯ HP
            if (Math.abs(hpSystem.displayHp - hpSystem.currentHp) > 0.1) {
                if (hpSystem.displayHp > hpSystem.currentHp) {
                    hpSystem.displayHp -= hpSystem.animationSpeed;
                } else {
                    hpSystem.displayHp += hpSystem.animationSpeed;
                }
                
                if (Math.abs(hpSystem.displayHp - hpSystem.currentHp) <= 0.1) {
                    hpSystem.displayHp = hpSystem.currentHp;
                    hpSystem.isAnimating = false;
                }
            } else {
                hpSystem.displayHp = hpSystem.currentHp;
                hpSystem.isAnimating = false;
            }
        }
    }
}

// Обновление врагов на платформах
function updatePlatformEnemies() {
  for (let enemy of enemies) {
    // Обрабатываем всех врагов на платформах (обычных, прыгунов, бронированных и быстрых на платформах)
    if (
      enemy.type === "platform" ||
      enemy.type === "jumping" ||
      enemy.type === "armored" ||
      enemy.type === "fastPlatform"
    ) {
      const platform = platforms[enemy.platformId];

      if (!platform) {
        // Если платформа не найдена, удаляем врага
        enemies.splice(enemies.indexOf(enemy), 1);
        continue;
      }

      // Проверяем, находится ли враг в зоне видимости камеры
      const isVisible =
        enemy.x < camera.x + camera.width && enemy.x + enemy.width > camera.x;

      // Обновляем только видимых врагов для оптимизации
      if (isVisible) {
        // Логика застревания быстрых врагов на 6 уровне
        if (
          enemy.x < platform.x - 50 ||
          enemy.x > platform.x + platform.width + 50
        ) {
          // Враг вне платформы - корректируем позицию
          enemy.x = platform.x + 20;
          enemy.direction = 1;
        }

        if (enemy.type === "fastPlatform" && level === 6) {
          // Случайный шанс застрять (1% каждый кадр)
          if (!enemy.isStuck && Math.random() < 0.01) {
            enemy.isStuck = true;
            enemy.stuckTimer = 60 + Math.random() * 120; // Застревание на 1-3 секунды
            enemy.originalSpeed = enemy.speed;
            enemy.speed = 0; // Останавливаем врага
          }

          // Если враг застрял, уменьшаем таймер
          if (enemy.isStuck) {
            enemy.stuckTimer--;

            // Визуальный эффект застревания (мигание)
            if (enemy.stuckTimer % 20 < 10) {
              enemy.color = "#FF0000"; // Красный при застревании
            } else {
              enemy.color = "#C0392B"; // Обычный цвет
            }

            // Когда таймер истекает, освобождаем врага
            if (enemy.stuckTimer <= 0) {
              enemy.isStuck = false;
              enemy.speed = enemy.originalSpeed;
              enemy.color = "#C0392B";
            }
          }
        }

        // Горизонтальное движение (бронированные медленнее)
        const speedMultiplier = enemy.type === "armored" ? 0.7 : 1.0;
        // Только если враг не застрял
        if (!enemy.isStuck) {
          enemy.x += enemy.speed * enemy.direction * speedMultiplier;
        }

        // Проверка границ платформы
        if (
          enemy.x <= platform.x + (enemy.type === "armored" ? 20 : 10) ||
          enemy.x + enemy.width >=
            platform.x + platform.width - (enemy.type === "armored" ? 20 : 10)
        ) {
          enemy.direction *= -1;
        }

        // Для прыгающих врагов (только небронированных)
        if (enemy.type === "jumping") {
          enemy.jumpCooldown--;

          // Периодически прыгают
          if (enemy.jumpCooldown <= 0 && Math.random() > 0.95) {
            enemy.velY = -12;
            enemy.grounded = false;
            enemy.jumpCooldown = 60 + Math.random() * 60;
            playSound("jump", 0.4);
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
              playSound("land", 0.3);
            }
          }
        } else {
          // Обычные, быстрые и бронированные враги на платформах всегда на платформе
          enemy.y = platform.y - enemy.height;
        }
      }
    }
  }
}

// Обновление врагов
function updateEnemies() {
  // Обновляем врагов на платформах (включая бронированных)
  updatePlatformEnemies();

  for (let enemy of enemies) {
    // Пропускаем врагов на платформах, так как они уже обработаны
    if (
      enemy.type === "platform" ||
      enemy.type === "jumping" ||
      enemy.type === "armored"
    )
      continue;

    // Горизонтальное движение для остальных врагов
    enemy.x += enemy.speed * enemy.direction;

    if (
      enemy.x <= enemy.startX - enemy.patrolRange ||
      enemy.x >= enemy.startX + enemy.patrolRange
    ) {
      enemy.direction *= -1;
    }

    // Вертикальное движение для летающих врагов
    if (enemy.isFlying) {
      if (enemy.verticalSpeed) {
        enemy.y += Math.sin(animationTime * enemy.verticalSpeed) * 2;
      }
    }

    // Особое поведение для быстрых врагов
    if (enemy.type === "fast") {
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
  // Очистка canvas (теперь очищаем только видимую область)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Если игра в состоянии preload или menu, не рисуем игровой мир 
  if (gameState === "preload" || gameState === "menu") {
    return;
  }

  // Сохраняем текущее состояние контекста
  ctx.save();

  // Смещаем контекст на позицию камеры
  ctx.translate(-camera.x, -camera.y);

  // Рисование фона
  if (svgImages.background) {
    const bgImg = svgImages.background;
    const bgAspectRatio = bgImg.width / bgImg.height;
    const bgHeight = levelHeight;
    const bgWidth = bgHeight * bgAspectRatio;
    const numRepeats = Math.ceil(levelWidth / bgWidth) + 1;
    
    for (let i = 0; i < numRepeats; i++) {
      const x = i * bgWidth;
      ctx.drawImage(bgImg, x, 0, bgWidth, bgHeight);
    }
  }
  else {
    const gradient = ctx.createLinearGradient(0, 0, 0, levelHeight);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.7, "#1E90FF");
    gradient.addColorStop(1, "#0066CC");
    ctx.fillStyle = gradient;
    ctx.fillRect(camera.x, camera.y, levelWidth, levelHeight);
  }

  // Рисование только видимых платформ
  for (let platform of platforms) {
    if (
      platform.x < camera.x + camera.width &&
      platform.x + platform.width > camera.x
    ) {
      ctx.fillStyle = platform.color;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

      // Текстура для платформ не на земле
      if (platform.y < levelHeight - 30) {
        ctx.fillStyle = "#A04000";
        ctx.fillRect(platform.x, platform.y, platform.width, 5);

        // Дополнительная детализация
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        for (let i = 0; i < platform.width; i += 20) {
          ctx.fillRect(platform.x + i, platform.y + 5, 10, 3);
        }
      }
    }
  }

  // Рисование только видимых монет
  for (let coin of coinsList) {
    if (
      !coin.collected &&
      coin.x < camera.x + camera.width &&
      coin.x + coin.width > camera.x
    ) {
      // Используем анимацию подпрыгивания с уменьшенной амплитудой
      const currentY = coin.originalY + coin.bounceOffset;

      // ✅ ОТРИСОВКА С АНИМАЦИЕЙ ВРАЩЕНИЯ (2 КАДРА)
      if (window.coinFrames && window.coinFrames.length > 0) {
        const currentFrame = window.coinFrames[coin.currentFrame || 0];
        
        ctx.save();
        
        // Перемещаем контекст к центру монеты для возможного дополнительного вращения
        const centerX = coin.x + coin.width / 2;
        const centerY = currentY + coin.height / 2;
        ctx.translate(centerX, centerY);
        
        // Можно добавить дополнительное плавное вращение если нужно
        // ctx.rotate((coin.rotation || 0) * 0.1);
        
        // Рисуем текущий кадр анимации
        ctx.drawImage(
          currentFrame,
          -coin.width / 2,
          -coin.height / 2,
          coin.width,
          coin.height,
        );
        
        ctx.restore();
      } else {
        // Запасной вариант если анимации не загружены
        ctx.fillStyle = coin.color;
        ctx.beginPath();
        ctx.arc(
          coin.x + coin.width / 2,
          currentY + coin.height / 2,
          coin.width / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }

  // Рисование только видимых врагов
  for (let enemy of enemies) {
    if (enemy.x < camera.x + camera.width && enemy.x + enemy.width > camera.x) {
      // Разные стили для разных типов врагов

      // БРОНИРОВАННЫЕ ВРАГИ
      if (enemy.type === "armored" && enemyFrames.armored && enemyFrames.armored.length > 0) {
        const anim = enemyAnimations[enemies.indexOf(enemy)];
        const frameIndex = anim ? anim.currentFrame : 0;
        const currentFrame = enemyFrames.armored[frameIndex];
        
        // ПЕРСОНАЛЬНОЕ УВЕЛИЧЕНИЕ ДЛЯ БРОНИРОВАННЫХ ВРАГОВ
        let drawWidth = enemy.width * 1.8;
        let drawHeight = enemy.height * 1.8;
        
        // КОРРЕКТИРОВКА ПОЗИЦИИ - ДЛЯ БРОНИРОВАННЫХ ВРАГОВ
        let adjustedX = enemy.x - (drawWidth - enemy.width) / 2;
        let adjustedY = enemy.y - (drawHeight - enemy.height) - 0;
        
        // Отрисовка с анимацией
        ctx.save();
        if (enemy.direction === 1) {
          // Враг движется ВПРАВО - отражаем по центру (смотрит влево)
          ctx.translate(adjustedX + drawWidth / 2, adjustedY);
          ctx.scale(-1, 1);
          ctx.drawImage(currentFrame, -drawWidth / 2, 0, drawWidth, drawHeight);
        } else {
          // Враг движется ВЛЕВО - рисуем как есть (смотрит вправо)
          ctx.drawImage(currentFrame, adjustedX, adjustedY, drawWidth, drawHeight);
        }
        ctx.restore();
      }
      // ЛЕТАЮЩИЕ ВРАГИ
      else if (enemy.type === "flying" && enemyFrames.flying.length > 0) {
        const anim = enemyAnimations[enemies.indexOf(enemy)];
        const frameIndex = anim ? anim.currentFrame : 0;
        const currentFrame = enemyFrames.flying[frameIndex];
        
        // ПЕРСОНАЛЬНОЕ УВЕЛИЧЕНИЕ ДЛЯ ЛЕТАЮЩИХ ВРАГОВ
        let drawWidth = enemy.width * 2.4;
        let drawHeight = enemy.height * 3.2;
        
        // КОРРЕКТИРОВКА ПОЗИЦИИ - ДЛЯ ЛЕТАЮЩИХ ВРАГОВ
        let adjustedX = enemy.x - (drawWidth - enemy.width) / 2;
        let adjustedY = enemy.y - (drawHeight - enemy.height) / 2;
        
        // Отрисовка с анимацией
        ctx.save();
        if (enemy.direction === 1) {
          // Враг движется ВПРАВО - отражаем по центру (смотрит влево)
          ctx.translate(adjustedX + drawWidth / 2, adjustedY);
          ctx.scale(-1, 1);
          ctx.drawImage(currentFrame, -drawWidth / 2, 0, drawWidth, drawHeight);
        } else {
          // Враг движется ВЛЕВО - рисуем как есть (смотрит вправо)
          ctx.drawImage(currentFrame, adjustedX, adjustedY, drawWidth, drawHeight);
        }
        ctx.restore();
      }
      // ВРАГИ-ПРЫГУНЫ
      else if (enemy.type === "jumping" && enemyFrames.jumper.length > 0) {
        const anim = enemyAnimations[enemies.indexOf(enemy)];
        const frameIndex = anim ? anim.currentFrame : 0;
        const currentFrame = enemyFrames.jumper[frameIndex];
        
        // ПЕРСОНАЛЬНОЕ УВЕЛИЧЕНИЕ ДЛЯ ПРЫГУНОВ
        let drawWidth = enemy.width * 1.5;
        let drawHeight = enemy.height * 1.8;
        
        // КОРРЕКТИРОВКА ПОЗИЦИИ - ДЛЯ ПРЫГУНОВ (ВЫСОТА 0)
        let adjustedX = enemy.x - (drawWidth - enemy.width) / 2;
        let adjustedY = enemy.y - (drawHeight - enemy.height) - 0;
        
        // Отрисовка с анимацией
        ctx.save();
        if (enemy.direction === 1) {
          // Враг движется ВПРАВО - отражаем по центру (смотрит влево)
          ctx.translate(adjustedX + drawWidth / 2, adjustedY);
          ctx.scale(-1, 1);
          ctx.drawImage(currentFrame, -drawWidth / 2, 0, drawWidth, drawHeight);
        } else {
          // Враг движется ВЛЕВО - рисуем как есть (смотрит вправо)
          ctx.drawImage(currentFrame, adjustedX, adjustedY, drawWidth, drawHeight);
        }
        ctx.restore();
        
        // Индикатор готовности к прыжку
        if (enemy.jumpCooldown < 30) {
          ctx.fillStyle = "yellow";
          ctx.fillRect(enemy.x + enemy.width / 2 - 2, enemy.y - 8, 4, 4);
        }
      }
      // БЫСТРЫЕ ВРАГИ (БЕГУНЫ)
      else if ((enemy.type === "fast" || enemy.type === "fastPlatform") && enemyFrames.runner && enemyFrames.runner.length > 0) {
          const anim = enemyAnimations[enemies.indexOf(enemy)];
          const frameIndex = anim ? anim.currentFrame : 0;
          const currentFrame = enemyFrames.runner[frameIndex];
          
          // ПЕРСОНАЛЬНОЕ УВЕЛИЧЕНИЕ ДЛЯ БЫСТРЫХ ВРАГОВ
          let drawWidth = enemy.width * 1.6;
          let drawHeight = enemy.height * 1.8;
          
          // ✅ РАЗНАЯ КОРРЕКТИРОВКА ВЫСОТЫ ДЛЯ РАЗНЫХ ТИПОВ БЫСТРЫХ ВРАГОВ
          let adjustedX = enemy.x - (drawWidth - enemy.width) / 2;
          let adjustedY;
          
          if (enemy.type === "fast") {
              // Враги на ЗЕМЛЕ - корректировка чтобы не проваливались
              adjustedY = enemy.y - (drawHeight - enemy.height) - 5;
          } else {
              // Враги на ПЛАТФОРМАХ - минимальная корректировка
              adjustedY = enemy.y - (drawHeight - enemy.height) - 0;
          }
          
          // Отрисовка с анимацией
          ctx.save();
          if (enemy.direction === 1) {
              // Враг движется ВПРАВО - отражаем по центру (смотрит влево)
              ctx.translate(adjustedX + drawWidth / 2, adjustedY);
              ctx.scale(-1, 1);
              ctx.drawImage(currentFrame, -drawWidth / 2, 0, drawWidth, drawHeight);
          } else {
              // Враг движется ВЛЕВО - рисуем как есть (смотрит вправо)
              ctx.drawImage(currentFrame, adjustedX, adjustedY, drawWidth, drawHeight);
          }
          ctx.restore();
          
          // Визуальный эффект застревания для быстрых врагов на 6 уровне
          if (enemy.type === "fastPlatform" && enemy.isStuck) {
              ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
              ctx.fillRect(enemy.x - 5, enemy.y - 5, enemy.width + 10, enemy.height + 10);
          }
      }
      // ВРАГИ НА ПЛАТФОРМАХ (STANDARD2)
      else if ((enemy.type === "platform" || enemy.type === "fastPlatform") && enemyFrames.standard2.length > 0) {
        const anim = enemyAnimations[enemies.indexOf(enemy)];
        const frameIndex = anim ? anim.currentFrame : 0;
        const currentFrame = enemyFrames.standard2[frameIndex];
        
        // ПЕРСОНАЛЬНОЕ УВЕЛИЧЕНИЕ ДЛЯ ВРАГОВ
        let drawWidth = enemy.width * 1.7;
        let drawHeight = enemy.height * 2.0;
        
        // КОРРЕКТИРОВКА ПОЗИЦИИ - ТОЛЬКО ДЛЯ PLATFORM ВРАГОВ (МЕНЬШЕЕ СМЕЩЕНИЕ)
        let adjustedX = enemy.x - (drawWidth - enemy.width) / 2;
        let adjustedY = enemy.y - (drawHeight - enemy.height) - 0;
        
        // Отрисовка с анимацией
        ctx.save();
        if (enemy.direction === 1) {
          // Враг движется ВПРАВО - отражаем по центру (смотрит влево)
          ctx.translate(adjustedX + drawWidth / 2, adjustedY);
          ctx.scale(-1, 1);
          ctx.drawImage(currentFrame, -drawWidth / 2, 0, drawWidth, drawHeight);
        } else {
          // Враг движется ВЛЕВО - рисуем как есть (смотрит вправо)
          ctx.drawImage(currentFrame, adjustedX, adjustedY, drawWidth, drawHeight);
        }
        ctx.restore();
      }
      // НАЗЕМНЫЕ ВРАГИ (STANDARD1)
      else if (enemy.enemyType === "standard1" && enemyFrames.standard1.length > 0) {
        const anim = enemyAnimations[enemies.indexOf(enemy)];
        const frameIndex = anim ? anim.currentFrame : 0;
        const currentFrame = enemyFrames.standard1[frameIndex];
        
        // ПЕРСОНАЛЬНОЕ УВЕЛИЧЕНИЕ ДЛЯ ВРАГОВ
        let drawWidth = enemy.width * 1.5;
        let drawHeight = enemy.height * 2.0;
        
        // КОРРЕКТИРОВКА ПОЗИЦИИ - ДЛЯ НАЗЕМНЫХ ВРАГОВ ОСТАВЛЯЕМ ПРЕЖНЕЕ СМЕЩЕНИЕ
        let adjustedX = enemy.x - (drawWidth - enemy.width) / 2;
        let adjustedY = enemy.y - (drawHeight - enemy.height) - 20;
        
        // Отрисовка с анимацией - ИСПРАВЛЕННАЯ ЛОГИКА ОТРАЖЕНИЯ (ПРОТИВОПОЛОЖНЫЕ СТОРОНЫ)
        ctx.save();
        if (enemy.direction === 1) {
          // Враг движется ВПРАВО - отражаем по центру (смотрит влево)
          ctx.translate(adjustedX + drawWidth / 2, adjustedY);
          ctx.scale(-1, 1);
          ctx.drawImage(currentFrame, -drawWidth / 2, 0, drawWidth, drawHeight);
        } else {
          // Враг движется ВЛЕВО - рисуем как есть (смотрит вправо)
          ctx.drawImage(currentFrame, adjustedX, adjustedY, drawWidth, drawHeight);
        }
        ctx.restore();
      }
      // СТАНДАРТНАЯ ОТРИСОВКА (ЗАПАСНОЙ ВАРИАНТ)
      else {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        ctx.fillStyle = "white";
        ctx.fillRect(enemy.x + 8, enemy.y + 15, 12, 12);
        ctx.fillRect(enemy.x + enemy.width - 20, enemy.y + 15, 12, 12);

        ctx.fillStyle = "black";
        ctx.fillRect(enemy.x + 11, enemy.y + 18, 6, 6);
        ctx.fillRect(enemy.x + enemy.width - 17, enemy.y + 18, 6, 6);
      }

      // Глаза для всех врагов (кроме бронированных, у которых глаза уже нарисованы)
      // И для врагов с анимацией, у которых глаза уже встроены в SVG
      if (enemy.type !== "armored" && enemy.enemyType !== "standard1" && enemy.enemyType !== "standard2" && enemy.type !== "jumping" && enemy.type !== "flying" && enemy.type !== "fast" && enemy.type !== "fastPlatform") {
        ctx.fillStyle = "white";
        ctx.fillRect(enemy.x + 8, enemy.y + 15, 12, 12);
        ctx.fillRect(enemy.x + enemy.width - 20, enemy.y + 15, 12, 12);

        ctx.fillStyle = enemy.type === "fast" ? "red" : "black";
        ctx.fillRect(enemy.x + 11, enemy.y + 18, 6, 6);
        ctx.fillRect(enemy.x + enemy.width - 17, enemy.y + 18, 6, 6);
      }

      // Индикатор для быстрых врагов
      if (enemy.type === "fast" && enemy.speed > 5) {
        ctx.fillStyle = "red";
        ctx.fillRect(enemy.x + enemy.width / 2 - 2, enemy.y - 5, 4, 4);
      }

      // Визуальный эффект застревания для быстрых врагов на 6 уровне
      if (enemy.type === "fastPlatform" && enemy.isStuck) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(enemy.x - 5, enemy.y - 5, enemy.width + 10, enemy.height + 10);
      }
    }
  }

  // ✅ ДОБАВЛЯЕМ: Отрисовка анимаций смерти врагов
  drawDeathAnimations();

  // Рисование флага (только если собрано достаточно монет)
  if (coinsCollectedInLevel >= coinsToWin) {
    if (flag.x < camera.x + camera.width && flag.x + flag.width > camera.x) {
      // Используем текстуру активного флага
      if (svgImages.flag) {
        ctx.drawImage(svgImages.flag, flag.x, flag.y, flag.width, flag.height);
      } else {
        // Запасной вариант
        ctx.fillStyle = flag.color;
        ctx.fillRect(flag.x, flag.y, 8, flag.height);
      }

      // Анимация частиц вокруг флага
      ctx.fillStyle = "#ff6b6b";
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
      // Используем текстуру неактивного флага
      if (svgImages.flagDisabled) {
        ctx.drawImage(
          svgImages.flagDisabled,
          flag.x,
          flag.y,
          flag.width,
          flag.height,
        );
      } else {
        // Запасной вариант
        ctx.fillStyle = "#666666";
        ctx.fillRect(flag.x, flag.y, 8, flag.height);
      }
    }
  }

  // Рисование ниндзи из SVG частей
  drawCharacter();

  // Восстанавливаем состояние контекста
  ctx.restore();

  // ✅ ИСПРАВЛЕННАЯ ОТРИСОВКА HP С СОХРАНЕНИЕМ ПРОПОРЦИЙ
  drawHpBar();
}

function createGroundCoins() {
  const groundCoins = [];
  const coinCount = 10 + level * 2;

  for (let i = 0; i < coinCount; i++) {
    const x = 300 + Math.random() * (flag.x - 900);

    groundCoins.push({
      x: x,
      y: levelHeight - 60,
      width: 30,
      height: 30,
      color: "#ffcc00",
      collected: false,
      platformId: -1,
      originalY: levelHeight - 60,
      bounceOffset: 0,
      bounceSpeed: 0.08 + Math.random() * 0.04,
      bouncePhase: Math.random() * Math.PI * 2,
      isHighCoin: false,
      // ✅ ДОБАВЛЯЕМ АНИМАЦИОННЫЕ СВОЙСТВА
      animationTimer: 0,
      currentFrame: Math.random() > 0.5 ? 0 : 1, // Случайный начальный кадр
    });
  }

  return groundCoins;
}

// Обработка получения урона с анимацией HP
function takeDamage() {
    if (isInvulnerable) return;

    // Уменьшаем HP
    hpSystem.currentHp -= 1;

    // ✅ ЗАПУСКАЕМ ОДНОРАЗОВУЮ АНИМАЦИЮ УРОНА
    damageAnimationActive = true;
    damageAnimationTimer = DAMAGE_ANIMATION_DURATION;
    
    // Устанавливаем анимацию damaged для немедленного отображения
    currentAnimation = "damaged";
    animationFrame = 0;
    animationTimer = 0;

    playSound("player_damage", 0.7);

    // Запускаем анимацию HP
    hpSystem.isAnimating = true;
    hpSystem.isLevelUp = false;

    // Включаем неуязвимость (отдельно от анимации)
    isInvulnerable = true;
    invulnerabilityTimer = INVULNERABILITY_DURATION;

    if (hpSystem.currentHp <= 0) {
        gameState = "gameOver";
        gameOverScreen.classList.remove("hidden");
        finalScoreElement.textContent = coins;

        stopMusic();
        playMusic("game_over", false, 0.8);
        playSound("player_death", 0.8);
    }
    
    console.log("Ниндзя получил урон! Запущена одноразовая анимация повреждения");
}

// ✅ ФУНКЦИИ ПРИНУДИТЕЛЬНОГО ПОВЫШЕНИЯ HP (ТЕСТОВЫЕ)
function forceHpLevelUpTo4() {
    // ✅ ПОВЫШЕНИЕ ДО 4 HP (автоматически на 5 уровне)
    const oldMaxHp = hpSystem.maxHp;
    const oldCurrentHp = hpSystem.currentHp;
    
    hpSystem.maxHp = 4;
    hpSystem.currentHp = 4;
    hpSystem.displayHp = 4;
    hpSystem.targetHp = 4;
    hpSystem.isLevelUp = true;
    hpSystem.isAnimating = true;
    hpSystem.previousMaxHp = oldMaxHp;
    
    playSound("ui_click", 0.6);
    
    // ✅ СОХРАНЯЕМ ИГРУ
    saveGame();
}

function forceHpLevelUpTo5() {
    // ✅ ПОВЫШЕНИЕ ДО 5 HP (автоматически на 8 уровне)
    const oldMaxHp = hpSystem.maxHp;
    const oldCurrentHp = hpSystem.currentHp;
    
    hpSystem.maxHp = 5;
    hpSystem.currentHp = 5;
    hpSystem.displayHp = 5;
    hpSystem.targetHp = 5;
    hpSystem.isLevelUp = true;
    hpSystem.isAnimating = true;
    hpSystem.previousMaxHp = oldMaxHp;
    
    playSound("ui_click", 0.6);
    
    // ✅ СОХРАНЯЕМ ИГРУ
    saveGame();
}

function forceHpLevelUpTo6() {
    // ✅ ПОВЫШЕНИЕ ДО 6 HP (тестовое, не используется в автоматическом режиме)
    const oldMaxHp = hpSystem.maxHp;
    const oldCurrentHp = hpSystem.currentHp;
    
    hpSystem.maxHp = 6;
    hpSystem.currentHp = 6;
    hpSystem.displayHp = 6;
    hpSystem.targetHp = 6;
    hpSystem.isLevelUp = true;
    hpSystem.isAnimating = true;
    hpSystem.previousMaxHp = oldMaxHp;
    
    playSound("ui_click", 0.6);
    
    // ✅ СОХРАНЯЕМ ИГРУ
    saveGame();
}

// ✅ ФУНКЦИЯ: Автоматическое повышение HP по уровням
function updateHpByLevel() {
    // Определяем максимальное HP для текущего уровня
    let newMaxHp;
    
    if (level <= 4) {
        // Уровни 1-4: 3 HP
        newMaxHp = 3;
    } else if (level <= 7) {
        // Уровни 5-7: 4 HP
        newMaxHp = 4;
    } else {
        // Уровни 8+: 5 HP
        newMaxHp = 5;
    }
    
    // Если новое максимальное HP больше текущего
    if (newMaxHp > hpSystem.maxHp) {
        const oldMaxHp = hpSystem.maxHp;
        
        // Обновляем HP систему
        hpSystem.maxHp = newMaxHp;
        hpSystem.currentHp = newMaxHp; // Полностью восстанавливаем при повышении
        hpSystem.displayHp = newMaxHp;
        hpSystem.targetHp = newMaxHp;
        hpSystem.isLevelUp = true;
        hpSystem.isAnimating = true;
        
        // Сохраняем предыдущее максимальное HP для анимации
        hpSystem.previousMaxHp = oldMaxHp;
        
        // Проигрываем звук повышения HP
        playSound("ui_click", 0.6);
        
        console.log(`✅ HP повышено с ${oldMaxHp} до ${newMaxHp} на уровне ${level}`);
        
        // ✅ СОХРАНЯЕМ ИГРУ ПРИ ПОВЫШЕНИИ HP
        saveGame();
    }
}

// ✅ ФУНКЦИЯ: Проверка и повышение HP в начале уровня
function checkAndUpgradeHpAtLevelStart() {
    // Сохраняем текущий уровень для проверки
    const lastSavedLevel = gameSave ? gameSave.level : 1;
    
    // Если перешли на новый уровень
    if (level > lastSavedLevel) {
        // Проверяем специальные переходы:
        if (level === 5) {
            // Переход на 5 уровень → повышаем до 4 HP
            console.log("🎮 Переход на уровень 5 - повышение HP до 4");
            forceHpLevelUpTo4();
        } else if (level === 8) {
            // Переход на 8 уровень → повышаем до 5 HP  
            console.log("🎮 Переход на уровень 8 - повышение HP до 5");
            forceHpLevelUpTo5();
        } else if (level === 10) {
            // Переход на 10 уровень → повышаем до 6 HP (если нужно)
            console.log("🎮 Переход на уровень 10 - повышение HP до 6");
            forceHpLevelUpTo6();
        }
        
        // Всегда проверяем автоматическое повышение по уровню
        updateHpByLevel();
    }
}

// Обновление системы урона
function updateDamageSystem() {
  // ✅ АНИМАЦИЯ УРОНА УЖЕ ОБРАБАТЫВАЕТСЯ В updatePlayerAnimation()
  // Здесь только система неуязвимости

  if (isInvulnerable) {
    invulnerabilityTimer--;
    
    // Мигание при неуязвимости
    damageFlashTimer = (invulnerabilityTimer % 15 < 8) ? 5 : 0;

    if (invulnerabilityTimer <= 0) {
      isInvulnerable = false;
      damageFlashTimer = 0;
    }
  }
}

// Обновление анимации персонажа
function updatePlayerAnimation() {
  // ✅ АНИМАЦИЯ УРОНА - ПРОИГРЫВАЕТСЯ 1 РАЗ
  if (damageAnimationActive) {
    currentAnimation = "damaged";
    animationFrame = 0;
    animationTimer = 0;
    
    // Уменьшаем таймер анимации
    damageAnimationTimer--;
    if (damageAnimationTimer <= 0) {
      damageAnimationActive = false;
      // После завершения анимации урона возвращаемся к обычной анимации
      if (!player.grounded) {
        currentAnimation = "fall";
      } else if (keys["ArrowLeft"] || keys["ArrowRight"] || keys["KeyA"] || keys["KeyD"]) {
        currentAnimation = "run";
      } else {
        currentAnimation = "idle";
      }
    }
    
    return; // Прерываем - не показываем другие анимации
  }

  // АТАКА - ВТОРОЙ ПО ПРИОРИТЕТУ
  if (isAttacking) {
    if (!player.grounded) {
      // Удар в прыжке
      currentAnimation = "jump_attack";
    } else {
      // Удар на земле
      currentAnimation = "attack";
    }
    animationFrame = 0;
    animationTimer = 0;
    return;
  }

  // Проверяем движение с клавиатуры
  const isMovingRight = keys["ArrowRight"] || keys["KeyD"];
  const isMovingLeft = keys["ArrowLeft"] || keys["KeyA"];

  let isGamepadMoving = false;
  let gamepadDirection = 0;

  if (isGamepadConnected && gamepad) {
    const leftStickX = gamepad.axes[0];

    // ДОБАВЛЯЕМ ПРОВЕРКУ D-PAD (кнопки 12-15)
    const dpadLeft = gamepad.buttons[14]?.pressed;
    const dpadRight = gamepad.buttons[15]?.pressed;

    // Комбинируем ввод с левого стика и D-Pad
    let horizontalInput = leftStickX;
    if (dpadLeft) horizontalInput = -1;
    if (dpadRight) horizontalInput = 1;

    if (Math.abs(horizontalInput) > 0.15) {
      isGamepadMoving = true;
      gamepadDirection = horizontalInput > 0 ? 1 : -1;
    }
  }

  // Объединяем ввод с клавиатуры и геймпада
  const isMoving =
    (isMovingRight || isMovingLeft || isGamepadMoving) && player.grounded;

  // 1. ПАДЕНИЕ
  if (!player.grounded && player.velY > 0) {
    currentAnimation = "fall";
    animationFrame = 0;
    animationTimer = 0;
  }
  // 2. ПРЫЖОК
  else if (!player.grounded && player.velY <= 0) {
    currentAnimation = "jump";

    if (player.velY < -5) {
      animationFrame = 0; // взлет
    } else {
      animationFrame = 1; // пик прыжка (колобок)
    }
    animationTimer = 0;
  }
  // 3. БЕГ
  else if (isMoving) {
    currentAnimation = "run";

    // Обновляем направление в зависимости от ввода
    if (isMovingRight || (isGamepadMoving && gamepadDirection > 0)) {
      player.direction = 1;
      isFacingRight = true;
    } else if (isMovingLeft || (isGamepadMoving && gamepadDirection < 0)) {
      player.direction = -1;
      isFacingRight = false;
    }

    // Обновляем анимацию бега
    animationTimer += deltaTime;
    if (animationTimer >= ANIMATION_SPEED) {
      animationTimer = 0;
      animationFrame = (animationFrame + 1) % characterFrames.run.length;
    }
  }
  // 4. ПОКОЙ
  else {
    currentAnimation = "idle";
    animationFrame = 0;
    animationTimer = 0;
  }
}

// НОВАЯ ФУНКЦИЯ ЗАПУСКА АТАКИ
function startAttack() {
    // Проверяем состояние атаки
    if (attackState !== "ready") return;
    
    // Начинаем атаку
    attackState = "attacking";
    isAttacking = true;
    attackCooldown = ATTACK_DURATION;

    player.velX = 0;

    // СОЗДАЕМ ХИТБОКС АТАКИ
    updateAttackHitbox();
    attackHitbox.active = true;

    playSound("enemy_attack", 0.7);
}

// ФУНКЦИЯ ОБНОВЛЕНИЯ ХИТБОКСА АТАКИ
function updateAttackHitbox() {
    // ✅ НОВЫЕ РАЗМЕРЫ ХИТБОКСА ДЛЯ УВЕЛИЧЕННОЙ АНИМАЦИИ АТАКИ
    const attackRange = 100; // ⬅ УВЕЛИЧИВАЕМ с 40 до 100 (меч длиннее)
    const attackWidth = 60;  // ⬅ Ширина зоны поражения
    const attackHeight = 50; // ⬅ Высота зоны поражения
    
    // ✅ УЧИТЫВАЕМ НОВЫЕ РАЗМЕРЫ АНИМАЦИИ (drawWidth = 213px)
    const attackAnimationWidth = 213; // Из console.log
    const extraWidth = attackAnimationWidth - player.width; // Дополнительная ширина анимации
    
    // ✅ КОРРЕКТИРОВКА ПОЗИЦИИ ХИТБОКСА В ЗАВИСИМОСТИ ОТ НАПРАВЛЕНИЯ
    if (player.direction === 1) {
        // Атака вправо - хитбокс начинается справа от персонажа
        attackHitbox.x = player.x + player.width - (extraWidth / 2);
        attackHitbox.y = player.y + player.height / 2 - attackHeight / 2;
    } else {
        // Атака влево - хитбокс начинается слева от персонажа
        attackHitbox.x = player.x - attackRange + (extraWidth / 2);
        attackHitbox.y = player.y + player.height / 2 - attackHeight / 2;
    }
    
    attackHitbox.width = attackRange;
    attackHitbox.height = attackHeight;
}

// НОВАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ СИСТЕМЫ АТАКИ
function updateAttackSystem() {
  // Обновляем систему атаки только если не в режиме готовности
  if (attackState !== "ready") {
    attackCooldown--;
    
    // Переход между состояниями атаки
    if (attackState === "attacking" && attackCooldown <= 0) {
      // Завершилась анимация атаки, начинаем кулдаун
      attackState = "cooldown";
      isAttacking = false;
      attackHitbox.active = false; // ВЫКЛЮЧАЕМ ХИТБОКС
      attackCooldown = ATTACK_COOLDOWN;
    }
    else if (attackState === "cooldown" && attackCooldown <= 0) {
      // Кулдаун завершен, атака снова доступна
      attackState = "ready";
    }
  }
  
  // Восстанавливаем движение после атаки
  if (!isAttacking && attackState === "ready") {
    // ВОССТАНАВЛИВАЕМ ДВИЖЕНИЕ
    if (savedMovement.left) {
      player.velX = -player.speed;
      player.direction = -1;
    } else if (savedMovement.right) {
      player.velX = player.speed;
      player.direction = 1;
    }
    
    if (Math.abs(savedMovement.gamepadX) > 0.15) {
      player.velX = savedMovement.gamepadX * player.speed;
      player.direction = savedMovement.gamepadX > 0 ? 1 : -1;
    }
  }
}

// Обработка ввода с клавиатуры
function handleKeyboardInput() {
  // Сохраняем состояние движения ДО проверки атаки
  savedMovement.left = keys["ArrowLeft"] || keys["KeyA"];
  savedMovement.right = keys["ArrowRight"] || keys["KeyD"];

  // ЕСЛИ ПЕРСОНАЖ АТАКУЕТ - БЛОКИРУЕМ ДВИЖЕНИЕ
  if (isAttacking) {
    player.velX = 0;
    return; // Прерываем обработку движения
  }

  // Определяем направление (только если не атакуем)
  if (savedMovement.left) {
    player.velX = -player.speed;
    player.direction = -1;
  } else if (savedMovement.right) {
    player.velX = player.speed;
    player.direction = 1;
  } else {
    player.velX = 0;
  }

  // Прыжок с клавиатуры (работает даже во время атаки)
  if ((keys["ArrowUp"] || keys["KeyW"] || keys["Space"]) && player.grounded) {
    player.velY = -18;
    player.jumping = true;
    player.grounded = false;
    playSound("jump", 0.6);
  }

  // Способность спускаться по платформам
  downKeyPressed = keys["ArrowDown"] || keys["KeyS"];

  // УЛУЧШЕННАЯ ОБРАБОТКА АТАКИ - ЗАЩИТА ОТ ЗАЖАТИЯ
  const currentAttackPressed = keys["KeyX"] || keys["KeyF"];
  
  // Атака доступна только в состоянии "ready" и при НОВОМ нажатии
  if (currentAttackPressed && attackState === "ready" && !attackKeyPressed) {
    startAttack();
    attackKeyPressed = true;
  } else if (!currentAttackPressed) {
    // Сбрасываем флаг когда кнопка отпущена
    attackKeyPressed = false;
  }
}

// Обработка ввода с геймпада
function handleGamepadInput() {
  if (!isGamepadConnected || !gamepad) return;

  // Сохраняем состояние движения геймпада
  const leftStickX = gamepad.axes[0];
  savedMovement.gamepadX = leftStickX;

  // ОБРАБОТКА D-PAD (кнопки 12-15)
  const dpadUp = gamepad.buttons[12]?.pressed;
  const dpadDown = gamepad.buttons[13]?.pressed;
  const dpadLeft = gamepad.buttons[14]?.pressed;
  const dpadRight = gamepad.buttons[15]?.pressed;

  // Комбинируем ввод с левого стика и D-Pad
  let horizontalInput = leftStickX;
  if (dpadLeft) horizontalInput = -1;
  if (dpadRight) horizontalInput = 1;

  // ЕСЛИ ПЕРСОНАЖ АТАКУЕТ - БЛОКИРУЕМ ДВИЖЕНИЕ
  if (isAttacking) {
    player.velX = 0;
  } else {
    // ДВИЖЕНИЕ (только если не атакуем)
    if (Math.abs(horizontalInput) > 0.15) {
      player.velX = horizontalInput * player.speed;
      player.direction = horizontalInput > 0 ? 1 : -1;

      if (player.grounded && Math.random() > 0.7) {
        playSound("move", 0.3, 1.0 + Math.random() * 0.2);
      }
    } else {
      player.velX = 0;
    }
  }

  // ПРЫЖОК С ГЕЙМПАДА
  const jumpPressed = gamepad.buttons[0].pressed || dpadUp;
  if (jumpPressed && player.grounded && !player.jumping) {
    player.velY = -18;
    player.jumping = true;
    player.grounded = false;
    playSound("jump", 0.6);

    setTimeout(() => {
      player.jumping = false;
    }, 300);
  }

  // Альтернативные кнопки для прыжка
  if (gamepad.buttons[7].pressed && player.grounded && !player.jumping) {
    player.velY = -18;
    player.jumping = true;
    player.grounded = false;
    playSound("jump", 0.6);

    setTimeout(() => {
      player.jumping = false;
    }, 300);
  }

  // СПУСК ПО ПЛАТФОРМАМ
  const leftStickY = gamepad.axes[1];
  downKeyPressed = gamepad.buttons[13]?.pressed || leftStickY > 0.5;

  // УЛУЧШЕННАЯ ОБРАБОТКА АТАКИ С ГЕЙМПАДА - ЗАЩИТА ОТ ЗАЖАТИЯ
  const currentGamepadAttackPressed = gamepad.buttons[2].pressed || gamepad.buttons[5].pressed;
  
  // Атака доступна только в состоянии "ready" и при НОВОМ нажатии
  if (currentGamepadAttackPressed && attackState === "ready" && !gamepadAttackPressed) {
    startAttack();
    gamepadAttackPressed = true;
  } else if (!currentGamepadAttackPressed) {
    // Сбрасываем флаг когда кнопка отпущена
    gamepadAttackPressed = false;
  }
}

// ФУНКЦИЯ ПРОВЕРКИ СТОЛКНОВЕНИЯ С ВРАГАМИ ПРИ АТАКЕ
function checkAttackCollisions() {
  if (!attackHitbox.active) return;
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    
    if (
      attackHitbox.x < enemy.x + enemy.width &&
      attackHitbox.x + attackHitbox.width > enemy.x &&
      attackHitbox.y < enemy.y + enemy.height &&
      attackHitbox.y + attackHitbox.height > enemy.y
    ) {
      // ✅ ЗАМЕНЯЕМ НА НОВУЮ ФУНКЦИЮ:
      // enemies.splice(i, 1);
      startEnemyDeathAnimation(enemy, i);
      
      // Небольшой отскок при убийстве атакой
      if (!player.grounded) {
        player.velY = -6;
      }

      // Разное количество монет за разных врагов
      let coinValue = 1;
      if (enemy.type === "armored") coinValue = 3;
      else if (enemy.type === "fast" || enemy.type === "fastPlatform")
        coinValue = 2;

      coins += coinValue;
      coinsCollectedInLevel += coinValue;
      coinCountElement.textContent = coins;
      updateLevelGoalDisplay();

      playSound("enemy_defeat", 0.8);
      playSound("enemy_coin", 0.4);
    }
  }
}

// Обновление игровой логики
function update() {
  // Вычисляем deltaTime
  const currentTime = performance.now();
  deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;

  if (gameState === "preload" || gameState === "menu") {
    return;
  }
  
  updateSaveIndicator();
  // Обработка паузы - добавляем сенсорную кнопку паузы если нужно
  let pausePressed = keys["Escape"] || keys["KeyP"];
  // Проверяем паузу на геймпаде
  if (isGamepadConnected && gamepad && gamepad.buttons[9].pressed) {
    pausePressed = true;
  }
  if (pausePressed && !pauseKeyPressed) {
    // Переключаем состояние паузы
    if (gameState === "playing") {
      gameState = "paused";
      pauseScreen.classList.remove("hidden");
      // Обновляем информацию в меню паузы
      pauseCoinsElement.textContent = coinsCollectedInLevel;
      pauseGoalElement.textContent = coinsToWin;
      console.log("Игра на паузе");
      playSound("ui_pause", 0.5);
      updateMusicVolume();
    } else if (gameState === "paused") {
      gameState = "playing";
      pauseScreen.classList.add("hidden");
      console.log("Игра продолжена");
      playSound("ui_click", 0.4);
      updateMusicVolume();
    }
    pauseKeyPressed = true;
  }
  // Сбрасываем флаг паузы, когда все клавиши/кнопки отпущены
  const keyboardPauseReleased = !keys["Escape"] && !keys["KeyP"];
  const gamepadPauseReleased =
    !isGamepadConnected || !gamepad || !gamepad.buttons[9].pressed;
  if (keyboardPauseReleased && gamepadPauseReleased) {
    pauseKeyPressed = false;
  }
  // Обновление системы урона (всегда, даже в паузе для анимации)
  updateDamageSystem();

  // ✅ ОБНОВЛЯЕМ АНИМАЦИЮ HP
  updateHpAnimation();
  
  if (gameState !== "playing") return;

  // Обновление анимации персонажа (использует deltaTime)
  updatePlayerAnimation();

  // Обновление времени анимации (декоративное, можно оставить)
  animationTime += 0.1;

  // Обновление анимации монет
  updateCoinAnimations();

  // Обновление анимации врагов
  updateEnemyAnimations();

  // Обновление врагов
  updateEnemies();

  // ✅ ДОБАВИТЬ: Обновление анимаций смерти
  updateDeathAnimations();

  // ОБНОВЛЕНИЕ СИСТЕМЫ АТАКИ
  updateAttackSystem();

  // Обновление хитбокса атаки если атака активна
  if (isAttacking) {
    updateAttackHitbox();
  }

  // ПРОВЕРКА СТОЛКНОВЕНИЙ АТАКИ С ВРАГАМИ
  checkAttackCollisions();

  // Обновление камеры
  updateCamera();

  // Применение гравитации
  player.velY += gravity;

  // Применение трения при движении по земле (только если не атакуем)
  if (player.grounded && !isAttacking) {
    player.velX *= friction;
  }

  // Обработка ввода с клавиатуры и геймпада
  handleKeyboardInput();
  handleGamepadInput();

  // Обновление позиции игрока
  player.x += player.velX;
  player.y += player.velY;

  // Звук приземления
  if (!player.lastGroundedState && player.grounded) {
    playSound("land", 0.4);
  }
  player.lastGroundedState = player.grounded;

  // Ограничения уровня
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > levelWidth)
    player.x = levelWidth - player.width;
  if (player.y > levelHeight) {
    player.y = 800;
    player.x = 100;
    takeDamage();
  }

  // Сброс grounded статуса
  player.grounded = false;

  // Проверка столкновений с платформами
  for (let platform of platforms) {
    if (
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.y + player.height > platform.y &&
      player.y + player.height < platform.y + platform.height &&
      player.velY > 0
    ) {
      if (downKeyPressed && platform.y < levelHeight - 50) {
        continue;
      }

      player.y = platform.y - player.height;
      player.velY = 0;
      player.grounded = true;
      player.jumping = false;
    }
  }

  // Проверка сбора монет
  for (let coin of coinsList) {
    if (
      !coin.collected &&
      player.x < coin.x + coin.width &&
      player.x + player.width > coin.x &&
      player.y < coin.originalY + coin.bounceOffset + coin.height &&
      player.y + player.height > coin.originalY + coin.bounceOffset
    ) {
      coin.collected = true;

      // НОВАЯ ЛОГИКА: серебряные монеты дают 3 монеты
      const coinValue = coin.isSilverCoin ? 3 : 1;
      coins += coinValue;
      coinsCollectedInLevel += coinValue;

      coinCountElement.textContent = coins;
      updateLevelGoalDisplay();

      if (coin.isSilverCoin) {
        playSound("coin_2", 0.8); // Более весомый звук для серебряной монеты
      } else if (coin.isHighCoin) {
        playSound("coin_2", 0.6);
      } else {
        playSound("coin_1", 0.5);
      }
    }
  }

  // Проверка столкновения с врагами (для получения урона)
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      // НОВАЯ ЛОГИКА: атака убивает всех врагов
      if (isAttacking) {
        // ✅ ТАКЖЕ ЗАМЕНИТЬ В ДРУГОМ МЕСТЕ:
        // enemies.splice(i, 1); 
        startEnemyDeathAnimation(enemy, i);

        // Небольшой отскок при убийстве атакой
        if (!player.grounded) {
          player.velY = -6;
        }

        // Разное количество монет за разных врагов
        let coinValue = 1;
        if (enemy.type === "armored") coinValue = 3;
        else if (enemy.type === "fast" || enemy.type === "fastPlatform")
          coinValue = 2;

        coins += coinValue;
        coinsCollectedInLevel += coinValue;
        coinCountElement.textContent = coins;
        updateLevelGoalDisplay();

        playSound("enemy_defeat", 0.8);
        playSound("enemy_coin", 0.4);
        continue; // Пропускаем остальную логику для этого врага
      }

      // Старая логика прыжка на врага (остается как запасной вариант)
      if (
        player.velY > 0 &&
        player.y + player.height < enemy.y + enemy.height / 2 &&
        !enemy.isArmored
      ) {
        // ✅ ТАКЖЕ ЗАМЕНИТЬ В ДРУГОМ МЕСТЕ:
        // enemies.splice(i, 1); 
        startEnemyDeathAnimation(enemy, i);
        player.velY = -12;

        coins += 2;
        coinsCollectedInLevel += 2;
        coinCountElement.textContent = coins;
        updateLevelGoalDisplay();

        playSound("jump_hit", 0.7);
        playSound("enemy_defeat", 0.8);
        playSound("enemy_coin", 0.4);
      }
      // Бронированные враги при прыжке на них - отскакиваем без убийства
      else if (
        player.velY > 0 &&
        player.y + player.height < enemy.y + enemy.height / 2 &&
        enemy.isArmored
      ) {
        player.velY = -10;
        playSound("jump_hit", 0.5);
      } else if (!isInvulnerable) {
        playSound("enemy_attack", 0.6);
        takeDamage();
      }
    }
  }

  // Проверка достижения флага
  if (
    coinsCollectedInLevel >= coinsToWin &&
    player.x < flag.x + flag.width &&
    player.x + player.width > flag.x &&
    player.y < flag.y + flag.height &&
    player.y + player.height > flag.y
  ) {
    gameState = "levelComplete";
    levelCompleteScreen.classList.remove("hidden");
    levelCoinsElement.textContent = coinsCollectedInLevel;

    stopMusic();
    playMusic("level_complete", false, 0.8);
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
  
  // ✅ ТЕСТОВЫЕ КЛАВИШИ ДЛЯ ПОВЫШЕНИЯ HP
  if (e.code === "KeyT") {
      forceHpLevelUpTo4();      // T - 4 HP
  }
  if (e.code === "KeyY") {
      forceHpLevelUpTo5();   // Y - 5 HP
  }
  if (e.code === "KeyU") {
      forceHpLevelUpTo6();   // U - 6 HP
  }
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
      gamepadStatusElement.className = "gamepad-status connected";
      return;
    }
  }

  isGamepadConnected = false;
  gamepad = null;
  gamepadStatusElement.textContent = "Геймпад не подключен!";
  gamepadStatusElement.className = "gamepad-status disconnected";
}

// Обработчики изменения громкости
if (musicVolumeSlider) {
  musicVolumeSlider.addEventListener("input", (e) => {
    musicVolume = parseFloat(e.target.value);
    updateMusicVolume();
  });
}

if (sfxVolumeSlider) {
  sfxVolumeSlider.addEventListener("input", (e) => {
    sfxVolume = parseFloat(e.target.value);
    updateSFXVolume();
  });
}

// ОБНОВЛЕННЫЙ ОБРАБОТЧИК КНОПКИ "НАЧАТЬ ИГРУ" С ЗАЩИТОЙ ОТ БЫСТРЫХ НАЖАТИЙ
startButton.addEventListener("click", async () => {
  // Защита от повторного нажатия
  if (isGameLoading) return;
  isGameLoading = true;

  // СБРОС СОХРАНЕНИЯ ПРИ НОВОЙ ИГРЕ
    localStorage.removeItem('ninjaPlatformerSave');
    gameSave = null;
    updateContinueButton();

  // Показываем индикатор загрузки
  const startButtonText = document.getElementById("startButtonText");
  const startButtonLoader = document.getElementById("startButtonLoader");

  if (startButtonText) startButtonText.textContent = "Загрузка...";
  if (startButtonLoader) startButtonLoader.classList.remove("hidden");

  // Блокируем кнопку
  startButton.disabled = true;

  try {
    console.log("Начинаем загрузку игры...");

    // Проверяем, загружены ли SVG
    if (Object.keys(svgImages).length === 0) {
      console.log("Загружаем SVG изображения...");
      await loadAllSVGs();
      console.log("SVG изображения загружены успешно");
    } else {
      console.log("SVG уже загружены, пропускаем загрузку");
    }

    // Небольшая задержка для плавности и чтобы пользователь увидел индикатор
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Переходим к игре
    startScreen.classList.add("hidden");
    gameState = "playing";

    // Останавливаем музыку меню и запускаем игровую
    stopMusic();
    if (level >= 1 && level <= 3) {
      playMusic("forest_theme", true, musicVolume);
    }

    playSound("ui_click", 0.5);
    init();

    console.log("Игра успешно запущена");
  } catch (error) {
    console.error("Ошибка загрузки игры:", error);
    // Восстанавливаем кнопку при ошибке
    resetStartButton();
    if (errorMessageElement) {
      errorMessageElement.textContent =
        "Ошибка загрузки. Попробуйте обновить страницу.";
      errorMessageElement.classList.remove("hidden");
    }
  }
});

// Перезапуск игры
restartButton.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  playSound("ui_click", 0.5);
  coins = 0;
  level = 1;
  player.speed = 8;
  gameState = "playing";
  // СКРЫВАЕМ UI ЭЛЕМЕНТЫ ПРИ РЕСТАРТЕ (ОНИ ПОКАЖУТСЯ В init())
  const uiOverlay = document.querySelector(".ui-overlay");
  const gamepadStatus = document.getElementById("gamepadStatus");
  if (uiOverlay) uiOverlay.classList.add("hidden");
  if (gamepadStatus) gamepadStatus.classList.add("hidden");
  // Останавливаем музыку и запускаем соответствующую уровню
  stopMusic();
  playMusic("forest_theme", true, musicVolume);

  init();
});

// Следующий уровень
nextLevelButton.addEventListener("click", () => {
  console.log("🎯 Кнопка 'Следующий уровень' нажата, текущий уровень:", level);
  
  // ✅ ЗАЩИТА ОТ ПОВТОРНЫХ НАЖАТИЙ
  if (gameState === "playing") {
    console.warn("⚠️ Игра уже в состоянии playing, игнорируем нажатие");
    return;
  }
  
  levelCompleteScreen.classList.add("hidden");
  playSound("ui_click", 0.5);
  
  // ✅ СОХРАНЯЕМ ТЕКУЩИЙ УРОВЕНЬ ПЕРЕД УВЕЛИЧЕНИЕМ
  const currentLevelBeforeIncrease = level;
  console.log(`📈 Повышение уровня с ${currentLevelBeforeIncrease} до ${currentLevelBeforeIncrease + 1}`);
  
  // Увеличиваем уровень
  level++;
  levelCountElement.textContent = level;
  gameState = "playing";

  // ✅ ПРИНУДИТЕЛЬНЫЙ СБРОС ЕСЛИ УРОВЕНЬ >= 8
  if (level >= 8) {
    console.log("⚠️ Принудительный сброс для уровня 8+");
    // Сбрасываем сложные вычисления и массивы
    platforms = [];
    enemies = [];
    dyingEnemies = [];
    coinsList = [];
    enemyAnimations = {};
    
    // Сбрасываем флаги атаки
    isAttacking = false;
    attackState = "ready";
    attackHitbox.active = false;
    
    // Уменьшаем сложность если нужно
    if (player.speed > 10) {
      player.speed = 10;
      console.log("⚡ Скорость игрока сброшена до 10");
    }
  }

  // ✅ ДОБАВЛЯЕМ: Проверяем повышение HP после перехода на новый уровень
  console.log(`🎮 Переход с уровня ${currentLevelBeforeIncrease} на уровень ${level}`);
  checkAndUpgradeHpAtLevelStart();

  // Останавливаем текущую музыку и запускаем соответствующую новому уровню
  stopMusic();

  // Воспроизводим музыку в зависимости от уровня
  if (level >= 1 && level <= 3) {
    playMusic("forest_theme", true, musicVolume);
  } else if (level >= 4 && level <= 6) {
    // Музыка для горных уровней
    playMusic("forest_theme", true, musicVolume); // временно
  } else {
    // Музыка для замка
    playMusic("forest_theme", true, musicVolume); // временно
  }

  // ✅ ВАЖНО: Инициализируем игру ПОСЛЕ проверки HP
  console.log("🔄 Запуск инициализации игры для уровня", level);
  try {
    init();
    console.log("✅ Инициализация завершена успешно");
  } catch (error) {
    console.error("❌ Ошибка при инициализации уровня", level, ":", error);
    
    // Если ошибка на 8+ уровне, пытаемся загрузить предыдущий
    if (level >= 8) {
      console.log("🔄 Попытка загрузки уровня 7...");
      level = 7;
      levelCountElement.textContent = level;
      
      try {
        init();
        console.log("✅ Уровень 7 загружен успешно");
      } catch (secondError) {
        console.error("❌ Ошибка даже на уровне 7:", secondError);
        // Возвращаем в меню
        gameState = "menu";
        startScreen.classList.remove("hidden");
        resetStartButton();
      }
    } else {
      // Возвращаем в меню для других уровней
      gameState = "menu";
      startScreen.classList.remove("hidden");
      resetStartButton();
    }
    return;
  }

  // Увеличиваем сложность
  player.speed += 0.3;
  console.log(`⚡ Скорость игрока увеличена до: ${player.speed}`);
  
  // ✅ ФИНАЛЬНАЯ ПРОВЕРКА
  console.log("✅ Переход на уровень", level, "завершен успешно");
  console.log("=== КОНЕЦ ОБРАБОТКИ КНОПКИ ===");
});

// Продолжение игры из паузы
resumeButton.addEventListener("click", () => {
  pauseScreen.classList.add("hidden");
  playSound("ui_click", 0.4);
  gameState = "playing";

  updateMusicVolume();
});

// Рестарт из паузы
restartPauseButton.addEventListener("click", () => {
  pauseScreen.classList.add("hidden");
  playSound("ui_click", 0.5);
  coins = 0;
  level = 1;
  player.speed = 8;
  gameState = "playing";
  // Скрываем UI элементы
  const uiOverlay = document.querySelector(".ui-overlay");
  const gamepadStatus = document.getElementById("gamepadStatus");
  if (uiOverlay) uiOverlay.classList.add("hidden");
  if (gamepadStatus) gamepadStatus.classList.add("hidden");
  // Останавливаем музыку и запускаем соответствующую уровню
  stopMusic();
  playMusic("forest_theme", true, musicVolume);

  init();
});

mainMenuButton.addEventListener("click", () => {
  pauseScreen.classList.add("hidden");
  playSound("ui_click", 0.5);

  // Скрываем игровые UI элементы
  const uiOverlay = document.querySelector(".ui-overlay");
  const gamepadStatus = document.getElementById("gamepadStatus");
  if (uiOverlay) uiOverlay.classList.add("hidden");
  if (gamepadStatus) gamepadStatus.classList.add("hidden");
  isGameLoading = false;
  // Показываем главное меню
  startScreen.classList.remove("hidden");
  gameState = "menu";
  resetStartButton();
  updateContinueButton();
  // Останавливаем игровую музыку и включаем музыку меню
  stopMusic();
  playMusic("main_menu_theme", true, musicVolume);
});

// Кнопка "Продолжить" в главном меню
const continueButton = document.getElementById('continueButton');
if (continueButton) {
    continueButton.addEventListener('click', () => {
        if (gameSave) {
            // Загружаем данные из сохранения
            coins = gameSave.coins;
            level = gameSave.level;
            player.speed = gameSave.playerSpeed;
            
            startScreen.classList.add("hidden");
            gameState = "playing";
            
            // Останавливаем музыку меню и запускаем игровую
            stopMusic();
            if (level >= 1 && level <= 3) {
                playMusic("forest_theme", true, musicVolume);
            }
            
            playSound("ui_click", 0.5);
            init();
            
            console.log("Продолжена сохраненная игра:", gameSave);
        }
    });
}

// Обновляем обработчик "Новой игры" для сброса сохранения
startButton.addEventListener("click", async () => {
    // Защита от повторного нажатия
    if (isGameLoading) return;
    isGameLoading = true;

    //  ДОБАВЛЯЕМ СБРОС СОХРАНЕНИЯ ПРИ НОВОЙ ИГРЕ
    localStorage.removeItem('ninjaPlatformerSave');
    gameSave = null;
    updateContinueButton();

    // Показываем индикатор загрузки
    const startButtonText = document.getElementById("startButtonText");
    const startButtonLoader = document.getElementById("startButtonLoader");

    if (startButtonText) startButtonText.textContent = "Загрузка...";
    if (startButtonLoader) startButtonLoader.classList.remove("hidden");

    // Блокируем кнопку
    startButton.disabled = true;

    try {
        console.log("Начинаем загрузку игры...");

        // Проверяем, загружены ли SVG
        if (Object.keys(svgImages).length === 0) {
            console.log("Загружаем SVG изображения...");
            await loadAllSVGs();
            console.log("SVG изображения загружены успешно");
        } else {
            console.log("SVG уже загружены, пропускаем загрузку");
        }

        // Небольшая задержка для плавности и чтобы пользователь увидел индикатор
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Переходим к игре
        startScreen.classList.add("hidden");
        gameState = "playing";

        // Останавливаем музыку меню и запускаем игровую
        stopMusic();
        if (level >= 1 && level <= 3) {
            playMusic("forest_theme", true, musicVolume);
        }

        playSound("ui_click", 0.5);
        init();

        console.log("Игра успешно запущена");
    } catch (error) {
        console.error("Ошибка загрузки игры:", error);
        // Восстанавливаем кнопку при ошибке
        resetStartButton();
        if (errorMessageElement) {
            errorMessageElement.textContent =
                "Ошибка загрузки. Попробуйте обновить страницу.";
            errorMessageElement.classList.remove("hidden");
        }
    }
});

// Слушатели событий клавиатуры
window.addEventListener("keydown", keyDownHandler);
window.addEventListener("keyup", keyUpHandler);

// Слушатели событий геймпада
window.addEventListener("gamepadconnected", (e) => {
  gamepad = e.gamepad;
  isGamepadConnected = true;
  gamepadStatusElement.textContent = `Геймпад подключен: ${gamepad.id}`;
  gamepadStatusElement.className = "gamepad-status connected";
});

window.addEventListener("gamepaddisconnected", (e) => {
  if (gamepad && gamepad.index === e.gamepad.index) {
    isGamepadConnected = false;
    gamepad = null;
    gamepadStatusElement.textContent = "Геймпад отключен";
    gamepadStatusElement.className = "gamepad-status disconnected";
  }
});

// Обработка изменения размера окна
window.addEventListener("resize", resizeCanvas);

// Постоянная проверка геймпада
setInterval(handleGamepad, 100);

// Запуск игры после загрузки страницы - загружаем ВСЕ ресурсы сразу
Promise.all([loadAllSVGs(), enableGameAudio(), loadEnemyAnimations(), loadCoinAnimations(), loadHpAnimations(), loadEnemyDeathAnimations()])
  .then(() => {
    console.log("Все ресурсы загружены, ожидаем пользователя...");
    updateContinueButton();
    // Только запускаем игровой цикл, но не инициализируем игру
    loadCharacterAnimations();
    gameLoop();
  })
  .catch((error) => {
    console.log("Запуск с заглушками из-за ошибки загрузки:", error);
    updateContinueButton();
    gameLoop();
  });
