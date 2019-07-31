import { Player } from "./player";
import { GameState } from "./gamestate";
import { Deck } from "./deck";
import { Game } from "./game";

const deck = new Deck();
deck.shuffle();

const players: Array<Player> = [
  new Player(true, "joe"),
  new Player(false, "matt"),
  new Player(false, "kyle"),
  new Player(false, "bob")
];

const game = new Game(deck, players);
game.gameState = GameState.DEALING;
game.deal();

for (let i = 0; i < players.length; i++) {
  if (players[i].dealer) {
    let starter;
    if (i + 1 === players.length) {
      starter = players[0];
    } else {
      starter = players[i + 1];
    }
    game.gameState = GameState.TRUMP_ONE;
    game.start(starter, players.indexOf(starter));
    break;
  }
}
