// Основные переменные игры
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const levelCompleteScreen = document.getElementById("levelCompleteScreen");
const pauseScreen = document.getElementById("pauseScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const nextLevelButton = document.getElementById("nextLevelButton");
const resumeButton = document.getElementById("resumeButton");
const restartPauseButton = document.getElementById("restartPauseButton");
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
let gameState = "menu"; // menu, playing, paused, gameOver, levelComplete
let coins = 0;
let lives = 150;
let level = 1;
let gamepad = null;
let isGamepadConnected = false;

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
    }, // пока без темы меню, приколы
    // { name: "sad_theme", url: "./Assets/Audio/Music/MainTheme/sad_theme.mp3" }, // не используется
    {
      name: "level_complete",
      url: "./Assets/Audio/Music/Levels/level_complete.mp3",
    },
    { name: "game_over", url: "./Assets/Audio/Music/Events/game_over.mp3" },

    // SFX игрока
    { name: "jump", url: "./Assets/Audio/SFX/Player/jump.mp3" },
    { name: "jump_hit", url: "./Assets/Audio/SFX/Player/jump_hit.mp3" },
    { name: "land", url: "./Assets/Audio/SFX/Player/land.mp3" },
    // { name: "move", url: "./Assets/Audio/SFX/Player/move.mp3" }, пока без этого прикола, ужасные звуки
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

// Музыкальные треки
let currentMusic = null;
let currentMusicGainNode = null;

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

// ВКЛЮЧЕНИЕ ИГРОВОГО ЗВУКА
function enableGameAudio() {
  if (audioEnabled) return;

  initializeAudio();
  loadAllSounds().then(() => {
    playMusic("main_menu_theme", true, musicVolume);
    audioEnabled = true;
    console.log("Игровой звук включен");
  });
}

// АВТОМАТИЧЕСКАЯ ПОПЫТКА ВКЛЮЧЕНИЯ ЗВУКА ПРИ ЗАГРУЗКЕ
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try {
      enableGameAudio();
    } catch (error) {
      console.log(
        "Автоматическое включение звука не удалось, ждем пользователя",
      );
    }
  }, 1000);
});

// ВКЛЮЧЕНИЕ ЗВУКА ПРИ ЛЮБОМ ВЗАИМОДЕЙСТВИИ ПОЛЬЗОВАТЕЛЯ
document.addEventListener("click", enableGameAudio, { once: true });
document.addEventListener("keydown", enableGameAudio, { once: true });

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
      loadSVG("head", "./assets/images/characters/character/head.svg"),
      loadSVG("body", "./assets/images/characters/character/body.svg"),
      loadSVG(
        "leftShoulder",
        "./assets/images/characters/character/left_shoulder.svg",
      ),
      loadSVG(
        "rightShoulder",
        "./assets/images/characters/character/right_shoulder.svg",
      ),
      loadSVG(
        "leftForearm",
        "./assets/images/characters/character/left_forearm.svg",
      ),
      loadSVG(
        "rightForearm",
        "./assets/images/characters/character/right_forearm.svg",
      ),
      loadSVG("leftHip", "./assets/images/characters/character/left_hip.svg"),
      loadSVG("rightHip", "./assets/images/characters/character/right_hip.svg"),
      loadSVG("leftShin", "./assets/images/characters/character/left_shin.svg"),
      loadSVG(
        "rightShin",
        "./assets/images/characters/character/right_shin.svg",
      ),
      loadSVG("background", "./assets/images/backgrounds/fon/fon.svg"),
    ]);
    console.log("Все SVG изображения кота загружены успешно");
  } catch (error) {
    console.error("Ошибка при загрузке SVG:", error);
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

  const groundEnemyCount = 4 + Math.floor(level * 1.2);
  const flyingEnemyCount = 2 + Math.floor(level * 0.8);
  const platformEnemyCount = 3 + Math.floor(level * 0.6);

  for (let i = 0; i < groundEnemyCount; i++) {
    const enemyX = 300 + i * Math.floor((levelWidth - 600) / groundEnemyCount);
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

  // Враги на платформах
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
        suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)];

      enemies.push({
        x: platform.x + 20,
        y: platform.y - 60,
        width: 50,
        height: 50,
        speed: 1.5 + level * 0.2,
        direction: Math.random() > 0.5 ? 1 : -1,
        patrolRange: platform.width - 60,
        startX: platform.x + platform.width / 2,
        color: "#E74C3C",
        type: "platform",
        platformId: platforms.indexOf(platform),
        grounded: true,
        jumpCooldown: 0,
      });
    }
  }

  // Летающие враги
  for (let i = 0; i < flyingEnemyCount; i++) {
    const flyX = 400 + i * Math.floor((levelWidth - 800) / flyingEnemyCount);

    // РАЗНЫЕ ВЫСОТЫ ДЛЯ ЛЕТАЮЩИХ ВРАГОВ
    let flyY;
    const heightTier = i % 3;

    if (heightTier === 0) {
      flyY = 700 + Math.random() * 150;
    } else if (heightTier === 1) {
      flyY = 550 + Math.random() * 100;
    } else {
      flyY = 400 + Math.random() * 100;
    }

    // Добавляем случайное смещение для разнообразия
    flyY += Math.random() * 50 - 25;

    // Гарантируем, что враги не вылетают за пределы уровня
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

  // Быстрые враги на высоких уровнях
  if (level >= 3) {
    const fastEnemyCount = 1 + Math.floor(level / 2);
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

  // Прыгающие враги на платформах
  if (level >= 2) {
    const jumpingEnemyCount = 1 + Math.floor(level / 2);
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

  // Дополнительные враги в конце уровня
  if (level >= 1) {
    const endGameEnemies = 2 + Math.floor(level / 1.5);
    for (let i = 0; i < endGameEnemies; i++) {
      const endX = levelWidth - 500 - i * 150;

      enemies.push({
        x: endX,
        y: levelHeight - 70,
        width: 55,
        height: 55,
        speed: 2.5 + level * 0.3,
        direction: -1,
        patrolRange: 100,
        startX: endX,
        color: "#16A085",
        type: "ground",
      });
    }
  }

  return enemies;
}

// Инициализация игры
function init() {
  console.log("Инициализация игры...");

  // Установка размера canvas
  resizeCanvas();

  // Сброс счетчиков уровня
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

  // Инициализация камеры - фиксированная вертикальная позиция
  camera.x = 0;
  camera.y = levelHeight - camera.height;

  // Ограничения по вертикали
  if (camera.y < 0) camera.y = 0;
  if (camera.y + camera.height > levelHeight)
    camera.y = levelHeight - camera.height;

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

  // if (gameState === "playing" && audioInitialized) {
  //   playMusic("main_menu_theme", true, musicVolume);
  // }
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
    ctx.globalAlpha = 0.5;
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
    if (enemy.type === "platform" || enemy.type === "jumping") {
      const platform = platforms[enemy.platformId];

      if (!platform) continue;

      // Проверяем, находится ли враг в зоне видимости камеры
      const isVisible =
        enemy.x < camera.x + camera.width && enemy.x + enemy.width > camera.x;

      // Обновляем только видимых врагов для оптимизации
      if (isVisible) {
        // Горизонтальное движение
        enemy.x += enemy.speed * enemy.direction;

        // Проверка границ платформы
        if (
          enemy.x <= platform.x + 10 ||
          enemy.x + enemy.width >= platform.x + platform.width - 10
        ) {
          enemy.direction *= -1;
        }

        // Для прыгающих врагов
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
          // Обычные враги на платформах всегда на платформе
          enemy.y = platform.y - enemy.height;
        }
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
    if (enemy.type === "platform" || enemy.type === "jumping") continue;

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

      ctx.save();
      ctx.translate(coin.x + coin.width / 2, currentY + coin.height / 2);

      // Разный цвет для высоких монет
      ctx.fillStyle = coin.color;
      ctx.beginPath();
      ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Блики на монете
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(-4, -4, coin.width / 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(2, 2, coin.width / 8, 0, Math.PI * 2);
      ctx.fill();

      // Индикатор для высоких монет
      if (coin.isHighCoin) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(0, -20, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Рисование только видимых врагов
  for (let enemy of enemies) {
    if (enemy.x < camera.x + camera.width && enemy.x + enemy.width > camera.x) {
      // Разные цвета для разных типов врагов
      ctx.fillStyle = enemy.color;

      // Для летающих врагов рисуем крылья
      if (enemy.isFlying) {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Крылья с анимацией
        ctx.fillStyle = "#8E44AD";
        const wingY = enemy.y - 8 + Math.sin(animationTime * 8) * 4;
        ctx.fillRect(enemy.x - 12, wingY, 12, 6);
        ctx.fillRect(enemy.x + enemy.width, wingY, 12, 6);
      }
      // Для врагов на платформах
      else if (enemy.type === "platform" || enemy.type === "jumping") {
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
      // Для наземных врагов
      else {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      }

      // Глаза для всех врагов
      ctx.fillStyle = "white";
      ctx.fillRect(enemy.x + 8, enemy.y + 15, 12, 12);
      ctx.fillRect(enemy.x + enemy.width - 20, enemy.y + 15, 12, 12);

      ctx.fillStyle = enemy.type === "fast" ? "red" : "black";
      ctx.fillRect(enemy.x + 11, enemy.y + 18, 6, 6);
      ctx.fillRect(enemy.x + enemy.width - 17, enemy.y + 18, 6, 6);

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
      ctx.fillStyle = "#666666";
      ctx.fillRect(flag.x, flag.y, 8, flag.height);
      ctx.beginPath();
      ctx.moveTo(flag.x, flag.y);
      ctx.lineTo(flag.x, flag.y - 30);
      ctx.lineTo(flag.x + 35, flag.y - 15);
      ctx.closePath();
      ctx.fill();

      // Замок
      ctx.fillStyle = "#333333";
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

    // Мигание каждые 5 кадров
    if (invulnerabilityTimer % 10 < 5) {
      damageFlashTimer = 5;
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
    if (gamepad.buttons[2].pressed && !isAttacking && attackCooldown <= 0) {
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
      if (
        player.velY > 0 &&
        player.y + player.height < enemy.y + enemy.height / 2
      ) {
        enemies.splice(i, 1);
        player.velY = -12;

        // Добавляем монеты за убийство врага
        coins += 2;
        coinsCollectedInLevel += 2;
        coinCountElement.textContent = coins;
        updateLevelGoalDisplay();

        playSound("jump_hit", 0.7);
        playSound("enemy_death", 0.6);
        playSound("enemy_defeat", 0.5);
        playSound("enemy_coin", 0.5);

        console.log(`+2 монеты за убийство врага!`);
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

// Начало игры
startButton.addEventListener("click", () => {
  //гарантируем, что аудио включено
  if (!audioEnabled) {
    enableGameAudio();
  }

  startScreen.classList.add("hidden");
  gameState = "playing";
  stopMusic("main_menu_theme");
  playSound("ui_click", 0.5);
  init();
});

// Перезапуск игры
restartButton.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  playSound("ui_click", 0.5);
  lives = 150;
  coins = 0;
  level = 1;
  gameState = "playing";
  // stopMusic();
  // playMusic("main_menu_theme", true, musicVolume);
  init();
});

// Следующий уровень
nextLevelButton.addEventListener("click", () => {
  levelCompleteScreen.classList.add("hidden");
  playSound("ui_click", 0.5);
  level++;
  levelCountElement.textContent = level;
  gameState = "playing";
  // stopMusic();
  // playMusic("main_menu_theme", true, musicVolume);
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
  // stopMusic();
  // playMusic("main_menu_theme", true, musicVolume);
  init();
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

// Запуск игры после загрузки SVG
loadAllSVGs()
  .then(() => {
    console.log("Игра запускается...");

    // Не инициализируем аудио автоматически, ждем действий пользователя
    gameLoop();
    init();
  })
  .catch((error) => {
    console.log("Запуск с заглушками из-за ошибки загрузки:", error);
    gameLoop();
    init();
  });
