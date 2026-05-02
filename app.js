const CONFIG_PATH = "config/game-config.json";
const SCRIPT_CONFIG_GLOBAL = "TRAIN_TO_BISHAN_GAME_CONFIG";
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
    betaMin: 52,
    betaMax: 128,
    gammaMax: 38,
    staleAfter: 1600,
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
  startSound: {
    src: "sounds/train_service_ends_at_bishan.ogg",
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
let START_SOUND_CONFIG = { ...DEFAULT_GAME_SETTINGS.startSound };
let DOOR_CLOSING_SOUND_CONFIG = { ...DEFAULT_GAME_SETTINGS.doorClosingSound };
let ANNOUNCEMENT_CONFIG = { ...DEFAULT_GAME_SETTINGS.announcement };
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
  START_SOUND_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.startSound,
    ...readObject(externalSettings.startSound),
  };
  DOOR_CLOSING_SOUND_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.doorClosingSound,
    ...readObject(externalSettings.doorClosingSound),
  };
  ANNOUNCEMENT_CONFIG = {
    ...DEFAULT_GAME_SETTINGS.announcement,
    ...readObject(externalSettings.announcement),
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
  lastActionKey: "none:false",
  motionPermission: "unknown",
  usingSimulatedMotion: false,
  simulatedUpright: true,
  orientation: {
    beta: null,
    gamma: null,
    seenAt: 0,
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

function getStationSegment() {
  const stationDurations = getStationDurations();
  const rideDuration = DURATIONS.ride;
  let elapsed =
    state.phase === "riding" || state.phase === "arrived"
      ? Math.max(0, Math.min(rideDuration, rideDuration - state.rideRemaining))
      : 0;

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

function clearStartSound() {
  if (!activeStartSound) {
    return;
  }

  activeStartSound.pause();
  activeStartSound.removeAttribute("src");
  activeStartSound.load();
  activeStartSound = null;
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
  audio.volume = clampVolume(START_SOUND_CONFIG.volume ?? 1);
  audio.preload = "auto";
  audio.playsInline = true;
  activeStartSound = audio;

  audio.addEventListener("ended", () => {
    if (activeStartSound === audio) {
      activeStartSound = null;
    }

    logSoundDebug("Start sound ended.", { src });
  });

  audio.addEventListener("error", () => {
    if (activeStartSound === audio) {
      activeStartSound = null;
    }

    logSoundDebug("Start sound failed to load.", { src });
  });

  const playAttempt = audio.play();

  if (playAttempt) {
    playAttempt
      .then(() => {
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

  function clearActiveAudio() {
    if (!activeAudio) {
      return;
    }

    activeAudio.pause();
    activeAudio.removeAttribute("src");
    activeAudio.load();
    activeAudio = null;
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
    stop() {
      pending = false;
      this.blocked = false;
      clearActiveAudio();
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
      activeAudio = audio;

      audio.addEventListener("ended", () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }

        logSoundDebug("Door closing sound ended.", { src: getSrc() });
      });

      audio.addEventListener("error", () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }

        pending = false;
        logSoundDebug("Door closing sound failed to load.", { src: getSrc() });
      });

      const playAttempt = audio.play();

      if (playAttempt) {
        playAttempt
          .then(() => {
            pending = false;
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

  function clearAudio(audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    activeAudio.delete(audio);
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
    stop() {
      pendingAnnouncement = null;
      this.blocked = false;
      activeAudio.forEach(clearAudio);
      activeAudio.clear();
    },
    playStationAnnouncement(station, type) {
      pendingAnnouncement = { station, type };
      this.blocked = false;

      const audio = createAudio(station, type);
      activeAudio.add(audio);
      const src = audio.src;
      logSoundDebug("Playing station announcement.", {
        type,
        station: station.name,
        src,
      });

      audio.addEventListener("ended", () => {
        clearAudio(audio);
        logSoundDebug("Station announcement ended.", {
          type,
          station: station.name,
          src,
        });
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

  function clearAudio(audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    activeAudio.delete(audio);
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
    stop() {
      this.nextAt = Number.POSITIVE_INFINITY;
      activeAudio.forEach(clearAudio);
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
      audio.volume = effect.volume;
      audio.preload = "auto";
      audio.playsInline = true;

      audio.addEventListener(
        "ended",
        () => {
          clearAudio(audio);
          logSoundDebug("Random train sound ended.", { src });
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

  return isRealUpright(now);
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

function resetState() {
  hideStatusText(true);
  clearStartSound();
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
  state.lastActionKey = "none:false";
  state.simulatedUpright = true;
  render();
}

function startWaiting() {
  hideStatusText(true);
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
  state.lastActionKey = "none:false";
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
  trainSoundscape.stop();
  state.phase = "arrived";
  state.rideRemaining = 0;
  vibrate(VIBRATION_CONFIG.arrival);
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
  const origin = getOriginStation();
  const destination = getDestinationStation();

  routeTitleEl.textContent = `Train to ${destination.name}`;
  routeSubtitleEl.textContent = `${origin.name} to ${destination.name} station`;
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
  successMessageEl.textContent = state.seated
    ? `You made it to ${destination.name} station with a seat.`
    : `You made it to ${destination.name} station standing.`;
}

function renderStationSegment() {
  const stationSegment = getStationSegment();
  currentStationNameEl.textContent = stationSegment.current.name;
  nextStationNameEl.textContent = stationSegment.next.name;
  segmentProgressEl.style.width = `${Math.round(stationSegment.progress * 100)}%`;
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
    messageEl.textContent = "Phone is not being held upright.";
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

  if (state.phase === "riding" && state.seated) {
    statusRibbonEl.textContent = `On board to ${destination.name}`;
    messageEl.textContent = "You can rest the phone while the ride continues.";
    return;
  }

  if (state.phase === "riding") {
    statusRibbonEl.textContent = `On board to ${destination.name}`;
    messageEl.textContent = usesUprightCheck
      ? `Keep the phone upright until ${destination.name}.`
      : `Ride it out standing until ${destination.name}.`;
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

successRestartButtonEl.addEventListener("click", resetState);

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
    triggerAction();
  }
});

async function initializeGame() {
  await loadGameSettings();
  resetCountdowns();
  render();
}

initializeGame();
