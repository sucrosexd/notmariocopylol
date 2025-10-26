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
const livesCountElement = document.getElementById("livesCount");
const levelCountElement = document.getElementById("levelCount");
const finalScoreElement = document.getElementById("finalScore");
const levelCoinsElement = document.getElementById("levelCoins");
const pauseCoinsElement = document.getElementById("pauseCoins");
const pauseGoalElement = document.getElementById("pauseGoal");
const gamepadStatusElement = document.getElementById("gamepadStatus");

// Элементы управления громкостью
const musicVolumeSlider = document.getElementById("musicVolume");
const sfxVolumeSlider = document.getElementById("sfxVolume");

// Игровые переменные
let gameState = "preload"; // preload, menu, playing, paused, gameOver, levelComplete
let coins = 0;
let lives = 150;
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

// Анимационные переменные для кота
let isFacingRight = true;
let isAttacking = false;
let attackCooldown = 0;
let animationTime = 0;

// Система получения урона
let isInvulnerable = false;
let invulnerabilityTimer = 0;
const INVULNERABILITY_DURATION = 180; // 3 секунды при 60 FPS
let damageFlashTimer = 0;

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
    if (startButtonLoader) startButtonLoader.classList.add("hidden");
    if (startButton) startButton.disabled = false;
    isGameLoading = false;
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
      url: "./Assets/Audio/Music/MainTheme/main_menu_theme.mp3",
    },
    {
      name: "forest_theme", 
      url: "./Assets/Audio/Music/MainTheme/forest_theme.mp3",
    },
    {
      name: "level_complete",
      url: "./Assets/Audio/Music/Levels/level_complete.mp3",
    },
    { name: "game_over", url: "./Assets/Audio/Music/Events/game_over.mp3" },

    // SFX игрока
    { name: "jump", url: "./Assets/Audio/SFX/Player/jump.mp3" },
    { name: "jump_hit", url: "./Assets/Audio/SFX/Player/jump_hit.mp3" },
    { name: "land", url: "./Assets/Audio/SFX/Player/land.mp3" },
    {
      name: "player_damage",
      url: "./Assets/Audio/SFX/Player/player_damage.mp3",
    },
    { name: "player_death", url: "./Assets/Audio/SFX/Player/death.mp3" },

    // SFX врагов
    { name: "enemy_coin", url: "./Assets/Audio/SFX/Enemies/enemy_coin.mp3" },
    {
      name: "enemy_defeat",
      url: "./Assets/Audio/SFX/Enemies/enemy_defeat.mp3",
    },
    { name: "enemy_attack", url: "./Assets/Audio/SFX/Enemies/enemy_hit.mp3" }, // пока не используется

    // SFX окружения
    { name: "coin_1", url: "./Assets/Audio/SFX/Environment/coin_1.mp3" },
    { name: "coin_2", url: "./Assets/Audio/SFX/Environment/coin_2.mp3" },

    // SFX UI
    { name: "ui_click", url: "./Assets/Audio/SFX/UI/click.wav" },
    { name: "ui_pause", url: "./Assets/Audio/SFX/UI/pause.mp3" },
  ];

  await Promise.all(
    soundFiles.map((sound) => loadSound(sound.name, sound.url)),
  );
  console.log("Все звуки загружены");
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
  
  // Воспроизводим музыку меню
  if (audioEnabled) {
    playMusic("main_menu_theme", true, musicVolume);
  }
}

// ОБНОВЛЕННЫЙ ОБРАБОТЧИК PRELOAD SCREEN С ЗАЩИТОЙ ОТ ПОВТОРНЫХ НАЖАТИЙ
preloadScreen.addEventListener("click", async () => {
    // Блокируем повторные нажатия
    preloadScreen.style.pointerEvents = 'none';
    
    try {
        console.log("Загружаем аудио...");
        await enableGameAudio();
        console.log("Аудио загружено успешно");
        showMainMenu();
    } catch (error) {
        console.error("Ошибка загрузки:", error);
        // Разблокируем при ошибке
        preloadScreen.style.pointerEvents = 'auto';
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
  try {
    console.log("Начало загрузки SVG...");
    
    const loadPromises = [
      loadSVG("head", "./assets/images/characters/cat/head.svg"),
      loadSVG("body", "./assets/images/characters/cat/body.svg"),
      loadSVG(
        "leftShoulder",
        "./assets/images/characters/cat/left_shoulder.svg",
      ),
      loadSVG(
        "rightShoulder",
        "./assets/images/characters/cat/right_shoulder.svg",
      ),
      loadSVG(
        "leftForearm",
        "./assets/images/characters/cat/left_forearm.svg",
      ),
      loadSVG(
        "rightForearm",
        "./assets/images/characters/cat/right_forearm.svg",
      ),
      loadSVG("leftHip", "./assets/images/characters/cat/left_hip.svg"),
      loadSVG("rightHip", "./assets/images/characters/cat/right_hip.svg"),
      loadSVG("leftShin", "./assets/images/characters/cat/left_shin.svg"),
      loadSVG(
        "rightShin",
        "./assets/images/characters/cat/right_shin.svg",
      ),
      loadSVG("background", "./assets/images/backgrounds/forest/forest-1.png"),
      loadSVG("coin", "./assets/images/elements/coin.svg"),
      loadSVG("flag", "./assets/images/elements/flag.svg"),
      loadSVG("flagDisabled", "./assets/images/elements/flag-disabled.svg"),
    ];

    // Загружаем все параллельно с улучшенной обработкой ошибок
    await Promise.all(loadPromises);
    console.log("Все SVG изображения загружены успешно");
    return true;
  } catch (error) {
    console.error("Ошибка при загрузке SVG:", error);
    throw error;
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

  // Распределяем монеты равномерно по платформе
  const spacing = platform.width / (coinCount + 1);

  for (let i = 0; i < coinCount; i++) {
    const offsetX = spacing * (i + 1);

    const isHighCoin = Math.random() > 0.7;
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
      color: isHighCoin ? "#ff9900" : "#ffcc00",
      collected: false,
      platformId: platforms.length,
      originalY: platform.y - 50 + heightOffset,
      bounceOffset: 0,
      bounceSpeed: 0.08 + Math.random() * 0.04,
      bouncePhase: Math.random() * Math.PI * 2,
      isHighCoin: isHighCoin,
    });
  }

  return coins;
}

// Создание пути через уровень
function createLevelPath() {
  const pathPlatforms = [];
  const pathCoins = [];

  let currentX = 200;
  let currentY = 950;
  let totalCoins = 0;

  // УВЕЛИЧИВАЕМ количество платформ в основном пути
  while (currentX < flag.x - 300) {
    const platformType = Math.floor(Math.random() * 3);
    const templates = platformTemplates[platformType];
    const template = templates[Math.floor(Math.random() * templates.length)];

    const heightChange = Math.random() * 120 - 60;
    const gapSize = 80 + Math.random() * 60;

    currentY = Math.max(400, Math.min(1100, currentY + heightChange));

    // Проверяем, чтобы платформы не накладывались
    let overlaps = false;
    for (let platform of pathPlatforms) {
      if (
        Math.abs(currentX - platform.x) < 120 &&
        Math.abs(currentY - platform.y) < 40
      ) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      const platform = {
        x: currentX,
        y: currentY,
        width: template.width,
        height: template.height,
        color: template.color,
        hasCoins: Math.random() > 0.3,
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

      // УВЕЛИЧИВАЕМ шанс создания дополнительных платформ
      if (Math.random() > 0.7 && currentX < levelWidth - 1000) {
        // 30% шанс вместо 15%
        const verticalDirection = Math.random() > 0.5 ? 1 : -1;
        const verticalHeightChange =
          verticalDirection * (100 + Math.random() * 60);

        // Проверяем доступность и отсутствие пересечений
        const verticalY = currentY + verticalHeightChange;
        let verticalOverlaps = false;

        for (let platform of pathPlatforms) {
          if (
            Math.abs(currentX - 80 - platform.x) < 120 &&
            Math.abs(verticalY - platform.y) < 40
          ) {
            verticalOverlaps = true;
            break;
          }
        }

        if (!verticalOverlaps && verticalY >= 400 && verticalY <= 1100) {
          const verticalPlatform = createRandomPlatform(
            currentX - 80,
            verticalY,
          );
          verticalPlatform.hasCoins = Math.random() > 0.4;

          pathPlatforms.push(verticalPlatform);

          if (verticalPlatform.hasCoins) {
            const verticalCoins = createCoinsOnPlatform(verticalPlatform);
            pathCoins.push(...verticalCoins);
            totalCoins += verticalCoins.length;
          }
        }
      }
    } else {
      // Если есть пересечение, просто увеличиваем X и продолжаем
      currentX += 100;
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

// ОБНОВЛЕННАЯ ИНИЦИАЛИЗАЦИЯ ИГРЫ С ПРОВЕРКОЙ ЗАГРУЗКИ SVG
function init() {
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
    const uiOverlay = document.querySelector('.ui-overlay');
    const gamepadStatus = document.getElementById('gamepadStatus');
    if (uiOverlay) uiOverlay.classList.remove('hidden');
    if (gamepadStatus) gamepadStatus.classList.remove('hidden');
    
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

    // Инициализация камеры
    camera.x = 0;
    camera.y = levelHeight - camera.height;

    // Ограничения по вертикали
    if (camera.y < 0) camera.y = 0;
    if (camera.y + camera.height > levelHeight)
        camera.y = levelHeight - camera.height;

    // УБРАН СБРОС ОБЩИХ МОНЕТ: coins = 0;
    coinCountElement.textContent = coins; // Отображаем накопленные монеты
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

// Функция для отрисовки кота из SVG частей
function drawCat() {
  const x = player.x + player.width / 2;
  const y = player.y + player.height / 2;

  ctx.save();

  // Эффект мигания при получении урона
  if (damageFlashTimer > 0) {
    ctx.globalAlpha = 0.1;
  }

  ctx.translate(x, y);
  ctx.scale(player.direction, 1);

  // Тень
  if (player.grounded) {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 60, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Анимация частей тела
  const walkRotation =
    (Math.sin(animationTime * 6) * 0.3 * Math.abs(player.velX)) / player.speed;
  const jumpRotation = player.grounded ? 0 : 0.5;

  // Ноги
  drawSVGPart("leftShin", -15, 40, 12, 21, walkRotation + jumpRotation);
  drawSVGPart("rightShin", 15, 40, 13, 22, -walkRotation + jumpRotation);

  // Бедра
  drawSVGPart("leftHip", -15, 25, 16, 26, walkRotation * 0.5);
  drawSVGPart("rightHip", 15, 25, 16, 26, -walkRotation * 0.5);

  // Тело
  drawSVGPart("body", 0, 0, 42, 55, 0);

  // Плечи
  drawSVGPart("leftShoulder", -20, 5, 17, 27, -walkRotation);
  drawSVGPart("rightShoulder", 20, 5, 18, 28, walkRotation);

  // Предплечья
  drawSVGPart("leftForearm", -25, 25, 27, 32, -walkRotation * 1.5);
  drawSVGPart("rightForearm", 25, 25, 32, 36, walkRotation * 1.5);

  // Голова
  drawSVGPart("head", 0, -50, 107, 109, 0);

  ctx.restore();
}

// Обновление анимации монет
function updateCoinAnimations() {
  for (let coin of coinsList) {
    if (!coin.collected) {
      // Обновляем анимацию подпрыгивания с уменьшенной амплитудой
      coin.bouncePhase += coin.bounceSpeed;
      coin.bounceOffset = Math.sin(coin.bouncePhase) * 5;
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

      if (!platform) continue;

      // Проверяем, находится ли враг в зоне видимости камеры
      const isVisible =
        enemy.x < camera.x + camera.width && enemy.x + enemy.width > camera.x;

      // Обновляем только видимых врагов для оптимизации
      if (isVisible) {
        // Логика застревания быстрых врагов на 6 уровне
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
    const pattern = ctx.createPattern(svgImages.background, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(camera.x, camera.y, levelWidth, levelHeight);
  } else {
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

      // Используем текстуру монеты вместо рисования круга
      if (svgImages.coin) {
        ctx.drawImage(
          svgImages.coin,
          coin.x,
          currentY,
          coin.width,
          coin.height,
        );
      } else {
        // Запасной вариант если текстура не загружена
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
      if (enemy.type === "armored") {
        // Основной цвет брони
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Внутренняя броня (темнее основного цвета)
        ctx.fillStyle = "#2C3E50";
        ctx.fillRect(
          enemy.x + 8,
          enemy.y + 8,
          enemy.width - 16,
          enemy.height - 16,
        );

        // Детали брони
        ctx.fillStyle = "#7F8C8D";
        // Бронепластины
        ctx.fillRect(enemy.x + 12, enemy.y + 12, enemy.width - 24, 6);
        ctx.fillRect(
          enemy.x + 12,
          enemy.y + enemy.height - 18,
          enemy.width - 24,
          6,
        );
        ctx.fillRect(enemy.x + 12, enemy.y + 25, 6, enemy.height - 50);
        ctx.fillRect(
          enemy.x + enemy.width - 18,
          enemy.y + 25,
          6,
          enemy.height - 50,
        );

        // Глаза
        ctx.fillStyle = "white";
        ctx.fillRect(enemy.x + 20, enemy.y + 25, 10, 10);
        ctx.fillRect(enemy.x + enemy.width - 30, enemy.y + 25, 10, 10);

        ctx.fillStyle = "red";
        ctx.fillRect(enemy.x + 23, enemy.y + 28, 4, 4);
        ctx.fillRect(enemy.x + enemy.width - 27, enemy.y + 28, 4, 4);

        // Индикатор брони (щит)
        ctx.fillStyle = "#E74C3C";
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y - 5);
        ctx.lineTo(enemy.x + enemy.width / 2 - 10, enemy.y + 5);
        ctx.lineTo(enemy.x + enemy.width / 2 + 10, enemy.y + 5);
        ctx.closePath();
        ctx.fill();
      }
      // ЛЕТАЮЩИЕ ВРАГИ
      else if (enemy.isFlying) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Крылья с анимацией
        ctx.fillStyle = "#8E44AD";
        const wingY = enemy.y - 8 + Math.sin(animationTime * 8) * 4;
        ctx.fillRect(enemy.x - 12, wingY, 12, 6);
        ctx.fillRect(enemy.x + enemy.width, wingY, 12, 6);
      }
      // ВРАГИ НА ПЛАТФОРМАХ
      else if (enemy.type === "platform" || enemy.type === "jumping") {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Специальные индикаторы для прыгающих врагов
        if (enemy.type === "jumping") {
          // Индикатор готовности к прыжку
          if (enemy.jumpCooldown < 30) {
            ctx.fillStyle = "yellow";
            ctx.fillRect(enemy.x + enemy.width / 2 - 2, enemy.y - 8, 4, 4);
          }
        }
      }
      // НАЗЕМНЫЕ ВРАГИ
      else {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      }

      // Глаза для всех врагов (кроме бронированных, у которых глаза уже нарисованы)
      if (enemy.type !== "armored") {
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
    }
  }

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

  // Рисование кота из SVG частей
  drawCat();

  // Восстанавливаем состояние контекста
  ctx.restore();
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
    });
  }

  return groundCoins;
}

// Обработка получения урона
function takeDamage() {
  if (isInvulnerable) return;

  lives--;
  livesCountElement.textContent = lives;

  playSound("player_damage", 0.7);

  isInvulnerable = true;
  invulnerabilityTimer = INVULNERABILITY_DURATION;
  damageFlashTimer = 10;

  if (lives <= 0) {
    gameState = "gameOver";
    gameOverScreen.classList.remove("hidden");
    finalScoreElement.textContent = coins;

    stopMusic();
    playMusic("game_over", false, 0.8);

    playSound("player_death", 0.8);
  }
}

// Обновление системы урона
function updateDamageSystem() {
  if (isInvulnerable) {
    invulnerabilityTimer--;

    // Мигание каждые 30 кадров (примерно 0.5 секунды при 60 FPS)
    if (invulnerabilityTimer % 30 < 15) {
      damageFlashTimer = 5; // видимый
    } else {
      damageFlashTimer = 0; // невидимый
    }

    if (invulnerabilityTimer <= 0) {
      isInvulnerable = false;
      damageFlashTimer = 0;
    }
  }
}

// Обработка ввода с клавиатуры
function handleKeyboardInput() {
  // Определяем направление
  if (keys["ArrowLeft"] || keys["KeyA"]) {
    player.velX = -player.speed;
    player.direction = -1;

    if (player.grounded && Math.random() > 0.7) {
      playSound("move", 0.3, 1.0 + Math.random() * 0.2);
    }
  } else if (keys["ArrowRight"] || keys["KeyD"]) {
    player.velX = player.speed;
    player.direction = 1;

    if (player.grounded && Math.random() > 0.7) {
      playSound("move", 0.3, 1.0 + Math.random() * 0.2);
    }
  }

  // Прыжок
  if ((keys["ArrowUp"] || keys["KeyW"] || keys["Space"]) && player.grounded) {
    player.velY = -18;
    player.jumping = true;
    player.grounded = false;
    playSound("jump", 0.6);
  }

  // Способность спускаться по платформам (стрелка вниз или S)
  downKeyPressed = keys["ArrowDown"] || keys["KeyS"];

  // Атака (X или F)
  if ((keys["KeyX"] || keys["KeyF"]) && !isAttacking && attackCooldown <= 0) {
    isAttacking = true;
    attackCooldown = 25;
  }

  // Прыжок (сенсорный или клавиатура)
  if ((keys["ArrowUp"] || keys["KeyW"] || keys["Space"]) && player.grounded) {
    player.velY = -18;
    player.jumping = true;
    player.grounded = false;
    playSound("jump", 0.6);
  }

  // Способность спускаться по платформам
  downKeyPressed = keys["ArrowDown"] || keys["KeyS"];

  // Атака (сенсорная или клавиатура)
  if ((keys["KeyX"] || keys["KeyF"]) && !isAttacking && attackCooldown <= 0) {
    isAttacking = true;
    attackCooldown = 25;
  }
}

// Обновление игровой логики
function update() {
  // Если игра в состоянии preload или menu, не обновляем игровую логику 
  if (gameState === "preload" || gameState === "menu") {
    return;
  }

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

  // Если игра не в состоянии playing, не обновляем игровую логику
  if (gameState !== "playing") return;

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

      if (player.grounded && Math.random() > 0.7) {
        playSound("move", 0.3, 1.0 + Math.random() * 0.2);
      }
    }

    // Проверяем кнопку для спуска (обычно кнопка вниз на крестовине или левый стик вниз)
    const leftStickY = gamepad.axes[1];
    downKeyPressed = gamepad.buttons[13]?.pressed || leftStickY > 0.5;

    if (gamepad.buttons[0].pressed && player.grounded) {
      player.velY = -18;
      player.jumping = true;
      player.grounded = false;
      playSound("jump", 0.6);
    }

    // Атака с геймпада (кнопка X)
    if (gamepad.buttons[3].pressed && !isAttacking && attackCooldown <= 0) {
      isAttacking = true;
      attackCooldown = 25;
    }
  }

  // Обновление позиции игрока
  player.x += player.velX;
  player.y += player.velY;

  if (!player.lastGroundedState && player.grounded) {
    playSound("land", 0.4);
  }
  player.lastGroundedState = player.grounded;

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
      // Если нажата кнопка вниз, позволяем игроку пройти сквозь платформу
      // НО ИСКЛЮЧАЕМ ОСНОВНОЙ ПОЛ (самый нижний уровень)
      if (
        downKeyPressed &&
        platform.y < levelHeight - 50 &&
        (keys["ArrowDown"] ||
          keys["KeyS"] ||
          (isGamepadConnected &&
            (gamepad.buttons[13]?.pressed || gamepad.axes[1] > 0.5)))
      ) {
        // Пропускаем эту платформу - игрок может пройти сквозь нее
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
      coins++;
      coinsCollectedInLevel++;
      coinCountElement.textContent = coins;
      updateLevelGoalDisplay();

      if (coin.isHighCoin) {
        playSound("coin_2", 0.6);
      } else {
        playSound("coin_1", 0.5);
      }
    }
  }

  // Проверка столкновения с врагами
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      // Проверка атаки на бронированных врагов
      if (isAttacking && enemy.type === "armored") {
        enemies.splice(i, 1);
        player.velY = -8; // небольшой отскок при убийстве атакой

        coins += 3;
        coinsCollectedInLevel += 3;
        coinCountElement.textContent = coins;
        updateLevelGoalDisplay();

        playSound("enemy_defeat", 0.8);
        playSound("enemy_coin", 0.6);
      }
      // Обычные враги (уязвимы к прыжкам)
      else if (
        player.velY > 0 &&
        player.y + player.height < enemy.y + enemy.height / 2 &&
        !enemy.isArmored // Бронированные неуязвимы к прыжкам
      ) {
        enemies.splice(i, 1);
        player.velY = -12;

        coins += 2;
        coinsCollectedInLevel += 2;
        coinCountElement.textContent = coins;
        updateLevelGoalDisplay();

        playSound("jump_hit", 0.7);
        playSound("enemy_defeat", 0.6);
        playSound("enemy_coin", 0.5);
      }
      // Бронированные враги при прыжке на них - отскакиваем без убийства
      else if (
        player.velY > 0 &&
        player.y + player.height < enemy.y + enemy.height / 2 &&
        enemy.isArmored
      ) {
        player.velY = -10; // отскок от бронированного врага
        playSound("jump_hit", 0.5);
      } else if (!isInvulnerable) {
        playSound("enemy_attack", 0.6);
        takeDamage();
      }
    }
  }

  // Проверка достижения флага (только если собрано достаточно монет)
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
        await new Promise(resolve => setTimeout(resolve, 800));
        
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
        
        // Показываем сообщение об ошибке пользователю
        alert("Произошла ошибка при загрузке игры. Пожалуйста, попробуйте еще раз.");
    }
});

// Перезапуск игры
restartButton.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  playSound("ui_click", 0.5);
  lives = 150;
  coins = 0;
  level = 1;
  gameState = "playing";
  // СКРЫВАЕМ UI ЭЛЕМЕНТЫ ПРИ РЕСТАРТЕ (ОНИ ПОКАЖУТСЯ В init())
  const uiOverlay = document.querySelector('.ui-overlay');
  const gamepadStatus = document.getElementById('gamepadStatus');
  if (uiOverlay) uiOverlay.classList.add('hidden');
  if (gamepadStatus) gamepadStatus.classList.add('hidden');
  // Останавливаем музыку и запускаем соответствующую уровню 
  stopMusic();
  playMusic("forest_theme", true, musicVolume);
  
  init();
});

// Следующий уровень
nextLevelButton.addEventListener("click", () => {
  levelCompleteScreen.classList.add("hidden");
  playSound("ui_click", 0.5);
  level++;
  levelCountElement.textContent = level;
  gameState = "playing";
  
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
  
  init();

  // Увеличиваем сложность
  player.speed += 0.3;
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
  lives = 150;
  coins = 0;
  level = 1;
  gameState = "playing";
  // СКРЫВАЕМ UI ЭЛЕМЕНТЫ ПРИ РЕСТАРТЕ (ОНИ ПОКАЖУТСЯ В init())
  const uiOverlay = document.querySelector('.ui-overlay');
  const gamepadStatus = document.getElementById('gamepadStatus');
  if (uiOverlay) uiOverlay.classList.add('hidden');
  if (gamepadStatus) gamepadStatus.classList.add('hidden');
  // Останавливаем музыку и запускаем соответствующую уровню 
  stopMusic();
  playMusic("forest_theme", true, musicVolume);
  
  init();
});

mainMenuButton.addEventListener("click", () => {
  pauseScreen.classList.add("hidden");
  playSound("ui_click", 0.5);
  
  // Скрываем игровые UI элементы
  const uiOverlay = document.querySelector('.ui-overlay');
  const gamepadStatus = document.getElementById('gamepadStatus');
  if (uiOverlay) uiOverlay.classList.add('hidden');
  if (gamepadStatus) gamepadStatus.classList.add('hidden');
  
  // Показываем главное меню
  startScreen.classList.remove("hidden");
  gameState = "menu";
  
  // Останавливаем игровую музыку и включаем музыку меню
  stopMusic();
  playMusic("main_menu_theme", true, musicVolume);
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
Promise.all([
  loadAllSVGs(),
  enableGameAudio()
])
.then(() => {
  console.log("Все ресурсы загружены, ожидаем пользователя...");
  // Только запускаем игровой цикл, но не инициализируем игру
  gameLoop();
})
.catch((error) => {
  console.log("Запуск с заглушками из-за ошибки загрузки:", error);
  gameLoop();
});