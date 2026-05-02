# Train Sound Effects

Put train-only random sound effects in this folder, then add them to `playlist.js`.

Example:

```js
window.TRAIN_SOUND_EFFECTS = [
  { src: "sounds/chinese-tiktok.mp3", volume: 1 },
  { src: "sounds/train-delay-announcement.mp3", volume: 1 },
  { src: "sounds/tunnel-wheels-screech.mp3", volume: 1 },
];
```

The game will choose from this list at random only after the player is inside the train.
