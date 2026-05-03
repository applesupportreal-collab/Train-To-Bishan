window.TRAIN_TO_BISHAN_GAME_CONFIG = {
  routeStations: [
    {
      code: "NS25",
      name: "City Hall",
    },
    {
      code: "NS24",
      name: "Dhoby Ghaut",
    },
    {
      code: "NS23",
      name: "Somerset",
    },
    {
      code: "NS22",
      name: "Orchard",
    },
    {
      code: "NS21",
      name: "Newton",
    },
    {
      code: "NS20",
      name: "Novena",
    },
    {
      code: "NS19",
      name: "Toa Payoh",
    },
    {
      code: "NS18",
      name: "Braddell",
    },
    {
      code: "NS17",
      name: "Bishan",
    },
  ],
  timing: {
    initialTrainArrivalDuration: 10000,
    trainArrivalDuration: 15000,
    boardingDuration: 8000,
    durationBetweenStations: 30000,
    stationDwellDuration: 10000,
    stationDurations: [],
  },
  seatRush: {
    gainPerPress: 0.08,
    decayPerSecond: 0.16,
    seatThreshold: 0.95,
  },
  seatOffer: {
    chance: 0.4,
  },
  upright: {
    betaMin: 48,
    betaMax: 132,
    gammaMax: 42,
    staleAfter: 1600,
    checkInterval: 300,
  },
  trainSound: {
    minDelay: 30000,
    firstMinDelay: 30000,
    firstMaxDelay: 45000,
    retryMinDelay: 1500,
    retryMaxDelay: 3000,
    defaultVolume: 1,
    maxConcurrent: 2,
  },
  audioFade: {
    duration: 500,
    tickInterval: 50,
  },
  audio: {
    masterVolume: 1,
  },
  startSound: {
    src: "sounds/train_service_ends_at_bishan.ogg",
    volume: 1,
  },
  endSound: {
    src: "sounds/yay.ogg",
    volume: 1,
  },
  auntieSound: {
    src: "sounds/auntie.ogg",
    volume: 1,
  },
  trainBreakdown: {
    chance: 0.01,
    minSteps: 500,
    maxSteps: 1000,
    manualStepsPerPress: 25,
    motionThreshold: 12.6,
    motionResetThreshold: 10.8,
    minStepInterval: 280,
    src: "sounds/evacuation.ogg",
    volume: 1,
  },
  trainDelay: {
    chance: 0.1,
    extensionDuration: 15000,
    src: "sounds/train_delay.ogg",
    volume: 1,
  },
  doorClosingSound: {
    src: "sounds/doors_are_closing.ogg",
    volume: 1,
    leadTime: 10000,
  },
  announcement: {
    basePath: "sounds",
    prefix: "next_station",
    nextStationPrefix: "next_station",
    arrivingPrefix: "arriving",
    extension: "ogg",
    volume: 1,
    arrivingLeadTime: 10000,
  },
  auntieEvent: {
    chance: 0.3,
    imageSrc: "assets/auntie.png",
    scoldAfter: 5000,
    minDuration: 20000,
    maxDuration: 30000,
    fadeDuration: 700,
    eyesOpenThreshold: 0.08,
    slideDuration: 2200,
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
