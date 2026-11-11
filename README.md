# itchlib

A Node.js library for exploring itch.io games, creators, downloads, and more stuff.

## Requirements

- Node.js 22.19 or later
- Also ESM support

## Installation

```bash
npm install itchlib
```

## Quick start

```js
import { ItchClient } from "itchlib";

const itch = new ItchClient();
const game = await itch.getGame("https://ninja-muffin24.itch.io/funkin");
// heh,, Friday Night Funkin'

console.log(game.title);
console.log(game.descriptionHtml);
console.log(game.images);
console.log(game.uploads);
```

`getGame()` returns information available on the game's itch.io page, including its description, media, links, details, downloads, and comments.

Documentation is WIP still so wait a bit for that :)
