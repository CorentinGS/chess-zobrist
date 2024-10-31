import { ChessHasher } from 'chess-zobrist';

const hasher = new ChessHasher();
const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const hash = hasher.hashPosition(fen);
console.log(`Position hash: ${hash}`);
