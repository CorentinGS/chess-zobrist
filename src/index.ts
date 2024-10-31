// index.ts

import { polyglot_hashes } from "./hashes";

// Type definitions
type Hash = number[];
type Color = 'w' | 'b';

/**
 * The `ChessHasher` class provides methods to generate Zobrist hashes for chess positions.
 * It uses Polyglot book format hashes to compute the hash values.
 *
 * @remarks
 * This class is designed to work with Forsyth-Edwards Notation (FEN) strings to represent chess positions.
 * It supports hashing of pieces, castling rights, en passant targets, and the side to move.
 *
 * @example
 * ```typescript
 * const hasher = new ChessHasher();
 * const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
 * const hash = hasher.hashPosition(fen);
 * console.log(hash); // Outputs the Zobrist hash for the given FEN position
 * ```
 */
export class ChessHasher {
  private static readonly hashes: string[] = polyglot_hashes


  private static readonly emptyHash: Hash = ChessHasher.parseHexString("0000000000000000");

  private error: boolean = false;
  private enPasRank: number = -1;
  private enPasFile: number = -1;
  private pawnNearby: boolean = false;

  /**
   * Parses a hexadecimal string into an array of numbers.
   *
   * @param str - The hexadecimal string to be parsed.
   * @returns An array of numbers representing the parsed hexadecimal values.
   */
  private static parseHexString(str: string): Hash {
    const result: number[] = [];
    let remaining = str;

    while (remaining.length >= 2) {
      result.push(parseInt(remaining.substring(0, 2), 16));
      remaining = remaining.substring(2);
    }

    return result;
  }

  /**
   * Converts an array of bytes into a hexadecimal string.
   *
   * @param arr - The array of bytes to convert.
   * @returns The hexadecimal string representation of the byte array.
   */
  private static createHexString(arr: Hash): string {
    return arr.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Performs a bitwise XOR operation between two arrays of numbers (hashes).
   * The resulting array will have the length of the shorter input array.
   *
   * @param a - The first hash array.
   * @param b - The second hash array.
   * @returns A new hash array where each element is the result of a bitwise XOR operation
   *          between the corresponding elements of the input arrays.
   */
  private static xorArrays(a: Hash, b: Hash): Hash {
    const length = Math.min(a.length, b.length);
    return Array.from({ length }, (_, i) => a[i] ^ b[i]);
  }

  /**
   * Performs an XOR operation between the given hash array and a hash value
   * corresponding to the provided number.
   *
   * @param arr - The initial hash array to be XORed.
   * @param num - The index of the hash value to be XORed with the initial hash array.
   * @returns The resulting hash array after the XOR operation.
   */
  private xorHash(arr: Hash, num: number): Hash {
    return ChessHasher.xorArrays(arr, ChessHasher.parseHexString(ChessHasher.hashes[num]));
  }

  /**
   * Parses the en passant square from the FEN string.
   *
   * @param str - The en passant square as a string in algebraic notation.
   * @returns Updates the en passant rank and file if the input is valid.
   */
  private parseEnPassant(str: string): void {
    if (!str || str === "-") return;

    if (str.length !== 2) {
      this.error = true;
      return;
    }

    const f = str.charCodeAt(0) - 97;
    const r = str.charCodeAt(1) - 49;

    if ((f < 0) || (f > 7) || (r < 0) || (r > 7)) {
      this.error = true;
      return;
    }

    this.enPasFile = f;
    this.enPasRank = r;
  }

  /**
   * Computes the hash for the given side.
   *
   * @param arr - The current hash array.
   * @param str - The color of the side ('w' for white, other values for black).
   * @returns The updated hash array. If the color is white, the hash is XORed with 780.
   */
  private hashSide(arr: Hash, str: Color): Hash {
    return str === 'w' ? this.xorHash(arr, 780) : arr;
  }

  /**
   * Updates the given hash based on the castling rights string.
   *
   * @param arr - The current hash value.
   * @param str - A string representing the castling rights. It can contain 'K' for white kingside,
   *              'Q' for white queenside, 'k' for black kingside, and 'q' for black queenside castling rights.
   *              If the string is "-", no castling rights are available.
   * @returns The updated hash value after applying the castling rights.
   */
  private hashCastling(arr: Hash, str: string): Hash {
    if (str === "-") return arr;

    if (str.includes("K")) arr = this.xorHash(arr, 768);
    if (str.includes("Q")) arr = this.xorHash(arr, 769);
    if (str.includes("k")) arr = this.xorHash(arr, 770);
    if (str.includes("q")) arr = this.xorHash(arr, 771);

    return arr;
  }


  /**
   * Hashes the pieces on the chessboard based on the given FEN string.
   * 
   * @param arr - The initial hash array.
   * @param str - The FEN string representing the board state.
   * @returns The updated hash array after processing the pieces.
   * 
   * @remarks
   * This function processes each rank of the FEN string, updating the hash array
   * by XORing values based on the piece type and position. It also checks for 
   * en passant conditions and sets the `pawnNearby` flag if applicable.
   * 
   * The function expects the FEN string to have exactly 8 ranks. If the ranks 
   * are not 8 or if any rank does not sum up to 8 files, the `error` flag is set 
   * to true and the original hash array is returned.
   * 
   * The piece types are represented as follows:
   * - 'p': Black pawn
   * - 'P': White pawn
   * - 'n': Black knight
   * - 'N': White knight
   * - 'b': Black bishop
   * - 'B': White bishop
   * - 'r': Black rook
   * - 'R': White rook
   * - 'q': Black queen
   * - 'Q': White queen
   * - 'k': Black king
   * - 'K': White king
   * 
   * Empty squares are represented by digits '1' to '8'.
   * 
   * @example
   * ```typescript
   * const initialHash: Hash = ...;
   * const fenString: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
   * const updatedHash = this.hashPieces(initialHash, fenString);
   * ```
   */
  private hashPieces(arr: Hash, str: string): Hash {
    const ranks = str.split("/");
    if (ranks.length != 8) {
      this.error = true;
      return arr;
    }
    for (let i = 0; i < 8; i++) {
      let file = 0;
      const rank = 7 - i;
      for (let j = 0; j < ranks[i].length; j++) {
        switch (ranks[i][j]) {
          case "p":
            arr = this.xorHash(arr, 8 * rank + file);
            if ((this.enPasRank == 2) && (rank == 3) && (this.enPasFile > 0) && (file == this.enPasFile - 1))
              this.pawnNearby = true;
            if ((this.enPasRank == 2) && (rank == 3) && (this.enPasFile < 7) && (file == this.enPasFile + 1))
              this.pawnNearby = true;
            file++;
            break;
          case "P":
            arr = this.xorHash(arr, 64 * 1 + 8 * rank + file);
            if ((this.enPasRank == 5) && (rank == 4) && (this.enPasFile > 0) && (file == this.enPasFile - 1))
              this.pawnNearby = true;
            if ((this.enPasRank == 5) && (rank == 4) && (this.enPasFile < 7) && (file == this.enPasFile + 1))
              this.pawnNearby = true;
            file++;
            break;
          case "n":
            arr = this.xorHash(arr, 64 * 2 + 8 * rank + file);
            file++;
            break;
          case "N":
            arr = this.xorHash(arr, 64 * 3 + 8 * rank + file);
            file++;
            break;
          case "b":
            arr = this.xorHash(arr, 64 * 4 + 8 * rank + file);
            file++;
            break;
          case "B":
            arr = this.xorHash(arr, 64 * 5 + 8 * rank + file);
            file++;
            break;
          case "r":
            arr = this.xorHash(arr, 64 * 6 + 8 * rank + file);
            file++;
            break;
          case "R":
            arr = this.xorHash(arr, 64 * 7 + 8 * rank + file);
            file++;
            break;
          case "q":
            arr = this.xorHash(arr, 64 * 8 + 8 * rank + file);
            file++;
            break;
          case "Q":
            arr = this.xorHash(arr, 64 * 9 + 8 * rank + file);
            file++;
            break;
          case "k":
            arr = this.xorHash(arr, 64 * 10 + 8 * rank + file);
            file++;
            break;
          case "K":
            arr = this.xorHash(arr, 64 * 11 + 8 * rank + file);
            file++;
            break;
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
            const r = ranks[i].charCodeAt(j) - 48;
            file += r;
            break;
          default:
            this.error = true;
            return arr;
        }
      }
      if (file != 8)
        this.error = true;
    }
    return arr;
  }

  /**
   * Hashes a chess position given in FEN (Forsyth-Edwards Notation) format.
   *
   * @param fen - The FEN string representing the chess position.
   * @returns The hashed position as a hexadecimal string, or "Wrong position" if the FEN string is invalid.
   *
   * This method performs the following steps:
   * 1. Initializes error state and en passant information.
   * 2. Splits the FEN string into its components (pieces, color, castling rights, en passant square).
   * 3. Validates the FEN components.
   * 4. Initializes the hash with an empty hash value.
   * 5. Parses the en passant square and updates the hash.
   * 6. Hashes the pieces and updates the hash.
   * 7. If a pawn is nearby the en passant square, updates the hash accordingly.
   * 8. Hashes the side to move and updates the hash.
   * 9. Hashes the castling rights and updates the hash.
   * 10. Returns the final hash as a hexadecimal string, or "Wrong position" if an error occurred.
   */
  public hashPosition(fen: string): string {
    this.error = false;
    this.enPasRank = -1;
    this.enPasFile = -1;
    this.pawnNearby = false;


    // Validate FEN format
    const validFenPattern = /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+ [wb] [KQkq-]{1,4} [a-h1-8-]{1,2} \d+ \d+$/;
    if (!validFenPattern.test(fen)) {
      return "Wrong position";
    }

    const [pieces, color, castling, enPassant, ..._rest] = fen.trim().split(" ");

    if (!pieces || !color || !castling || !enPassant) {
      this.error = true;
      return "Wrong position";
    }

    let hash = ChessHasher.emptyHash;

    this.parseEnPassant(enPassant);
    hash = this.hashPieces(hash, pieces);

    if (this.pawnNearby) {
      hash = this.xorHash(hash, 772 + this.enPasFile);
    }

    hash = this.hashSide(hash, color as Color);
    hash = this.hashCastling(hash, castling);

    return this.error ? "Wrong position" : ChessHasher.createHexString(hash);
  }
}