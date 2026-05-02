const DURATIONS = {
  arrival: 60_000,
  boarding: 8_000,
  ride: 90_000,
};

const SEAT_TARGET = 32;
const UPRIGHT = {
  betaMin: 52,
  betaMax: 128,
  gammaMax: 38,
  staleAfter: 1600,
};

const gameEl = document.querySelector(".game");
const trainEl = document.querySelector("#train");
const queueEl = document.querySelector("#queue");
const seatRowEl = document.querySelector("#seatRow");
const handrailEl = document.querySelector("#handrail");
const statusRibbonEl = document.querySelector("#statusRibbon");
const primaryLabelEl = document.querySelector("#primaryLabel");
const primaryTimerEl = document.querySelector("#primaryTimer");
const postureLabelEl = document.querySelector("#postureLabel");
const routeProgressEl = document.querySelector("#routeProgress");
const rushPanelEl = document.querySelector("#rushPanel");
const rushCountEl = document.querySelector("#rushCount");
const rushFillEl = document.querySelector("#rushFill");
const messageEl = document.querySelector("#message");
const startButtonEl = document.querySelector("#startButton");
const rushButtonEl = document.querySelector("#rushButton");
const resetButtonEl = document.querySelector("#resetButton");
const sensorFallbackEl = document.querySelector("#sensorFallback");

const state = {
  phase: "idle",
  lastTick: 0,
  arrivalRemaining: DURATIONS.arrival,
  boardingRemaining: DURATIONS.boarding,
  rideRemaining: DURATIONS.ride,
  rushes: 0,
  seated: false,
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
  if (state.usingSimulatedMotion || !canUseRealMotion()) {
    return state.simulatedUpright;
  }

  return isRealUpright(now);
}

function phaseNeedsUpright() {
  if (state.phase === "waiting" || state.phase === "boarding") {
    return true;
  }

  return state.phase === "riding" && !state.seated;
}

function countdownCanMove(now) {
  return !phaseNeedsUpright() || isPhoneUpright(now);
}

async function requestMotionAccess() {
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
  state.phase = "idle";
  state.lastTick = 0;
  state.arrivalRemaining = DURATIONS.arrival;
  state.boardingRemaining = DURATIONS.boarding;
  state.rideRemaining = DURATIONS.ride;
  state.rushes = 0;
  state.seated = false;
  state.simulatedUpright = true;
  render();
}

function startWaiting() {
  state.phase = "waiting";
  state.lastTick = performance.now();
  state.arrivalRemaining = DURATIONS.arrival;
  state.boardingRemaining = DURATIONS.boarding;
  state.rideRemaining = DURATIONS.ride;
  state.rushes = 0;
  state.seated = false;
  requestAnimationFrame(tick);
  render();
}

function startBoarding() {
  state.phase = "boarding";
  state.boardingRemaining = DURATIONS.boarding;
  state.rushes = 0;
  vibrate([70, 40, 70]);
  render();
}

function startRide(seated) {
  state.phase = "riding";
  state.seated = seated;
  state.rideRemaining = DURATIONS.ride;
  vibrate(seated ? 90 : [40, 35, 40]);
  render();
}

function finishRide() {
  state.phase = "arrived";
  state.rideRemaining = 0;
  vibrate([120, 50, 120]);
  render();
}

function rush() {
  if (state.phase !== "boarding" || !countdownCanMove(performance.now())) {
    return;
  }

  state.rushes += 1;
  queueEl.classList.add("rushing");
  window.setTimeout(() => queueEl.classList.remove("rushing"), 120);
  vibrate(8);

  if (state.rushes >= SEAT_TARGET) {
    startRide(true);
    return;
  }

  render();
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function tick(now) {
  if (state.phase === "idle" || state.phase === "arrived") {
    return;
  }

  const elapsed = Math.min(250, now - state.lastTick);
  state.lastTick = now;

  if (countdownCanMove(now)) {
    if (state.phase === "waiting") {
      state.arrivalRemaining -= elapsed;

      if (state.arrivalRemaining <= 0) {
        state.arrivalRemaining = 0;
        startBoarding();
      }
    } else if (state.phase === "boarding") {
      state.boardingRemaining -= elapsed;

      if (state.boardingRemaining <= 0) {
        state.boardingRemaining = 0;
        startRide(false);
      }
    } else if (state.phase === "riding") {
      state.rideRemaining -= elapsed;

      if (state.rideRemaining <= 0) {
        finishRide();
      }
    }
  }

  render();
  requestAnimationFrame(tick);
}

function render() {
  const now = performance.now();
  const upright = isPhoneUpright(now);
  const paused = phaseNeedsUpright() && !upright;
  const needsMotionFallback =
    state.usingSimulatedMotion ||
    !canUseRealMotion() ||
    (state.phase !== "idle" &&
      state.motionPermission === "granted" &&
      !realMotionIsFresh(now));

  gameEl.classList.toggle("paused", paused);
  document.body.classList.toggle("arrival-pulse", state.phase === "boarding");
  trainEl.classList.toggle("arrived", state.phase !== "idle" && state.arrivalRemaining <= 0);
  trainEl.classList.toggle("boarding", state.phase === "boarding");
  queueEl.classList.toggle("hidden", state.phase === "riding" || state.phase === "arrived");
  seatRowEl.classList.toggle("visible", state.phase === "riding" && state.seated);
  handrailEl.classList.toggle("visible", state.phase === "riding" && !state.seated);

  sensorFallbackEl.hidden = !needsMotionFallback;
  sensorFallbackEl.textContent = state.simulatedUpright ? "Simulated upright" : "Simulated tilted";

  renderPhaseCopy(paused, upright);
  renderTimers();
  renderRushPanel();
  renderActions();
}

function renderPhaseCopy(paused, upright) {
  postureLabelEl.textContent = upright || !phaseNeedsUpright() ? "Clear" : "Tilted";

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
    statusRibbonEl.textContent = "Train approaching City Hall";
    messageEl.textContent = "Stay upright in the queue.";
    return;
  }

  if (state.phase === "boarding") {
    statusRibbonEl.textContent = "Doors open";
    messageEl.textContent = "Push through the crowd before every seat is gone.";
    return;
  }

  if (state.phase === "riding" && state.seated) {
    statusRibbonEl.textContent = "Seat secured";
    messageEl.textContent = "You can rest the phone while the ride continues.";
    return;
  }

  if (state.phase === "riding") {
    statusRibbonEl.textContent = "Standing room only";
    messageEl.textContent = "Hold steady on the handrail until Bishan.";
    return;
  }

  statusRibbonEl.textContent = "Arrived at Bishan";
  messageEl.textContent = state.seated
    ? "You made it to Bishan with a seat."
    : "You made it to Bishan standing.";
}

function renderTimers() {
  if (state.phase === "idle" || state.phase === "waiting") {
    primaryLabelEl.textContent = "Next train";
    primaryTimerEl.textContent = formatTime(state.arrivalRemaining);
  } else if (state.phase === "boarding") {
    primaryLabelEl.textContent = "Boarding";
    primaryTimerEl.textContent = formatTime(state.boardingRemaining);
  } else if (state.phase === "riding") {
    primaryLabelEl.textContent = state.seated ? "Ride" : "Grip time";
    primaryTimerEl.textContent = formatTime(state.rideRemaining);
  } else {
    primaryLabelEl.textContent = "Arrived";
    primaryTimerEl.textContent = "00:00";
  }

  const rideProgress = 1 - state.rideRemaining / DURATIONS.ride;
  const arrivalProgress = 1 - state.arrivalRemaining / DURATIONS.arrival;
  const boardingBonus = state.phase === "boarding" ? 0.05 : 0;
  const progress =
    state.phase === "idle"
      ? 0
      : state.phase === "waiting" || state.phase === "boarding"
        ? Math.min(0.18, arrivalProgress * 0.18 + boardingBonus)
        : state.phase === "riding"
          ? 0.18 + rideProgress * 0.82
          : 1;

  routeProgressEl.style.width = `${Math.round(progress * 100)}%`;
}

function renderRushPanel() {
  const visible = state.phase === "boarding";
  rushPanelEl.hidden = !visible;

  if (!visible) {
    return;
  }

  const percent = Math.min(100, (state.rushes / SEAT_TARGET) * 100);
  rushCountEl.textContent = `${state.rushes} / ${SEAT_TARGET}`;
  rushFillEl.style.width = `${percent}%`;
}

function renderActions() {
  startButtonEl.hidden = state.phase !== "idle";
  rushButtonEl.hidden = state.phase !== "boarding";
  resetButtonEl.hidden = state.phase !== "arrived";
}

startButtonEl.addEventListener("click", async () => {
  await requestMotionAccess();
  startWaiting();
});

rushButtonEl.addEventListener("click", rush);

resetButtonEl.addEventListener("click", resetState);

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
    rush();
  }
});

render();
