import { Player } from "./player";
import { GameState } from "./gamestate";
import { Deck } from "./deck";
import { Game } from "./game";
import { Team } from "./team";

const deck = new Deck();
deck.shuffle();

const teamOne = new Team("Team One");
const teamTwo = new Team("Team Two");

const players: Array<Player> = [
  new Player(true, "joe", teamOne),
  new Player(false, "matt", teamTwo),
  new Player(false, "kyle", teamOne),
  new Player(false, "bob", teamTwo)
];

const game = new Game(deck, players);
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
    game.start(players[i], players.indexOf(starter));
    break;
  }
}
