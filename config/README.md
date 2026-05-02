# Game configuration

Edit `game-config.json` to tune the static game without changing JavaScript.

- `game-config.json` is used when the page is served from a static host such as GitHub Pages.
- `game-config.js` is a direct-file fallback for browsers that block `file://` JSON fetches; keep it in sync if you open `index.html` directly.
- The in-app settings page saves browser overrides in `localStorage`; reset the page settings to return to the JSON defaults.
- `timing.initialTrainArrivalDuration` is the first City Hall train-arrival countdown, in milliseconds.
- `timing.durationBetweenStations` is the default travel time for each station-to-station leg, in milliseconds.
- `timing.stationDurations` can override individual legs in order: City Hall to Dhoby Ghaut, Dhoby Ghaut to Somerset, and so on. Leave it empty to use the default for every leg.
- `timing.stationDwellDuration` is how long the train stays stopped at each intermediate station.
- `upright.betaMin`, `upright.betaMax`, and `upright.gammaMax` control the accepted phone angle range.
- `upright.checkInterval` controls how often the app re-checks the phone angle, in milliseconds.
- `audioFade.duration` controls the fade-in and fade-out time for every sound, in milliseconds.
- `audioFade.tickInterval` controls how often fade volume ramps update, in milliseconds.
- `startSound` is the sound that plays from the Start button tap.
- `endSound` is the sound that plays when the player reaches Bishan.
- `doorClosingSound.leadTime` controls how many milliseconds before train departure the `doors_are_closing.ogg` clip plays.
- `announcement.arrivingLeadTime` controls how many milliseconds before each station the `arriving_<station_name>.ogg` clip plays.
- `auntieEvent.chance` controls the odds that an auntie appears on each departure while the player has a seat.
- `auntieEvent.minDuration` and `auntieEvent.maxDuration` set how long she stays on screen, in milliseconds.
- `auntieEvent.scoldAfter` is how long the player can leave the screen undimmed before losing the seat.
- `seatRush`, `upright`, `trainSound`, `announcement`, `auntieEvent`, and `vibration` control the other game mechanics.

The app has the same defaults baked into `app.js` as a fallback, so it still starts if the JSON file cannot be loaded.
