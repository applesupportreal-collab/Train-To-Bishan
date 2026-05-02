const CONFIG_PATH = "config/game-config.json";
const SCRIPT_CONFIG_GLOBAL = "TRAIN_TO_BISHAN_GAME_CONFIG";
const DEMO_SKIP_QUERY_VALUE = "true";
const DEFAULT_GAME_SETTINGS = {
  routeStations: [
    { code: "NS25", name: "City Hall" },
    { code: "NS24", name: "Dhoby Ghaut" },
    { code: "NS23", name: "Somerset" },
    { code: "NS22", name: "Orchard" },
    { code: "NS21", name: "Newton" },
    { code: "NS20", name: "Novena" },
    { code: "NS19", name: "Toa Payoh" },
    { code: "NS18", name: "Braddell" },
    { code: "NS17", name: "Bishan" },
  ],
  timing: {
    initialTrainArrivalDuration: 15_000,
    trainArrivalDuration: 15_000,
    boardingDuration: 8_000,
    durationBetweenStations: 12_000,
    stationDwellDuration: 20_000,
    stationDurations: [],
  },
  seatRush: {
    gainPerPress: 0.08,
    decayPerSecond: 0.16,
    seatThreshold: 0.95,
  },
  upright: {
    betaMin: 48,
    betaMax: 132,
    gammaMax: 42,
    staleAfter: 1600,
    checkInterval: 300,
  },
  trainSound: {
    minDelay: 3_500,
    maxDelay: 13_000,
    firstMinDelay: 900,
    firstMaxDelay: 2_400,
    retryMinDelay: 1_500,
    retryMaxDelay: 3_000,
    defaultVolume: 1,
    maxConcurrent: 1,
  },
  audioFade: {
    duration: 1_000,
    tickInterval: 50,
  },
  startSound: {
    src: "sounds/train_service_ends_at_bishan.ogg",
    volume: 1,
  },
  endSound: {
    src: "sounds/yay.ogg",
    volume: 1,
  },
  doorClosingSound: {
    src: "sounds/doors_are_closing.ogg",
    volume: 1,
    leadTime: 10_000,
  },
  announcement: {
    basePath: "sounds",
    prefix: "next_station",
    nextStationPrefix: "next_station",
    arrivingPrefix: "arriving",
    extension: "ogg",
    volume: 1,
    arrivingLeadTime: 10_000,
  },
  auntieEvent: {
    chance: 0.2,
    imageSrc: "assets/auntie-placeholder.svg",
    scoldAfter: 3_000,
    minDuration: 20_000,
    maxDuration: 30_000,
    fadeDuration: 700,
    eyesOpenThreshold: 0.08,
    slideDuration: 2_200,
  },
  vibration: {
    actionActivation: [35, 25, 35],
    boardingStart: [70, 40, 70],
    seated: 90,
    standing: [40, 35, 40],
    arrival: [120, 50, 120],
    rushTap: 8,
  },
};

let ROUTE_STATIONS = cloneStations(DEFAULT_GAME_SETTINGS.routeStations);
let GAME_CONFIG = cloneTimingConfig(DEFAULT_GAME_SETTINGS.timing);
const DURATIONS = {
  get arrival() {
    return GAME_CONFIG.initialTrainArrivalDuration;
  },
  get boarding() {
    return GAME_CONFIG.boardingDuration;
  },
  get ride() {
    return getRideDuration();
  },
};
let SEAT_RUSH_CONFIG = { ...DEFAULT_GAME_SETTINGS.seatRush };
let UPRIGHT = { ...DEFAULT_GAME_SETTINGS.upright };
let TRAIN_SOUND_CONFIG = { ...DEFAULT_GAME_SETTINGS.trainSound };
let AUDIO_FADE_CONFIG = { ...DEFAULT_GAME_SETTINGS.audioFade };
let START_SOUND_CONFIG = { ...DEFAULT_GAME_SETTINGS.startSound };
let END_SOUND_CONFIG = { ...DEFAULT_GAME_SETTINGS.endSound };
let DOOR_CLOSING_SOUND_CONFIG = { ...DEFAULT_GAME_SETTINGS.doorClosingSound };
let ANNOUNCEMENT_CONFIG = { ...DEFAULT_GAME_SETTINGS.announcement };
let AUNTIE_CONFIG = { ...DEFAULT_GAME_SETTINGS.auntieEvent };
let VIBRATION_CONFIG = cloneVibrationConfig(DEFAULT_GAME_SETTINGS.vibration);

function cloneStations(stations) {
  return stations.map((station) => ({ code: station.code, name: station.name }));
}

function cloneTimingConfig(config) {
  const timingConfig = {
    ...config,
    stationDurations: Array.isArray(config.stationDurations)
      ? [...config.stationDurations]
      : [],
  };
  const configuredArrivalDuration = Number(
    timingConfig.initialTrainArrivalDuration ?? timingConfig.trainArrivalDuration,
  );
  const fallbackArrivalDuration = DEFAULT_GAME_SETTINGS.timing.initialTrainArrivalDuration;
  const initialTrainArrivalDuration =
    Number.isFinite(configuredArrivalDuration) && configuredArrivalDuration >= 0
      ? configuredArrivalDuration
      : fallbackArrivalDuration;

  return {
    ...timingConfig,
    initialTrainArrivalDuration,
    trainArrivalDuration: initialTrainArrivalDuration,
  };
}

function cloneVibrationPattern(pattern) {
  return Array.isArray(pattern) ? [...pattern] : pattern;
}

function cloneVibrationConfig(config) {
  return {
    ...config,
    actionActivation: cloneVibrationPattern(config.actionActivation),
    boardingStart: cloneVibrationPattern(config.boardingStart),
    seated: cloneVibrationPattern(config.seated),
    standing: cloneVibrationPattern(config.standing),
    arrival: cloneVibrationPattern(config.arrival),
    rushTap: cloneVibrationPattern(config.rushTap),
  };
}

function readDemoSkipEnabled() {
  try {
    return new URLSearchParams(window.location.search).get("skip") === DEMO_SKIP_QUERY_VALUE;
  } catch {
    return false;
  }
}

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeStations(stations) {
  if (!Array.isArray(stations)) {
    return cloneStations(DEFAULT_GAME_SETTINGS.routeStations);
  }

  const normalizedStations = stations
    .map((station) => ({
      code: typeof station?.code === "string" ? station.code.trim() : "",
      name: typeof station?.name === "string" ? station.name.trim() : "",
    }))
    .filter((station) => station.code && station.name);

  return normalizedStations.length >= 2
    ? normalizedStations
    : cloneStations(DEFAULT_GAME_SETTINGS.routeStations);
}

function applyGameSettings(settings) {
  const externalSettings = readObject(settings);

  ROUTE_STATIONS = normalizeStations(
    externalSettings.routeStations ?? DEFAULT_GAME_SETTINGS.routeStations,
  );
  GAME_CONFIG = cloneTimingConfig({
    ...DEFAULT_GAME_SETTINGS.timing,
    ...readObject(externalSettings.timing),
  });
  SEAT_RUSH_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.seatRush,
    ...readObject(externalSettings.seatRush),
  };
  UPRIGHT = {
    ...DEFAULT_GAME_SETTINGS.upright,
    ...readObject(externalSettings.upright),
  };
  TRAIN_SOUND_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.trainSound,
    ...readObject(externalSettings.trainSound),
  };
  AUDIO_FADE_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.audioFade,
    ...readObject(externalSettings.audioFade),
  };
  START_SOUND_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.startSound,
    ...readObject(externalSettings.startSound),
  };
  END_SOUND_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.endSound,
    ...readObject(externalSettings.endSound),
  };
  DOOR_CLOSING_SOUND_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.doorClosingSound,
    ...readObject(externalSettings.doorClosingSound),
  };
  ANNOUNCEMENT_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.announcement,
    ...readObject(externalSettings.announcement),
  };
  AUNTIE_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.auntieEvent,
    ...readObject(externalSettings.auntieEvent),
  };
  VIBRATION_CONFIG = cloneVibrationConfig({
    ...DEFAULT_GAME_SETTINGS.vibration,
    ...readObject(externalSettings.vibration),
  });
}

async function loadGameSettings() {
  const scriptConfig = readObject(window[SCRIPT_CONFIG_GLOBAL]);

  try {
    const configUrl = new URL(CONFIG_PATH, window.location.href);
    configUrl.searchParams.set("cacheBust", Date.now().toString());

    const response = await fetch(configUrl, { cache: "no-store" });

    if (!response.ok) {
      if (Object.keys(scriptConfig).length > 0) {
        applyGameSettings(scriptConfig);
        return;
      }

      console.warn(`Could not load ${CONFIG_PATH}; using built-in defaults.`);
      return;
    }

    applyGameSettings(await response.json());
  } catch (error) {
    if (Object.keys(scriptConfig).length > 0) {
      applyGameSettings(scriptConfig);
      return;
    }

    console.warn(`Could not load ${CONFIG_PATH}; using built-in defaults.`, error);
    applyGameSettings(DEFAULT_GAME_SETTINGS);
  }
}

const gameEl = document.querySelector(".game");
const trainEl = document.querySelector("#train");
const queueEl = document.querySelector("#queue");
const trainInteriorEl = document.querySelector("#trainInterior");
const auntieEventEl = document.querySelector("#auntieEvent");
const auntieImageEl = document.querySelector("#auntieImage");
const sleepDimEl = document.querySelector("#sleepDim");
const statusRibbonEl = document.querySelector("#statusRibbon");
const metersEl = document.querySelector("#meters");
const primaryMeterEl = document.querySelector("#primaryMeter");
const statusTextEl = document.querySelector("#statusText");
const deviceIndicatorEl = document.querySelector("#deviceIndicator");
const currentStationNameEl = document.querySelector("#currentStationName");
const nextStationNameEl = document.querySelector("#nextStationName");
const segmentProgressEl = document.querySelector("#segmentProgress");
const messageEl = document.querySelector("#message");
const startButtonEl = document.querySelector("#startButton");
const actionButtonEl = document.querySelector("#actionButton");
const successMessageEl = document.querySelector("#successMessage");
const successRestartButtonEl = document.querySelector("#successRestartButton");
const sensorFallbackEl = document.querySelector("#sensorFallback");
const routeTitleEl = document.querySelector(".title-lockup h1");
const routeSubtitleEl = document.querySelector(".title-lockup p");
const stationSignCodeEl = document.querySelector(".station-sign .line-code");
const stationSignNameEl = document.querySelector(".station-sign span:last-child");
const successHeadingEl = document.querySelector(".success-copy h2");
const successStationCodeEl = document.querySelector(".success-copy .line-code");
const skipButtonEl = document.querySelector("#skipButton");
const MAIN_SUBTITLE_HTML =
  "Experience the daily commute of the average Singaporean from the <s>comfort</s> discomfort of your home!";
const DEMO_SKIP_ENABLED = readDemoSkipEnabled();
const STATUS_TEXT_DURATION = 5_000;
const STATUS_TEXT_FADE_DURATION = 420;
let statusTextHideTimer = null;
let statusTextClearTimer = null;

const state = {
  phase: "idle",
  lastTick: 0,
  arrivalRemaining: DURATIONS.arrival,
  boardingRemaining: DURATIONS.boarding,
  rideRemaining: DURATIONS.ride,
  seatProgress: 0,
  seated: false,
  nextStationAnnouncementsPlayed: new Set(),
  arrivingAnnouncementsPlayed: new Set(),
  doorClosingAnnouncementsPlayed: new Set(),
  auntieDeparturesChecked: new Set(),
  auntieActive: false,
  auntieSide: "left",
  auntieSleeping: false,
  auntieDimLevel: 0,
  auntieOpenElapsed: 0,
  auntieRemaining: 0,
  lastActionKey: "none:false",
  motionPermission: "unknown",
  usingSimulatedMotion: false,
  simulatedUpright: true,
  orientation: {
    beta: null,
    gamma: null,
    seenAt: 0,
  },
  uprightCheck: {
    checkedAt: Number.NEGATIVE_INFINITY,
    upright: true,
  },
};

function formatTime(ms) {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getStationDurations() {
  const legCount = Math.max(0, ROUTE_STATIONS.length - 1);
  const configuredDurations = Array.isArray(GAME_CONFIG.stationDurations)
    ? GAME_CONFIG.stationDurations
    : [];

  return Array.from({ length: legCount }, (_, index) => {
    const fallbackDuration = GAME_CONFIG.durationBetweenStations;
    const configuredDuration = Number(configuredDurations[index] ?? fallbackDuration);
    return Number.isFinite(configuredDuration) && configuredDuration > 0
      ? configuredDuration
      : fallbackDuration;
  });
}

function getRideDuration() {
  const stationDurations = getStationDurations();
  const dwellCount = Math.max(0, stationDurations.length - 1);
  const travelDuration = stationDurations.reduce((total, duration) => total + duration, 0);
  return travelDuration + dwellCount * GAME_CONFIG.stationDwellDuration;
}

function getRideElapsed() {
  const rideDuration = DURATIONS.ride;

  if (state.phase !== "riding" && state.phase !== "arrived") {
    return 0;
  }

  return Math.max(0, Math.min(rideDuration, rideDuration - state.rideRemaining));
}

function getStationSegment() {
  const stationDurations = getStationDurations();
  const rideDuration = DURATIONS.ride;
  let elapsed = getRideElapsed();

  for (let index = 0; index < stationDurations.length; index += 1) {
    const duration = stationDurations[index];

    if (elapsed < duration) {
      return {
        mode: "travel",
        legIndex: index,
        current: ROUTE_STATIONS[index],
        next: ROUTE_STATIONS[index + 1],
        progress: duration > 0 ? elapsed / duration : 1,
        remaining: Math.max(0, duration - elapsed),
      };
    }

    elapsed -= duration;

    if (index < stationDurations.length - 1) {
      const dwellDuration = GAME_CONFIG.stationDwellDuration;

      if (elapsed < dwellDuration) {
        return {
          mode: "dwell",
          legIndex: index,
          current: ROUTE_STATIONS[index + 1],
          next: ROUTE_STATIONS[index + 2],
          progress: 0,
          remaining: Math.max(0, dwellDuration - elapsed),
        };
      }

      elapsed -= dwellDuration;
    }
  }

  const finalStationIndex = ROUTE_STATIONS.length - 1;
  return {
    mode: "arrived",
    legIndex: Math.max(0, finalStationIndex - 1),
    current: ROUTE_STATIONS[Math.max(0, finalStationIndex - 1)],
    next: ROUTE_STATIONS[finalStationIndex],
    progress: 1,
    remaining: 0,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getAuntieChance() {
  const configuredChance = Number(AUNTIE_CONFIG.chance);
  const fallbackChance = DEFAULT_GAME_SETTINGS.auntieEvent.chance;
  return Number.isFinite(configuredChance) ? clamp(configuredChance, 0, 1) : fallbackChance;
}

function getAuntieDuration() {
  const fallbackMin = DEFAULT_GAME_SETTINGS.auntieEvent.minDuration;
  const fallbackMax = DEFAULT_GAME_SETTINGS.auntieEvent.maxDuration;
  const configuredMin = Number(AUNTIE_CONFIG.minDuration);
  const configuredMax = Number(AUNTIE_CONFIG.maxDuration);
  const minDuration =
    Number.isFinite(configuredMin) && configuredMin >= 0 ? configuredMin : fallbackMin;
  const maxDuration =
    Number.isFinite(configuredMax) && configuredMax >= 0 ? configuredMax : fallbackMax;
  const lowerDuration = Math.min(minDuration, maxDuration);
  const upperDuration = Math.max(minDuration, maxDuration);
  return randomBetween(lowerDuration, upperDuration);
}

function getAuntieScoldAfter() {
  const configuredScoldAfter = Number(AUNTIE_CONFIG.scoldAfter);
  const fallbackScoldAfter = DEFAULT_GAME_SETTINGS.auntieEvent.scoldAfter;
  return Number.isFinite(configuredScoldAfter) && configuredScoldAfter > 0
    ? configuredScoldAfter
    : fallbackScoldAfter;
}

function getAuntieFadeDuration() {
  const configuredFadeDuration = Number(AUNTIE_CONFIG.fadeDuration);
  const fallbackFadeDuration = DEFAULT_GAME_SETTINGS.auntieEvent.fadeDuration;
  return Number.isFinite(configuredFadeDuration) && configuredFadeDuration > 0
    ? configuredFadeDuration
    : fallbackFadeDuration;
}

function getAuntieEyesOpenThreshold() {
  const configuredThreshold = Number(AUNTIE_CONFIG.eyesOpenThreshold);
  const fallbackThreshold = DEFAULT_GAME_SETTINGS.auntieEvent.eyesOpenThreshold;
  return Number.isFinite(configuredThreshold)
    ? clamp(configuredThreshold, 0, 1)
    : fallbackThreshold;
}

function getAuntieSlideDuration() {
  const configuredSlideDuration = Number(AUNTIE_CONFIG.slideDuration);
  const fallbackSlideDuration = DEFAULT_GAME_SETTINGS.auntieEvent.slideDuration;
  return Number.isFinite(configuredSlideDuration) && configuredSlideDuration >= 0
    ? configuredSlideDuration
    : fallbackSlideDuration;
}

function getAuntieImageSrc() {
  const configuredImageSrc =
    typeof AUNTIE_CONFIG.imageSrc === "string" ? AUNTIE_CONFIG.imageSrc.trim() : "";
  return configuredImageSrc || DEFAULT_GAME_SETTINGS.auntieEvent.imageSrc;
}

function resetAuntieEvent() {
  state.auntieActive = false;
  state.auntieSleeping = false;
  state.auntieDimLevel = 0;
  state.auntieOpenElapsed = 0;
  state.auntieRemaining = 0;
}

function dismissAuntieEvent() {
  resetAuntieEvent();
  state.lastActionKey = "none:false";
}

function forceStandForAuntie() {
  resetAuntieEvent();
  state.seated = false;
  state.lastActionKey = "none:false";
  vibrate(VIBRATION_CONFIG.standing);
  showStatusText("Auntie scolded you into giving up your seat.", "danger");
}

function startAuntieEvent() {
  if (state.auntieActive || !state.seated) {
    return;
  }

  hideStatusText(true);
  state.auntieActive = true;
  state.auntieSide = Math.random() < 0.5 ? "left" : "right";
  state.auntieSleeping = false;
  state.auntieDimLevel = 0;
  state.auntieOpenElapsed = 0;
  state.auntieRemaining = getAuntieDuration();
  state.lastActionKey = "none:false";
}

function maybeStartAuntieEvent(stationSegment) {
  if (state.phase !== "riding" || !state.seated || state.auntieActive) {
    return;
  }

  const key = getStationAnnouncementKey(
    stationSegment.next,
    "auntie",
    stationSegment.legIndex,
  );

  if (state.auntieDeparturesChecked.has(key)) {
    return;
  }

  state.auntieDeparturesChecked.add(key);

  if (Math.random() < getAuntieChance()) {
    startAuntieEvent();
  }
}

function updateAuntieEvent(elapsed) {
  if (!state.auntieActive) {
    return;
  }

  if (!state.seated) {
    resetAuntieEvent();
    return;
  }

  state.auntieRemaining -= elapsed;

  if (state.auntieRemaining <= 0) {
    dismissAuntieEvent();
    return;
  }

  const targetDimLevel = state.auntieSleeping ? 1 : 0;
  const fadeStep = elapsed / getAuntieFadeDuration();

  if (state.auntieDimLevel < targetDimLevel) {
    state.auntieDimLevel = Math.min(targetDimLevel, state.auntieDimLevel + fadeStep);
  } else if (state.auntieDimLevel > targetDimLevel) {
    state.auntieDimLevel = Math.max(targetDimLevel, state.auntieDimLevel - fadeStep);
  }

  if (state.auntieDimLevel <= getAuntieEyesOpenThreshold()) {
    state.auntieOpenElapsed += elapsed;
  } else {
    state.auntieOpenElapsed = 0;
  }

  if (state.auntieOpenElapsed > getAuntieScoldAfter()) {
    forceStandForAuntie();
  }
}

function startPretendSleep() {
  if (!isSleepActionActive()) {
    return;
  }

  state.auntieSleeping = true;
  render();
}

function stopPretendSleep() {
  if (!state.auntieSleeping) {
    return;
  }

  state.auntieSleeping = false;
  render();
}

function isSleepActionActive() {
  const action = getActionState();
  return action.enabled && action.type === "sleep";
}

function getOriginStation() {
  return ROUTE_STATIONS[0];
}

function getDestinationStation() {
  return ROUTE_STATIONS[ROUTE_STATIONS.length - 1];
}

function getFirstNextStation() {
  return ROUTE_STATIONS[1] ?? getDestinationStation();
}

function getArrivingLeadTime() {
  const configuredLeadTime = Number(ANNOUNCEMENT_CONFIG.arrivingLeadTime);
  return Number.isFinite(configuredLeadTime) && configuredLeadTime >= 0
    ? configuredLeadTime
    : DEFAULT_GAME_SETTINGS.announcement.arrivingLeadTime;
}

function getDoorClosingLeadTime() {
  const configuredLeadTime = Number(DOOR_CLOSING_SOUND_CONFIG.leadTime);
  return Number.isFinite(configuredLeadTime) && configuredLeadTime >= 0
    ? configuredLeadTime
    : DEFAULT_GAME_SETTINGS.doorClosingSound.leadTime;
}

function getStationAnnouncementKey(station, type, legIndex = "") {
  return `${type}:${legIndex}:${station.code}:${station.name}`;
}

function resetCountdowns() {
  state.arrivalRemaining = DURATIONS.arrival;
  state.boardingRemaining = DURATIONS.boarding;
  state.rideRemaining = DURATIONS.ride;
}

function clearStatusTextTimers() {
  window.clearTimeout(statusTextHideTimer);
  window.clearTimeout(statusTextClearTimer);
  statusTextHideTimer = null;
  statusTextClearTimer = null;
}

function hideStatusText(immediate = false) {
  clearStatusTextTimers();
  statusTextEl.classList.remove("visible");

  if (immediate) {
    statusTextEl.hidden = true;
    statusTextEl.textContent = "";
    statusTextEl.classList.remove("success", "danger");
    return;
  }

  statusTextClearTimer = window.setTimeout(() => {
    statusTextEl.hidden = true;
    statusTextEl.textContent = "";
    statusTextEl.classList.remove("success", "danger");
    statusTextClearTimer = null;
  }, STATUS_TEXT_FADE_DURATION);
}

function showStatusText(message, tone) {
  clearStatusTextTimers();
  statusTextEl.textContent = message;
  statusTextEl.hidden = false;
  statusTextEl.classList.toggle("success", tone === "success");
  statusTextEl.classList.toggle("danger", tone === "danger");

  window.requestAnimationFrame(() => {
    statusTextEl.classList.add("visible");
  });

  statusTextHideTimer = window.setTimeout(() => {
    statusTextHideTimer = null;
    hideStatusText();
  }, STATUS_TEXT_DURATION);
}

function clampVolume(volume) {
  const numericVolume = Number(volume);

  if (Number.isNaN(numericVolume)) {
    return TRAIN_SOUND_CONFIG.defaultVolume;
  }

  return Math.min(1, Math.max(0, numericVolume));
}

function logSoundDebug(message, detail = undefined) {
  if (detail === undefined) {
    console.info(`[Train to Bishan sound] ${message}`);
    return;
  }

  console.info(`[Train to Bishan sound] ${message}`, detail);
}

const audioFadeTimers = new WeakMap();

function getAudioFadeDuration() {
  const configuredDuration = Number(AUDIO_FADE_CONFIG.duration);
  const fallbackDuration = DEFAULT_GAME_SETTINGS.audioFade.duration;
  return Number.isFinite(configuredDuration) && configuredDuration >= 0
    ? configuredDuration
    : fallbackDuration;
}

function getAudioFadeTickInterval() {
  const configuredInterval = Number(AUDIO_FADE_CONFIG.tickInterval);
  const fallbackInterval = DEFAULT_GAME_SETTINGS.audioFade.tickInterval;
  return Number.isFinite(configuredInterval) && configuredInterval > 0
    ? configuredInterval
    : fallbackInterval;
}

function getAudioFadeState(audio) {
  if (!audioFadeTimers.has(audio)) {
    audioFadeTimers.set(audio, {
      interval: null,
      fadeOutTimer: null,
      metadataHandler: null,
    });
  }

  return audioFadeTimers.get(audio);
}

function clearAudioFadeInterval(audio) {
  const fadeState = audioFadeTimers.get(audio);

  if (!fadeState?.interval) {
    return;
  }

  window.clearInterval(fadeState.interval);
  fadeState.interval = null;
}

function clearAudioFadeOutTimer(audio) {
  const fadeState = audioFadeTimers.get(audio);

  if (!fadeState) {
    return;
  }

  if (fadeState.fadeOutTimer) {
    window.clearTimeout(fadeState.fadeOutTimer);
    fadeState.fadeOutTimer = null;
  }

  if (fadeState.metadataHandler) {
    audio.removeEventListener("loadedmetadata", fadeState.metadataHandler);
    audio.removeEventListener("durationchange", fadeState.metadataHandler);
    fadeState.metadataHandler = null;
  }
}

function clearAudioFadeTimers(audio) {
  clearAudioFadeInterval(audio);
  clearAudioFadeOutTimer(audio);
  audioFadeTimers.delete(audio);
}

function fadeAudioVolume(audio, targetVolume, duration, onComplete) {
  clearAudioFadeInterval(audio);

  const clampedTargetVolume = clampVolume(targetVolume);
  const fadeDuration = Math.max(0, duration);

  if (audio.muted || fadeDuration <= 0) {
    audio.volume = audio.muted ? 0 : clampedTargetVolume;
    onComplete?.();
    return;
  }

  const fadeState = getAudioFadeState(audio);
  const startVolume = audio.volume;
  const startedAt = performance.now();

  fadeState.interval = window.setInterval(() => {
    const elapsed = performance.now() - startedAt;
    const progress = clamp(elapsed / fadeDuration, 0, 1);
    audio.volume = startVolume + (clampedTargetVolume - startVolume) * progress;

    if (progress >= 1) {
      clearAudioFadeInterval(audio);
      onComplete?.();
    }
  }, getAudioFadeTickInterval());
}

function scheduleAudioFadeOut(audio) {
  clearAudioFadeOutTimer(audio);

  const fadeDuration = getAudioFadeDuration();

  if (audio.muted || fadeDuration <= 0) {
    return;
  }

  const schedule = () => {
    const durationSeconds = audio.duration;

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return;
    }

    const remainingMs = Math.max(0, (durationSeconds - audio.currentTime) * 1000);
    const durationMs = durationSeconds * 1000;
    const effectiveFadeDuration = Math.min(fadeDuration, durationMs / 2);
    const fadeStartDelay = Math.max(0, remainingMs - effectiveFadeDuration);
    const fadeState = getAudioFadeState(audio);

    clearAudioFadeOutTimer(audio);
    fadeState.fadeOutTimer = window.setTimeout(() => {
      if (audio.paused || audio.ended) {
        return;
      }

      const latestRemainingMs = Math.max(0, (audio.duration - audio.currentTime) * 1000);
      fadeAudioVolume(audio, 0, Math.min(effectiveFadeDuration, latestRemainingMs));
    }, fadeStartDelay);
  };

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    schedule();
    return;
  }

  const fadeState = getAudioFadeState(audio);
  fadeState.metadataHandler = schedule;
  audio.addEventListener("loadedmetadata", schedule, { once: true });
  audio.addEventListener("durationchange", schedule, { once: true });
}

function prepareAudioForPlayback(audio, targetVolume) {
  const clampedTargetVolume = clampVolume(targetVolume);

  if (audio.muted || getAudioFadeDuration() <= 0) {
    audio.volume = audio.muted ? 0 : clampedTargetVolume;
    return clampedTargetVolume;
  }

  audio.volume = 0;
  return clampedTargetVolume;
}

function startAudioFades(audio, targetVolume) {
  const clampedTargetVolume = clampVolume(targetVolume);

  if (audio.muted) {
    audio.volume = 0;
    return;
  }

  const fadeDuration = getAudioFadeDuration();

  if (fadeDuration <= 0) {
    audio.volume = clampedTargetVolume;
    return;
  }

  fadeAudioVolume(audio, clampedTargetVolume, fadeDuration);
  scheduleAudioFadeOut(audio);
}

function disposeAudio(audio) {
  clearAudioFadeTimers(audio);
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
}

function stopAudioWithFade(audio, onStopped) {
  clearAudioFadeOutTimer(audio);

  if (audio.muted || audio.paused || audio.ended || getAudioFadeDuration() <= 0) {
    onStopped?.();
    return;
  }

  fadeAudioVolume(audio, 0, getAudioFadeDuration(), onStopped);
}

function getTrainSoundEffects() {
  const configuredEffects = Array.isArray(window.TRAIN_SOUND_EFFECTS)
    ? window.TRAIN_SOUND_EFFECTS
    : [];

  return configuredEffects
    .map((effect) => {
      if (typeof effect === "string") {
        return {
          src: effect,
          volume: TRAIN_SOUND_CONFIG.defaultVolume,
        };
      }

      if (!effect || typeof effect.src !== "string") {
        return null;
      }

      return {
        src: effect.src,
        volume: clampVolume(effect.volume ?? TRAIN_SOUND_CONFIG.defaultVolume),
      };
    })
    .filter(Boolean);
}

let activeStartSound = null;
let activeEndSound = null;

function clearStartSound(immediate = false) {
  if (!activeStartSound) {
    return;
  }

  const audio = activeStartSound;
  activeStartSound = null;

  if (immediate) {
    disposeAudio(audio);
    return;
  }

  stopAudioWithFade(audio, () => disposeAudio(audio));
}

function clearEndSound(immediate = false) {
  if (!activeEndSound) {
    return;
  }

  const audio = activeEndSound;
  activeEndSound = null;

  if (immediate) {
    disposeAudio(audio);
    return;
  }

  stopAudioWithFade(audio, () => disposeAudio(audio));
}

function playStartSound() {
  const src = typeof START_SOUND_CONFIG.src === "string" ? START_SOUND_CONFIG.src.trim() : "";

  if (!src) {
    logSoundDebug("Start sound skipped; no source configured.");
    return;
  }

  clearStartSound();
  logSoundDebug("Playing start sound.", { src });

  const audio = new Audio(src);
  const targetVolume = prepareAudioForPlayback(audio, START_SOUND_CONFIG.volume ?? 1);
  audio.preload = "auto";
  audio.playsInline = true;
  activeStartSound = audio;

  audio.addEventListener("ended", () => {
    if (activeStartSound === audio) {
      activeStartSound = null;
    }

    disposeAudio(audio);
  });

  audio.addEventListener("error", () => {
    if (activeStartSound === audio) {
      activeStartSound = null;
    }

    disposeAudio(audio);
    logSoundDebug("Start sound failed to load.", { src });
  });

  const playAttempt = audio.play();

  if (playAttempt) {
    playAttempt
      .then(() => {
        startAudioFades(audio, targetVolume);
        logSoundDebug("Start sound playback started.", { src });
      })
      .catch((error) => {
        logSoundDebug("Start sound playback was blocked or failed.", {
          src,
          error: error?.message ?? String(error),
        });
        if (activeStartSound === audio) {
          activeStartSound = null;
        }
        disposeAudio(audio);
      });
  }
}

function playEndSound() {
  const src = typeof END_SOUND_CONFIG.src === "string" ? END_SOUND_CONFIG.src.trim() : "";

  if (!src) {
    logSoundDebug("End sound skipped; no source configured.");
    return;
  }

  clearEndSound();
  logSoundDebug("Playing end sound.", { src });

  const audio = new Audio(src);
  const targetVolume = prepareAudioForPlayback(audio, END_SOUND_CONFIG.volume ?? 1);
  audio.preload = "auto";
  audio.playsInline = true;
  activeEndSound = audio;

  audio.addEventListener("ended", () => {
    if (activeEndSound === audio) {
      activeEndSound = null;
    }

    disposeAudio(audio);
  });

  audio.addEventListener("error", () => {
    if (activeEndSound === audio) {
      activeEndSound = null;
    }

    disposeAudio(audio);
    logSoundDebug("End sound failed to load.", { src });
  });

  const playAttempt = audio.play();

  if (playAttempt) {
    playAttempt
      .then(() => {
        startAudioFades(audio, targetVolume);
        logSoundDebug("End sound playback started.", { src });
      })
      .catch((error) => {
        logSoundDebug("End sound playback was blocked or failed.", {
          src,
          error: error?.message ?? String(error),
        });
        if (activeEndSound === audio) {
          activeEndSound = null;
        }
        disposeAudio(audio);
      });
  }
}

function createDoorClosingSoundPlayer() {
  let pending = false;
  let activeAudio = null;

  function getSrc() {
    return typeof DOOR_CLOSING_SOUND_CONFIG.src === "string"
      ? DOOR_CLOSING_SOUND_CONFIG.src.trim()
      : "";
  }

  function clearActiveAudio(immediate = false) {
    if (!activeAudio) {
      return;
    }

    const audio = activeAudio;
    activeAudio = null;

    if (immediate) {
      disposeAudio(audio);
      return;
    }

    stopAudioWithFade(audio, () => disposeAudio(audio));
  }

  function createAudio(muted = false) {
    const audio = new Audio(getSrc());
    audio.volume = muted ? 0 : clampVolume(DOOR_CLOSING_SOUND_CONFIG.volume ?? 1);
    audio.muted = muted;
    audio.preload = "auto";
    audio.playsInline = true;
    return audio;
  }

  return {
    blocked: false,
    hasSound() {
      return Boolean(getSrc());
    },
    unlock() {
      if (!this.hasSound()) {
        logSoundDebug("Door closing sound unlock skipped; no source configured.");
        return;
      }

      const primer = createAudio(true);
      const playAttempt = primer.play();

      if (playAttempt) {
        playAttempt
          .then(() => {
            primer.pause();
            primer.currentTime = 0;
            logSoundDebug("Door closing sound unlocked.", { src: getSrc() });
          })
          .catch((error) => {
            logSoundDebug("Door closing sound unlock failed.", {
              src: getSrc(),
              error: error?.message ?? String(error),
            });
          });
      }
    },
    stop(immediate = false) {
      pending = false;
      this.blocked = false;
      clearActiveAudio(immediate);
    },
    play() {
      if (!this.hasSound()) {
        logSoundDebug("Door closing sound skipped; no source configured.");
        return;
      }

      pending = true;
      this.blocked = false;
      clearActiveAudio();
      logSoundDebug("Playing door closing sound.", { src: getSrc() });

      const audio = createAudio();
      const targetVolume = prepareAudioForPlayback(
        audio,
        DOOR_CLOSING_SOUND_CONFIG.volume ?? 1,
      );
      activeAudio = audio;

      audio.addEventListener("ended", () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }

        disposeAudio(audio);
      });

      audio.addEventListener("error", () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }

        pending = false;
        disposeAudio(audio);
        logSoundDebug("Door closing sound failed to load.", { src: getSrc() });
      });

      const playAttempt = audio.play();

      if (playAttempt) {
        playAttempt
          .then(() => {
            pending = false;
            startAudioFades(audio, targetVolume);
            logSoundDebug("Door closing sound playback started.", { src: getSrc() });
          })
          .catch((error) => {
            clearActiveAudio();

            if (error?.name === "NotAllowedError") {
              this.blocked = true;
              logSoundDebug("Door closing sound blocked by browser.", {
                src: getSrc(),
                error: error.message,
              });
              render();
            } else {
              pending = false;
              logSoundDebug("Door closing sound playback failed.", {
                src: getSrc(),
                error: error?.message ?? String(error),
              });
            }
          });
      }
    },
    enableFromGesture() {
      this.blocked = false;

      if (pending) {
        this.play();
      } else {
        this.unlock();
      }

      render();
    },
  };
}

function getStationAudioSlug(stationName) {
  return stationName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getAnnouncementPrefix(type) {
  if (type === "arriving") {
    return ANNOUNCEMENT_CONFIG.arrivingPrefix ?? "arriving";
  }

  return ANNOUNCEMENT_CONFIG.nextStationPrefix ?? ANNOUNCEMENT_CONFIG.prefix ?? "next_station";
}

function getStationAnnouncementSrc(station, type) {
  const slug = getStationAudioSlug(station.name);
  const prefix = getAnnouncementPrefix(type);
  return `${ANNOUNCEMENT_CONFIG.basePath}/${prefix}_${slug}.${ANNOUNCEMENT_CONFIG.extension}`;
}

function createStationAnnouncementPlayer() {
  let pendingAnnouncement = null;
  const activeAudio = new Set();

  function clearAudio(audio, immediate = false) {
    activeAudio.delete(audio);

    if (immediate) {
      disposeAudio(audio);
      return;
    }

    stopAudioWithFade(audio, () => disposeAudio(audio));
  }

  function createAudio(station, type, muted = false) {
    const audio = new Audio(getStationAnnouncementSrc(station, type));
    audio.volume = muted ? 0 : clampVolume(ANNOUNCEMENT_CONFIG.volume);
    audio.muted = muted;
    audio.preload = "auto";
    audio.playsInline = true;
    return audio;
  }

  function isPending(station, type) {
    return pendingAnnouncement?.station === station && pendingAnnouncement?.type === type;
  }

  return {
    blocked: false,
    unlock() {
      const primer = createAudio(getFirstNextStation(), "next", true);
      logSoundDebug("Unlocking station announcement audio.", { src: primer.src });
      const playAttempt = primer.play();

      if (playAttempt) {
        playAttempt
          .then(() => {
            primer.pause();
            primer.currentTime = 0;
            logSoundDebug("Station announcement audio unlocked.", { src: primer.src });
          })
          .catch((error) => {
            logSoundDebug("Station announcement unlock failed.", {
              src: primer.src,
              error: error?.message ?? String(error),
            });
          });
      }
    },
    stop(immediate = false) {
      pendingAnnouncement = null;
      this.blocked = false;
      activeAudio.forEach((audio) => clearAudio(audio, immediate));
      activeAudio.clear();
    },
    playStationAnnouncement(station, type) {
      pendingAnnouncement = { station, type };
      this.blocked = false;

      const audio = createAudio(station, type);
      const targetVolume = prepareAudioForPlayback(audio, ANNOUNCEMENT_CONFIG.volume);
      activeAudio.add(audio);
      const src = audio.src;
      logSoundDebug("Playing station announcement.", {
        type,
        station: station.name,
        src,
      });

      audio.addEventListener("ended", () => {
        clearAudio(audio);
      });

      audio.addEventListener("error", () => {
        if (isPending(station, type)) {
          pendingAnnouncement = null;
        }

        clearAudio(audio);
        logSoundDebug("Station announcement failed to load.", {
          type,
          station: station.name,
          src,
        });
      });

      const playAttempt = audio.play();

      if (playAttempt) {
        playAttempt
          .then(() => {
            if (isPending(station, type)) {
              pendingAnnouncement = null;
            }
            startAudioFades(audio, targetVolume);
            logSoundDebug("Station announcement playback started.", {
              type,
              station: station.name,
              src,
            });
          })
          .catch((error) => {
            clearAudio(audio);

            if (error?.name === "NotAllowedError") {
              this.blocked = true;
              logSoundDebug("Station announcement blocked by browser.", {
                type,
                station: station.name,
                src,
                error: error.message,
              });
              render();
            } else if (isPending(station, type)) {
              pendingAnnouncement = null;
              logSoundDebug("Station announcement playback failed.", {
                type,
                station: station.name,
                src,
                error: error?.message ?? String(error),
              });
            } else {
              logSoundDebug("Station announcement playback failed.", {
                type,
                station: station.name,
                src,
                error: error?.message ?? String(error),
              });
            }
          });
      }
    },
    playNextStation(station) {
      this.playStationAnnouncement(station, "next");
    },
    playArrivingAtStation(station) {
      this.playStationAnnouncement(station, "arriving");
    },
    enableFromGesture() {
      this.blocked = false;

      if (pendingAnnouncement) {
        this.playStationAnnouncement(pendingAnnouncement.station, pendingAnnouncement.type);
      } else {
        this.unlock();
      }

      render();
    },
  };
}

function createTrainSoundscape() {
  let effects = getTrainSoundEffects();
  const activeAudio = new Set();

  function refresh() {
    effects = getTrainSoundEffects();
  }

  function clearAudio(audio, immediate = false) {
    activeAudio.delete(audio);

    if (immediate) {
      disposeAudio(audio);
      return;
    }

    stopAudioWithFade(audio, () => disposeAudio(audio));
  }

  return {
    blocked: false,
    nextAt: Number.POSITIVE_INFINITY,
    hasSounds() {
      refresh();
      return effects.length > 0;
    },
    unlock() {
      refresh();

      if (effects.length === 0) {
        logSoundDebug("Random train sound unlock skipped; playlist is empty.");
        return;
      }

      const primer = new Audio(effects[0].src);
      primer.muted = true;
      primer.volume = 0;
      primer.preload = "auto";
      primer.playsInline = true;

      const playAttempt = primer.play();

      if (playAttempt) {
        playAttempt
          .then(() => {
            primer.pause();
            primer.currentTime = 0;
            logSoundDebug("Random train sound audio unlocked.", { src: effects[0].src });
          })
          .catch((error) => {
            logSoundDebug("Random train sound unlock failed.", {
              src: effects[0].src,
              error: error?.message ?? String(error),
            });
          });
      }
    },
    start(now = performance.now()) {
      refresh();
      this.blocked = false;
      this.scheduleNext(
        now,
        TRAIN_SOUND_CONFIG.firstMinDelay,
        TRAIN_SOUND_CONFIG.firstMaxDelay,
      );
      logSoundDebug("Random train soundscape started.", { sounds: effects.length });
    },
    stop(immediate = false) {
      this.nextAt = Number.POSITIVE_INFINITY;
      activeAudio.forEach((audio) => clearAudio(audio, immediate));
      activeAudio.clear();
    },
    scheduleNext(now, min = TRAIN_SOUND_CONFIG.minDelay, max = TRAIN_SOUND_CONFIG.maxDelay) {
      refresh();
      this.nextAt =
        effects.length === 0 ? Number.POSITIVE_INFINITY : now + randomBetween(min, max);
      if (effects.length > 0) {
        logSoundDebug("Scheduled next random train sound.", {
          delayMs: Math.round(this.nextAt - now),
        });
      }
    },
    tick(now, canPlay) {
      if (state.phase !== "riding" || !canPlay || effects.length === 0) {
        return;
      }

      if (now >= this.nextAt) {
        this.playRandom();
        this.scheduleNext(now);
      }
    },
    playRandom() {
      refresh();

      if (effects.length === 0) {
        logSoundDebug("Random train sound skipped; playlist is empty.");
        return;
      }

      if (activeAudio.size >= TRAIN_SOUND_CONFIG.maxConcurrent) {
        logSoundDebug("Random train sound delayed; max concurrent sounds active.", {
          active: activeAudio.size,
        });
        this.scheduleNext(
          performance.now(),
          TRAIN_SOUND_CONFIG.retryMinDelay,
          TRAIN_SOUND_CONFIG.retryMaxDelay,
        );
        return;
      }

      const effect = effects[Math.floor(Math.random() * effects.length)];
      const audio = new Audio(effect.src);
      const src = effect.src;
      const targetVolume = prepareAudioForPlayback(audio, effect.volume);
      audio.preload = "auto";
      audio.playsInline = true;

      audio.addEventListener(
        "ended",
        () => {
          clearAudio(audio);
        },
        { once: true },
      );
      audio.addEventListener(
        "error",
        () => {
          clearAudio(audio);
          logSoundDebug("Random train sound failed to load.", { src });
        },
        { once: true },
      );

      activeAudio.add(audio);
      logSoundDebug("Playing random train sound.", { src });

      const playAttempt = audio.play();

      if (playAttempt) {
        playAttempt
          .then(() => {
            startAudioFades(audio, targetVolume);
            logSoundDebug("Random train sound playback started.", { src });
          })
          .catch((error) => {
            this.blocked = true;
            clearAudio(audio);
            logSoundDebug("Random train sound blocked or failed.", {
              src,
              error: error?.message ?? String(error),
            });
            render();
          });
      }
    },
    enableFromGesture() {
      this.blocked = false;
      this.unlock();

      if (state.phase === "riding") {
        this.playRandom();
        this.scheduleNext(performance.now());
      }

      render();
    },
  };
}

const trainSoundscape = createTrainSoundscape();
const stationAnnouncementPlayer = createStationAnnouncementPlayer();
const doorClosingPlayer = createDoorClosingSoundPlayer();
const startScreenEl = document.querySelector("#startScreen");
const playScreenEl = document.querySelector("#playScreen");
const successScreenEl = document.querySelector("#successScreen");

function mediaMatches(query) {
  return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}

function isLikelyComputer() {
  const hasMouseLikePointer = mediaMatches("(pointer: fine)");
  const canHover = mediaMatches("(hover: hover)");
  const hasCoarsePointer = mediaMatches("(pointer: coarse)");
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobi|Mobile/i.test(navigator.userAgent);

  return (hasMouseLikePointer && canHover) || (!mobileUserAgent && !hasCoarsePointer);
}

function shouldCheckUpright() {
  return !isLikelyComputer();
}

function canUseRealMotion() {
  return "DeviceOrientationEvent" in window;
}

function realMotionIsFresh(now = performance.now()) {
  return (
    state.orientation.beta !== null &&
    state.orientation.gamma !== null &&
    now - state.orientation.seenAt < UPRIGHT.staleAfter
  );
}

function getUprightCheckInterval() {
  const configuredInterval = Number(UPRIGHT.checkInterval);
  const fallbackInterval = DEFAULT_GAME_SETTINGS.upright.checkInterval;
  return Number.isFinite(configuredInterval) && configuredInterval >= 0
    ? configuredInterval
    : fallbackInterval;
}

function isRealUpright(now = performance.now()) {
  if (!realMotionIsFresh(now)) {
    return false;
  }

  const beta = Math.abs(state.orientation.beta);
  const gamma = Math.abs(state.orientation.gamma);
  return beta >= UPRIGHT.betaMin && beta <= UPRIGHT.betaMax && gamma <= UPRIGHT.gammaMax;
}

function isPhoneUpright(now = performance.now()) {
  if (!shouldCheckUpright()) {
    return true;
  }

  if (state.usingSimulatedMotion || !canUseRealMotion()) {
    return state.simulatedUpright;
  }

  if (now - state.uprightCheck.checkedAt < getUprightCheckInterval()) {
    return state.uprightCheck.upright;
  }

  state.uprightCheck.checkedAt = now;
  state.uprightCheck.upright = isRealUpright(now);
  return state.uprightCheck.upright;
}

function phaseNeedsUpright() {
  if (!shouldCheckUpright()) {
    return false;
  }

  if (state.phase === "waiting" || state.phase === "boarding") {
    return true;
  }

  return state.phase === "riding" && !state.seated;
}

function countdownCanMove(now) {
  return !phaseNeedsUpright() || isPhoneUpright(now);
}

async function requestMotionAccess() {
  if (!shouldCheckUpright()) {
    state.usingSimulatedMotion = false;
    state.motionPermission = "not-needed";
    return;
  }

  if (!canUseRealMotion()) {
    state.usingSimulatedMotion = true;
    state.motionPermission = "fallback";
    return;
  }

  const eventConstructor = window.DeviceOrientationEvent;

  if (typeof eventConstructor.requestPermission === "function") {
    try {
      const response = await eventConstructor.requestPermission();
      state.motionPermission = response;
      if (response !== "granted") {
        state.usingSimulatedMotion = true;
      }
    } catch {
      state.motionPermission = "denied";
      state.usingSimulatedMotion = true;
    }
  } else {
    state.motionPermission = "granted";
  }
}

function handleOrientation(event) {
  state.orientation.beta = event.beta;
  state.orientation.gamma = event.gamma;
  state.orientation.seenAt = performance.now();

  if (state.motionPermission === "unknown") {
    state.motionPermission = "granted";
  }
}

function stopAllAudio(immediate = false) {
  clearStartSound(immediate);
  clearEndSound(immediate);
  trainSoundscape.stop(immediate);
  stationAnnouncementPlayer.stop(immediate);
  doorClosingPlayer.stop(immediate);
}

function canDemoSkip() {
  return DEMO_SKIP_ENABLED && state.phase !== "idle" && state.phase !== "arrived";
}

function getNextStationElapsed() {
  const stationSegment = getStationSegment();
  const stationDurations = getStationDurations();
  const elapsed = getRideElapsed();

  if (stationSegment.mode === "travel") {
    return elapsed + stationSegment.remaining;
  }

  if (stationSegment.mode === "dwell") {
    const nextLegDuration = stationDurations[stationSegment.legIndex + 1] ?? 0;
    return elapsed + stationSegment.remaining + nextLegDuration;
  }

  return DURATIONS.ride;
}

function skipRidingToNextStation() {
  const rideDuration = DURATIONS.ride;
  const targetElapsed = Math.min(rideDuration, getNextStationElapsed());
  state.rideRemaining = Math.max(0, rideDuration - targetElapsed);
  state.lastTick = performance.now();
  state.lastActionKey = "none:false";
  resetAuntieEvent();

  if (state.rideRemaining <= 0) {
    finishRide();
    return;
  }

  trainSoundscape.start(performance.now());
  render();
}

function skipToNextStation() {
  if (!canDemoSkip()) {
    return;
  }

  stopPretendSleep();
  stopAllAudio(true);
  state.lastTick = performance.now();

  if (state.phase === "waiting") {
    state.arrivalRemaining = 0;
    startBoarding();
    stopAllAudio(true);
    render();
    return;
  }

  if (state.phase === "boarding") {
    state.boardingRemaining = 0;
    startRide(state.seatProgress >= SEAT_RUSH_CONFIG.seatThreshold);
    stopAllAudio(true);
    skipRidingToNextStation();
    return;
  }

  if (state.phase === "riding") {
    skipRidingToNextStation();
  }
}

function resetState() {
  hideStatusText(true);
  clearStartSound();
  clearEndSound();
  trainSoundscape.stop();
  stationAnnouncementPlayer.stop();
  doorClosingPlayer.stop();
  state.phase = "idle";
  state.lastTick = 0;
  resetCountdowns();
  state.seatProgress = 0;
  state.seated = false;
  state.nextStationAnnouncementsPlayed = new Set();
  state.arrivingAnnouncementsPlayed = new Set();
  state.doorClosingAnnouncementsPlayed = new Set();
  state.auntieDeparturesChecked = new Set();
  resetAuntieEvent();
  state.lastActionKey = "none:false";
  state.simulatedUpright = true;
  state.uprightCheck.checkedAt = Number.NEGATIVE_INFINITY;
  state.uprightCheck.upright = true;
  render();
}

function startWaiting() {
  hideStatusText(true);
  clearEndSound();
  trainSoundscape.stop();
  stationAnnouncementPlayer.stop();
  doorClosingPlayer.stop();
  state.phase = "waiting";
  state.lastTick = performance.now();
  resetCountdowns();
  state.seatProgress = 0;
  state.seated = false;
  state.nextStationAnnouncementsPlayed = new Set();
  state.arrivingAnnouncementsPlayed = new Set();
  state.doorClosingAnnouncementsPlayed = new Set();
  state.auntieDeparturesChecked = new Set();
  resetAuntieEvent();
  state.lastActionKey = "none:false";
  state.uprightCheck.checkedAt = Number.NEGATIVE_INFINITY;
  state.uprightCheck.upright = true;
  requestAnimationFrame(tick);
  render();
}

function startBoarding() {
  state.phase = "boarding";
  state.boardingRemaining = DURATIONS.boarding;
  state.seatProgress = 0;
  vibrate(VIBRATION_CONFIG.boardingStart);
  render();
}

function startRide(seated) {
  state.phase = "riding";
  state.seated = seated;
  state.rideRemaining = DURATIONS.ride;
  state.nextStationAnnouncementsPlayed = new Set();
  state.arrivingAnnouncementsPlayed = new Set();
  state.doorClosingAnnouncementsPlayed = new Set();
  state.auntieDeparturesChecked = new Set();
  resetAuntieEvent();
  playDueNextStationAnnouncement();
  trainSoundscape.start();
  vibrate(seated ? VIBRATION_CONFIG.seated : VIBRATION_CONFIG.standing);
  showStatusText(
    seated ? "Seat secured!" : "Failed to get a seat! Standing it shall be...",
    seated ? "success" : "danger",
  );
  render();
}

function finishRide() {
  hideStatusText(true);
  resetAuntieEvent();
  trainSoundscape.stop();
  state.phase = "arrived";
  state.rideRemaining = 0;
  vibrate(VIBRATION_CONFIG.arrival);
  playEndSound();
  render();
}

function rush() {
  if (state.phase !== "boarding" || !countdownCanMove(performance.now())) {
    return;
  }

  state.seatProgress = clamp(state.seatProgress + SEAT_RUSH_CONFIG.gainPerPress, 0, 1);
  queueEl.classList.add("rushing");
  window.setTimeout(() => queueEl.classList.remove("rushing"), 120);
  vibrate(VIBRATION_CONFIG.rushTap);

  render();
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function playDueArrivingAnnouncement() {
  if (state.phase !== "riding") {
    return;
  }

  const stationSegment = getStationSegment();

  if (stationSegment.mode !== "travel") {
    return;
  }

  const leadTime = getArrivingLeadTime();

  if (stationSegment.remaining > leadTime) {
    return;
  }

  const key = getStationAnnouncementKey(
    stationSegment.next,
    "arriving",
    stationSegment.legIndex,
  );

  if (state.arrivingAnnouncementsPlayed.has(key)) {
    return;
  }

  state.arrivingAnnouncementsPlayed.add(key);
  stationAnnouncementPlayer.playArrivingAtStation(stationSegment.next);
}

function playDueNextStationAnnouncement() {
  if (state.phase !== "riding") {
    return;
  }

  const stationSegment = getStationSegment();

  if (stationSegment.mode !== "travel") {
    return;
  }

  const key = getStationAnnouncementKey(
    stationSegment.next,
    "next",
    stationSegment.legIndex,
  );

  if (state.nextStationAnnouncementsPlayed.has(key)) {
    return;
  }

  state.nextStationAnnouncementsPlayed.add(key);
  stationAnnouncementPlayer.playNextStation(stationSegment.next);
  maybeStartAuntieEvent(stationSegment);
}

function playDueDoorClosingSound() {
  const leadTime = getDoorClosingLeadTime();
  let key = "";

  if (state.phase === "boarding") {
    if (state.boardingRemaining > leadTime) {
      return;
    }

    key = getStationAnnouncementKey(getOriginStation(), "doors", "boarding");
  } else if (state.phase === "riding") {
    const stationSegment = getStationSegment();

    if (stationSegment.mode !== "dwell" || stationSegment.remaining > leadTime) {
      return;
    }

    key = getStationAnnouncementKey(stationSegment.current, "doors", stationSegment.legIndex);
  } else {
    return;
  }

  if (state.doorClosingAnnouncementsPlayed.has(key)) {
    return;
  }

  state.doorClosingAnnouncementsPlayed.add(key);
  doorClosingPlayer.play();
}

function tick(now) {
  if (state.phase === "idle" || state.phase === "arrived") {
    return;
  }

  const elapsed = Math.min(250, now - state.lastTick);
  state.lastTick = now;

  const canMove = countdownCanMove(now);

  if (canMove) {
    if (state.phase === "waiting") {
      state.arrivalRemaining -= elapsed;

      if (state.arrivalRemaining <= 0) {
        state.arrivalRemaining = 0;
        startBoarding();
      }
    } else if (state.phase === "boarding") {
      state.boardingRemaining -= elapsed;
      state.seatProgress = clamp(
        state.seatProgress - SEAT_RUSH_CONFIG.decayPerSecond * (elapsed / 1000),
        0,
        1,
      );
      playDueDoorClosingSound();

      if (state.boardingRemaining <= 0) {
        state.boardingRemaining = 0;
        startRide(state.seatProgress >= SEAT_RUSH_CONFIG.seatThreshold);
      }
    } else if (state.phase === "riding") {
      state.rideRemaining -= elapsed;
      playDueNextStationAnnouncement();
      playDueArrivingAnnouncement();
      playDueDoorClosingSound();
      updateAuntieEvent(elapsed);

      if (state.rideRemaining <= 0) {
        finishRide();
      }
    }
  }

  trainSoundscape.tick(now, canMove);
  render();
  requestAnimationFrame(tick);
}

function render() {
  const now = performance.now();
  const upright = isPhoneUpright(now);
  const paused = phaseNeedsUpright() && !upright;
  const usesUprightCheck = shouldCheckUpright();
  const needsMotionFallback =
    usesUprightCheck &&
    (state.usingSimulatedMotion ||
      !canUseRealMotion() ||
      (state.phase !== "idle" &&
        state.motionPermission === "granted" &&
        !realMotionIsFresh(now)));

  startScreenEl.hidden = state.phase !== "idle";
  playScreenEl.hidden = state.phase === "idle" || state.phase === "arrived";
  successScreenEl.hidden = state.phase !== "arrived";
  gameEl.classList.toggle("paused", paused);
  document.body.classList.toggle("arrival-pulse", state.phase === "boarding");
  trainEl.classList.toggle("arrived", state.phase !== "idle" && state.arrivalRemaining <= 0);
  trainEl.classList.toggle("boarding", state.phase === "boarding");
  queueEl.classList.toggle("hidden", state.phase === "riding" || state.phase === "arrived");
  trainInteriorEl.hidden = state.phase !== "riding" && state.phase !== "arrived";
  statusRibbonEl.classList.remove("success", "danger");

  sensorFallbackEl.hidden = !needsMotionFallback;
  sensorFallbackEl.textContent = state.simulatedUpright ? "Simulated upright" : "Simulated tilted";

  renderDeviceIndicator();
  renderRouteCopy();
  renderSceneStationSign();
  renderSuccessScreen();
  renderStationSegment();
  renderAuntieEvent();
  renderDemoSkip();
  renderPhaseCopy(paused, upright);
  renderTimers();
  renderActions();
}

function renderDeviceIndicator() {
  const desktopMode = isLikelyComputer();
  deviceIndicatorEl.textContent = desktopMode ? "desktop_windows" : "smartphone";
  deviceIndicatorEl.setAttribute("aria-label", desktopMode ? "Desktop device" : "Mobile device");
  deviceIndicatorEl.removeAttribute("title");
}

function renderRouteCopy() {
  const destination = getDestinationStation();

  routeTitleEl.textContent = `Train to ${destination.name}`;
  routeSubtitleEl.innerHTML = MAIN_SUBTITLE_HTML;
  successHeadingEl.textContent = `You Survived Train to ${destination.name}!`;
  successStationCodeEl.textContent = destination.code;
}

function getSceneStation() {
  if (state.phase === "riding" || state.phase === "arrived") {
    return getStationSegment().current;
  }

  return getOriginStation();
}

function renderSceneStationSign() {
  const station = getSceneStation();
  stationSignCodeEl.textContent = station.code;
  stationSignNameEl.textContent = station.name;
}

function renderSuccessScreen() {
  if (state.phase !== "arrived") {
    return;
  }

  const destination = getDestinationStation();
  successMessageEl.textContent = `You made it to ${destination.name}!`;
}

function renderStationSegment() {
  const stationSegment = getStationSegment();
  currentStationNameEl.textContent = stationSegment.current.name;
  nextStationNameEl.textContent = stationSegment.next.name;
  segmentProgressEl.style.width = `${Math.round(stationSegment.progress * 100)}%`;
}

function renderAuntieEvent() {
  sleepDimEl.style.opacity = state.auntieDimLevel.toFixed(3);
  auntieImageEl.src = getAuntieImageSrc();
  auntieEventEl.style.setProperty(
    "--auntie-slide-duration",
    `${Math.round(getAuntieSlideDuration())}ms`,
  );
  auntieEventEl.classList.toggle("from-left", state.auntieSide !== "right");
  auntieEventEl.classList.toggle("from-right", state.auntieSide === "right");

  if (!state.auntieActive) {
    auntieEventEl.classList.remove("visible");
    auntieEventEl.hidden = true;
    return;
  }

  const wasHidden = auntieEventEl.hidden;
  auntieEventEl.hidden = false;

  if (wasHidden) {
    auntieEventEl.classList.remove("visible");
    window.requestAnimationFrame(() => {
      if (state.auntieActive) {
        auntieEventEl.classList.add("visible");
      }
    });
    return;
  }

  auntieEventEl.classList.add("visible");
}

function renderDemoSkip() {
  skipButtonEl.hidden = !DEMO_SKIP_ENABLED;
  skipButtonEl.disabled = !canDemoSkip();
}

function renderPhaseCopy(paused, upright) {
  const usesUprightCheck = shouldCheckUpright();
  const origin = getOriginStation();
  const destination = getDestinationStation();

  if (state.phase === "idle") {
    statusRibbonEl.textContent = "Platform queue forming";
    messageEl.textContent = "Tap start when you are at the platform.";
    return;
  }

  if (paused) {
    statusRibbonEl.textContent = "Timer paused";
    messageEl.textContent = "Phone is not being held upright!";
    return;
  }

  if (state.phase === "waiting") {
    statusRibbonEl.textContent = `Train approaching ${origin.name}`;
    messageEl.textContent = usesUprightCheck
      ? "Stay upright in the queue."
      : "Wait in the queue until the train arrives.";
    return;
  }

  if (state.phase === "boarding") {
    statusRibbonEl.textContent = "Doors open";
    messageEl.textContent = "Keep the seat meter above 95% before the doors close.";
    return;
  }

  if (state.phase === "riding" && state.seated && state.auntieActive) {
    statusRibbonEl.textContent = "Auntie wants your seat";
    messageEl.textContent = "Pretend to sleep.";
    return;
  }

  if (state.phase === "riding" && state.seated) {
    statusRibbonEl.textContent = `On board to ${destination.name}`;
    messageEl.textContent = "You can rest the phone while the ride continues.";
    return;
  }

  if (state.phase === "riding") {
    statusRibbonEl.textContent = `On board to ${destination.name}`;
    messageEl.textContent = usesUprightCheck
      ? `Keep the phone upright until ${destination.name}.`
      : "Ride it out standing until a seat becomes available.";
    return;
  }

  statusRibbonEl.textContent = `Arrived at ${destination.name} station`;
  messageEl.textContent = state.seated
    ? `You made it to ${destination.name} station with a seat.`
    : `You made it to ${destination.name} station standing.`;
}

function renderTimers() {
  metersEl.hidden = true;
  primaryMeterEl.hidden = true;
  metersEl.classList.add("single");
}

function getActionState(now = performance.now()) {
  if (state.phase === "boarding") {
    return {
      enabled: countdownCanMove(now),
      label: `SNATCH SEAT!!! ${formatTime(state.boardingRemaining)}`,
      type: "rush",
    };
  }

  if (state.phase === "riding" && state.seated && state.auntieActive) {
    return {
      enabled: true,
      label: "Pretend to sleep",
      type: "sleep",
    };
  }

  if (
    state.phase === "riding" &&
    (stationAnnouncementPlayer.blocked ||
      doorClosingPlayer.blocked ||
      (trainSoundscape.blocked && trainSoundscape.hasSounds()))
  ) {
    return {
      enabled: true,
      label: "Enable sound",
      type: "sound",
    };
  }

  if (state.phase === "arrived") {
    return {
      enabled: true,
      label: "Play again",
      type: "reset",
    };
  }

  if (phaseNeedsUpright() && !countdownCanMove(now)) {
    return {
      enabled: false,
      label: "Hold phone upright",
      type: "none",
    };
  }

  if (state.phase === "waiting") {
    return {
      enabled: false,
      label: formatTime(state.arrivalRemaining),
      type: "none",
    };
  }

  if (state.phase === "riding") {
    const stationSegment = getStationSegment();

    return {
      enabled: false,
      label: formatTime(stationSegment.remaining),
      type: "none",
    };
  }

  return {
    enabled: false,
    label: "Waiting",
    type: "none",
  };
}

function triggerAction() {
  const action = getActionState();

  if (!action.enabled) {
    return;
  }

  if (action.type === "rush") {
    if (doorClosingPlayer.blocked) {
      doorClosingPlayer.enableFromGesture();
    }

    rush();
  } else if (action.type === "sound") {
    stationAnnouncementPlayer.enableFromGesture();
    doorClosingPlayer.enableFromGesture();
    trainSoundscape.enableFromGesture();
  } else if (action.type === "reset") {
    resetState();
  }
}

function renderActions() {
  const action = getActionState();
  const actionKey = `${action.type}:${action.enabled}`;
  const actionJustActivated = action.enabled && actionKey !== state.lastActionKey;

  if (actionJustActivated) {
    vibrate(VIBRATION_CONFIG.actionActivation);
  }

  state.lastActionKey = actionKey;
  startButtonEl.hidden = state.phase !== "idle";
  actionButtonEl.textContent = action.label;
  actionButtonEl.disabled = !action.enabled;
  actionButtonEl.dataset.action = action.type;
  actionButtonEl.style.setProperty("--seat-progress-ratio", state.seatProgress.toFixed(3));
  actionButtonEl.classList.toggle(
    "seat-ready",
    state.phase === "boarding" && state.seatProgress >= SEAT_RUSH_CONFIG.seatThreshold,
  );
}

startButtonEl.addEventListener("click", async () => {
  playStartSound();
  stationAnnouncementPlayer.unlock();
  doorClosingPlayer.unlock();
  trainSoundscape.unlock();
  await requestMotionAccess();
  startWaiting();
});

actionButtonEl.addEventListener("click", triggerAction);

actionButtonEl.addEventListener("pointerdown", (event) => {
  if (!isSleepActionActive()) {
    return;
  }

  event.preventDefault();
  startPretendSleep();

  if (typeof actionButtonEl.setPointerCapture === "function") {
    actionButtonEl.setPointerCapture(event.pointerId);
  }
});

window.addEventListener("pointerup", stopPretendSleep);
window.addEventListener("pointercancel", stopPretendSleep);

successRestartButtonEl.addEventListener("click", resetState);

skipButtonEl.addEventListener("click", skipToNextStation);

sensorFallbackEl.addEventListener("click", () => {
  state.usingSimulatedMotion = true;
  state.simulatedUpright = !state.simulatedUpright;
  render();
});

window.addEventListener("deviceorientation", handleOrientation);

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "u") {
    state.usingSimulatedMotion = true;
    state.simulatedUpright = !state.simulatedUpright;
    render();
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (isSleepActionActive()) {
      if (!event.repeat) {
        startPretendSleep();
      }
      return;
    }

    triggerAction();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    stopPretendSleep();
  }
});

async function initializeGame() {
  await loadGameSettings();
  resetCountdowns();
  render();
}

initializeGame();
