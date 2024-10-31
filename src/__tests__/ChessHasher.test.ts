// src/__tests__/ChessHasher.test.ts

import { ChessHasher } from '../index';

describe('ChessHasher', () => {
    let hasher: ChessHasher;

    beforeEach(() => {
        hasher = new ChessHasher();
    });

    describe('Basic Position Validation', () => {
        test('should correctly hash the starting position', () => {
            const startPos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            const hash = hasher.hashPosition(startPos);
            expect(hash).not.toBe("Wrong position");
            expect(hash).toHaveLength(16); // 8 bytes = 16 hex chars
            expect(hash).toBe("463b96181691fc9c");
        });

        test('should handle empty board position', () => {
            const emptyPos = "8/8/8/8/8/8/8/8 w - - 0 1";
            const hash = hasher.hashPosition(emptyPos);
            expect(hash).not.toBe("Wrong position");
            expect(hash).toHaveLength(16);
            expect(hash).toBe("f8d626aaaf278509");
        });
    });

    describe('Known Position Hashes', () => {
        const knownPositions = [
          {
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            hash: "463b96181691fc9c"
          },
          {
            fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
            hash: "823c9b50fd114196"
          },
          {
            fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
            hash: "0844931a6ef4b9a0"
          },
          {
            fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
            hash: "0756b94461c50fb0"
          },
          {
            fen: "8/8/8/8/8/8/8/8 w - - 0 1", // Empty board
            hash: "f8d626aaaf278509"
          }
        ];
    
        test.each(knownPositions)('should correctly hash position: $fen', ({fen, hash}) => {
          expect(hasher.hashPosition(fen).toLowerCase()).toBe(hash.toLowerCase());
        });
      });

    describe('Error Handling', () => {
        test('should return "Wrong position" for invalid FEN format', () => {
            const invalidFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
            expect(hasher.hashPosition(invalidFen)).toBe("Wrong position");
        });

        test('should detect invalid piece placement', () => {
            const invalidPieces = "rnbqkbnr/ppppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            expect(hasher.hashPosition(invalidPieces)).toBe("Wrong position");
        });

        test('should detect invalid ranks count', () => {
            const invalidRanks = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1";
            expect(hasher.hashPosition(invalidRanks)).toBe("Wrong position");
        });
    });

    describe('Color Handling', () => {
        test('should produce different hashes for white and black to move', () => {
            const positionWhite = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            const positionBlack = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";

            const hashWhite = hasher.hashPosition(positionWhite);
            const hashBlack = hasher.hashPosition(positionBlack);

            expect(hashWhite).not.toBe(hashBlack);
            expect(hashWhite).toHaveLength(16);
            expect(hashBlack).toHaveLength(16);
        });
    });

    describe('Castling Rights', () => {
        test('should produce different hashes for different castling rights', () => {
            const withAllCastling = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            const withoutCastling = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1";
            const onlyWhiteCastling = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1";

            const hashAll = hasher.hashPosition(withAllCastling);
            const hashNone = hasher.hashPosition(withoutCastling);
            const hashWhite = hasher.hashPosition(onlyWhiteCastling);

            expect(hashAll).not.toBe(hashNone);
            expect(hashAll).not.toBe(hashWhite);
            expect(hashWhite).not.toBe(hashNone);
        });
    });

    describe('En Passant', () => {
        test('should handle en passant squares correctly', () => {
            // Position after 1. e4 e5
            const afterE4E5 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";
            // Position after 1. e4 e6
            const afterE4E6 = "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";

            const hashWithEP = hasher.hashPosition(afterE4E5);
            const hashWithoutEP = hasher.hashPosition(afterE4E6);

            expect(hashWithEP).not.toBe(hashWithoutEP);

            expect(hashWithEP).toHaveLength(16);
            expect(hashWithoutEP).toHaveLength(16);

            // Check that the hashes are different
            expect(hashWithEP).toBe("0844931a6ef4b9a0");
            expect(hashWithoutEP).toBe("f44b6961e533d1c4");

        });

        test('should validate en passant square format', () => {
            const invalidEP = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e99 0 1";
            expect(hasher.hashPosition(invalidEP)).toBe("Wrong position");
        });
    });

    describe('Position Equality', () => {
        test('should produce identical hashes for identical positions', () => {
            const position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            const hash1 = hasher.hashPosition(position);
            const hash2 = hasher.hashPosition(position);

            expect(hash1).toBe(hash2);
        });

        test('should produce different hashes for different positions', () => {
            const position1 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
            const position2 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";

            const hash1 = hasher.hashPosition(position1);
            const hash2 = hasher.hashPosition(position2);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Piece Placement', () => {
        test('should handle individual piece placement correctly', () => {
            // Test each piece type in different positions
            const positions = [
                "4k3/8/8/8/8/8/8/4K3 w - - 0 1", // Kings only
                "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", // White rook added
                "4k3/8/8/8/8/8/8/B3K3 w - - 0 1", // White bishop instead
                "4k3/8/8/8/8/8/8/N3K3 w - - 0 1", // White knight instead
                "4k3/8/8/8/8/8/8/Q3K3 w - - 0 1", // White queen instead
            ];

            const hashes = positions.map(pos => hasher.hashPosition(pos));

            // Each hash should be different
            for (let i = 0; i < hashes.length; i++) {
                for (let j = i + 1; j < hashes.length; j++) {
                    expect(hashes[i]).not.toBe(hashes[j]);
                }
            }
        });
    });
});