# chess-zobrist

A TypeScript library for generating Zobrist hashes from chess positions in FEN notation. Works in both Node.js and browser environments.

## Installation

```bash
npm install chess-zobrist
```

## Usage

### In Node.js

```javascript
import { ChessHasher } from "chess-zobrist";

const hasher = new ChessHasher();
const hash = hasher.hashPosition(
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
);
console.log(hash);
```

### In Browser (Script Tag)

```html
<script src="https://unpkg.com/chess-zobrist@0.1.1"></script>
<script>
  const hasher = new ChessPositionHasher.ChessHasher();
  const hash = hasher.hashPosition(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  console.log(hash);
</script>
```

## Features

- Works in both Node.js and browser environments
- Zero dependencies
- TypeScript support with full type definitions
- Comprehensive test suite

## Browser Support

Supports all modern browsers (Chrome, Firefox, Safari, Edge). No IE11 support because it should be dead by now.

## Development

```bash
npm install        # Install dependencies
npm run build     # Build all formats
npm test          # Run tests
npm run lint      # Run linter
npm run docs      # Generate documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Corentin GS

## Acknowledgements

This library is inspired by the [shinkarom/zobrist project](https://github.com/shinkarom/zobrist/tree/master)

## Disclaimer

I'm not a js/ts expert, so feel free to open an issue if you see something wrong or if you have any suggestions.
This is my first npm package, so I'm open to any feedback.
