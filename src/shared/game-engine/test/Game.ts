import assert from 'assert';
import { describe, it } from 'mocha';
import { Game, Move } from '..';

describe('Game', () => {
    it('Runs an entire game', () => {
        const game = new Game(3);

        const emitted = {
            played: false,
            ended: false,
        };
        game.on('played', () => emitted['played'] = true);
        game.on('ended', () => emitted['ended'] = true);

        assert.strictEqual(game.getSize(), 3);

        // Players legal moves
        game.move(new Move(1, 1), 0);
        assert.strictEqual(game.getBoard().getCell(1, 1), 0);

        assert.strictEqual(emitted['played'], true);

        game.move(new Move(1, 2), 1);
        assert.strictEqual(game.getBoard().getCell(1, 2), 1);

        // Illegal moves
        assert.throws(() => game.move(new Move(0, 0), 1), { message: 'Move a1: Not your turn' });
        assert.throws(() => game.move(new Move(9, 0), 0), { message: 'Move a10: Cell outside board' });
        assert.throws(() => game.move(new Move(1, 1), 0), { message: 'Move b2: This cell is already occupied' });

        // Game end
        game.move(new Move(2, 1), 0);
        game.move(new Move(2, 0), 1);
        assert.strictEqual(game.isEnded(), false, 'Game is not yet ended');
        assert.strictEqual(emitted['ended'], false);
        game.move(new Move(0, 1), 0);

        assert.strictEqual(emitted['ended'], true);
        assert.strictEqual(game.isEnded(), true, 'Game is now ended, player 0 won');
        assert.strictEqual(game.getStrictWinner(), 0, 'Player 0 is the winner');

        // Cannot move anymore
        assert.throws(() => game.move(new Move(2, 2), 1), { message: 'Move c3: Game is finished' });
    });

    it('Resign', () => {
        const game = new Game(3);

        // Players legal moves
        game.move(new Move(1, 1), 0);
        game.move(new Move(2, 1), 1);

        // Resign
        game.resign(1, new Date());

        assert.strictEqual(game.isEnded(), true, 'Game is now finished after resign');
        assert.strictEqual(game.getStrictWinner(), 0, 'Player 0 is the winner because p1 resigned');
    });

    it('returns whether a move is actually a swap', () => {
        const game = new Game(5);

        assert.strictEqual(game.isSwapPiecesMove(new Move(0, 0), 0), false);

        game.move(new Move(1, 2), 0);

        assert.strictEqual(game.isSwapPiecesMove(new Move(0, 0), 1), false);
        assert.strictEqual(game.isSwapPiecesMove(new Move(1, 2), 1), true);

        game.move(new Move(3, 4), 1);

        assert.strictEqual(game.isSwapPiecesMove(new Move(0, 0), 0), false);
        assert.strictEqual(game.isSwapPiecesMove(new Move(1, 2), 0), false);
        assert.strictEqual(game.isSwapPiecesMove(new Move(3, 4), 0), false);
    });

    it('swap pieces', () => {
        const game = new Game(5);

        game.move(new Move(1, 2), 0);
        game.move(new Move(1, 2), 1);

        assert.strictEqual(game.getBoard().getCell(1, 2), null);
        assert.strictEqual(game.getBoard().getCell(2, 1), 1);
        assert.strictEqual(game.getCurrentPlayerIndex(), 0);
    });

    it('cannot swap pieces if rule has been disabled', () => {
        const game = new Game(5);

        game.setAllowSwap(false);

        game.move(new Move(1, 2), 0);
        assert.throws(() => game.move(new Move(1, 2), 1), { message: 'Move c2: This cell is already occupied' });

        assert.strictEqual(game.getBoard().getCell(1, 2), 0);
        assert.strictEqual(game.getBoard().getCell(2, 1), null);
        assert.strictEqual(game.getCurrentPlayerIndex(), 1);
    });

    it('recreate a playing Game from raw data object', () => {
        const game = new Game(5);

        game.setAllowSwap(false);

        game.move(new Move(1, 2), 0);
        game.move(new Move(3, 1), 1);

        const gameData = game.toData();

        assert.strictEqual(gameData.size, 5);
        assert.strictEqual(gameData.movesHistory.length, 2);
        assert.ok(gameData.movesHistory[0].playedAt instanceof Date);


        const restoredGame = Game.fromData(gameData);

        assert.strictEqual(game.getSize(), restoredGame.getSize());
        assert.strictEqual(game.getMovesHistory().length, restoredGame.getMovesHistory().length);
        assert.strictEqual(game.getMovesHistory()[0].getPlayedAt().toISOString(), restoredGame.getMovesHistory()[0].getPlayedAt().toISOString());
        assert.strictEqual(game.getStartedAt(), restoredGame.getStartedAt());
        assert.strictEqual(game.getLastMoveAt(), restoredGame.getLastMoveAt());
        assert.strictEqual(game.isEnded(), restoredGame.isEnded());
    });

    it('recreate a resigned Game from raw data object', () => {
        const game = new Game(5);

        game.setAllowSwap(false);

        game.move(new Move(1, 2), 0);
        game.move(new Move(3, 1), 1);

        game.resign(0, new Date());

        const gameData = game.toData();
        const restoredGame = Game.fromData(gameData);

        assert.strictEqual(game.getWinner(), restoredGame.getWinner());
        assert.strictEqual(game.getOutcome(), restoredGame.getOutcome());
        assert.strictEqual(game.isEnded(), restoredGame.isEnded());
    });

    it('recreate a canceled Game from raw data object', () => {
        const game = new Game(5);

        game.setAllowSwap(false);

        game.move(new Move(1, 2), 0);
        game.move(new Move(3, 1), 1);

        game.cancel(new Date());

        const gameData = game.toData();
        const restoredGame = Game.fromData(gameData);

        assert.strictEqual(game.getWinner(), restoredGame.getWinner());
        assert.strictEqual(game.getOutcome(), restoredGame.getOutcome());
        assert.strictEqual(game.isEnded(), restoredGame.isEnded());
        assert.strictEqual(game.isCanceled(), restoredGame.isCanceled());
    });

    it('recreates a won game from raw data object', () => {
        const game = new Game(3);

        game.move(new Move(1, 1), 0);
        game.move(new Move(1, 2), 1);
        game.move(new Move(2, 1), 0);
        game.move(new Move(2, 0), 1);
        game.move(new Move(0, 1), 0);

        const gameData = game.toData();
        const restoredGame = Game.fromData(gameData);

        assert.strictEqual(game.getWinner(), restoredGame.getWinner());
        assert.strictEqual(game.getOutcome(), restoredGame.getOutcome());
        assert.strictEqual(game.isEnded(), restoredGame.isEnded());
        assert.strictEqual(game.getEndedAt(), restoredGame.getEndedAt());
        assert.strictEqual(game.isCanceled(), restoredGame.isCanceled());
    });

    it('provides consistent timestamping', () => {
        const game = new Game(3);

        let lastMoveAt: null | Date = null;
        let lastEndedAt: null | Date = null;

        game.on('played', move => lastMoveAt = move.getPlayedAt());
        game.on('ended', (winner, outcome, date) => lastEndedAt = date);

        const firstMoveDate = new Date();

        // Players legal moves
        game.move(new Move(1, 1, firstMoveDate), 0);

        assert.strictEqual(lastMoveAt, firstMoveDate);

        // Game end
        game.move(new Move(1, 2), 1);
        game.move(new Move(2, 1), 0);
        game.move(new Move(2, 0), 1);
        const lastMoveDate = new Date();
        game.move(new Move(0, 1, lastMoveDate), 0);

        assert.strictEqual(lastEndedAt, lastMoveDate);
        assert.strictEqual(game.getLastMoveAt(), lastMoveDate);
        assert.strictEqual(game.getEndedAt(), lastMoveDate);
    });
});
