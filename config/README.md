# Game configuration

Edit `game-config.json` to tune the static game without changing JavaScript.

- `timing.durationBetweenStations` is the default travel time for each station-to-station leg, in milliseconds.
- `timing.stationDurations` can override individual legs in order: City Hall to Dhoby Ghaut, Dhoby Ghaut to Somerset, and so on. Leave it empty to use the default for every leg.
- `timing.stationDwellDuration` is how long the train stays stopped at each intermediate station.
- `startSound` is the sound that plays from the Start button tap.
- `seatRush`, `upright`, `trainSound`, `announcement`, and `vibration` control the other game mechanics.

The app has the same defaults baked into `app.js` as a fallback, so it still starts if the JSON file cannot be loaded.
