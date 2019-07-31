import prompts from "prompts";
import { Card } from "./card";
import { Player } from "./player";
import { GameState } from "./gamestate";
import { Deck } from "./deck";

interface Hand {
  pickedCard: Card;
  player: Player;
}

export class Game {
  gameState: GameState;
  deck: Deck;
  players: Array<Player>;
  trump?: Card;
  possibleTrump?: Card;
  currentHand: Array<Hand>;
  constructor(deck: Deck, players: Array<Player>) {
    this.deck = deck;
    this.players = players;
    this.gameState = GameState.IDLE;
    this.currentHand = [];
  }

  deal() {
    for (let player of this.players) {
      for (let i = 0; i < 5; i++) {
        let randCard: Card = this.deck.cards[
          Math.floor(Math.random() * this.deck.cards.length)
        ];

        var index = this.deck.cards.indexOf(randCard);
        if (index > -1) {
          this.deck.cards.splice(index, 1);
        }

        player.cards.push(randCard);
      }
    }

    // broadcast to each player their cards
    for (let player of this.players) {
      console.log(`[${player.nickname}] Your cards:`);
      for (let card of player.cards) {
        console.log(`${card.format()}`);
      }
    }

    this.possibleTrump = this.deck.cards[
      Math.floor(Math.random() * this.deck.cards.length)
    ];

    console.log(`Trump: ${this.possibleTrump.format()}. Pickup or pass?`);
  }

  //Main game loop
  async start(dealer: Player, starterNum: number) {
    console.log(`Player #${starterNum + 1} is starting`);
    while (true) {
      switch (this.gameState) {
        case GameState.TRUMP_ONE: {
          let customIndex = starterNum; //1
          for (let i = 0; i < 4; i++) {
            if (this.gameState !== GameState.TRUMP_ONE) break;

            await this.input(this.players[customIndex]);

            if (customIndex === 3) {
              customIndex = 0;
            } else {
              customIndex++;
            }
          }

          //TODO: tidy up
          if (!this.trump) {
            this.gameState = GameState.TRUMP_TWO;
          } else {
            this.gameState = GameState.DISCARD_CARD;
          }
          break;
        }
        case GameState.DISCARD_CARD: {
          await this.input(dealer);
          break;
        }
        case GameState.TRUMP_TWO: {
          // console.log("no trump");
          let customIndex = starterNum; //1
          for (let i = 0; i < 3; i++) {
            if (this.gameState !== GameState.TRUMP_TWO) break;

            await this.input(this.players[customIndex]);

            //TODO; check if error
            if (customIndex === 2) {
              customIndex = 0;
            } else {
              customIndex++;
            }
          }
          //force user to get trump
          await this.input(this.players[customIndex], true);
          break;
        }
        case GameState.INGAME: {
          //TODO; whoever wins starts
          let customIndex = starterNum; //1
          for (let i = 0; i < this.players.length; i++) {
            if (this.gameState !== GameState.INGAME) break;

            await this.input(this.players[customIndex]);

            if (customIndex === this.players.length - 1) {
              customIndex = 0;
            } else {
              customIndex++;
            }
          }

          this.findBest(this.currentHand);

          break;
        }
      }
    }
  }

  async input(player: Player, forced?: boolean) {
    switch (this.gameState) {
      case GameState.TRUMP_ONE: {
        const response = await prompts({
          type: "text",
          name: "value",
          message: `[${player.nickname}] Pickup? [Y/N]`,
          validate: value => value === "Y" || value === "N"
        });

        switch (response.value) {
          case "Y":
            this.trump = this.possibleTrump;
            if (this.trump) {
              //TODO: allow player to discard one card
              console.log(`${this.trump.format()} has been selected trump!`);
              this.gameState = GameState.DISCARD_CARD;
            }
            break;
          case "N":
            console.log(`${player.nickname} has passed!`);
            break;
        }

        break;
      }
      case GameState.DISCARD_CARD: {
        if (this.trump) {
          console.log(
            `[${player.nickname}] You will be recieving ${this.trump.format()}`
          );
          console.log(`[${player.nickname}] You must discard one card: `);
          let nums: Array<String> = [];
          for (let i = 0; i < player.cards.length; i++) {
            console.log(`[${i}] ${player.cards[i].format()}`);
            nums.push(i.toString());
          }
          const response = await prompts({
            type: "text",
            name: "value",
            message: `[${
              player.nickname
            }] Which card would you like to discard? [${nums.toString()}]`,
            validate: value => nums.includes(value)
          });

          //TODO: make a private message,
          //TODO: replace cards in deck

          console.log(
            `${player.cards[
              parseInt(response.value)
            ].format()} has been discarded!`
          );

          let index = parseInt(response.value);
          if (index > -1) {
            player.cards.splice(index, 1);
          }

          player.cards.push(this.trump);

          console.log(`[${player.nickname}] Your cards:`);
          for (let card of player.cards) {
            console.log(`${card.format()}`);
          }

          this.gameState = GameState.INGAME;
        }

        break;
      }
      case GameState.TRUMP_TWO: {
        let availableSuits = this.deck.suits;

        //Remove past option
        if (this.possibleTrump) {
          let index = availableSuits.indexOf(this.possibleTrump.suit);
          if (index > -1) {
            availableSuits.splice(index, 1);
          }
        }

        let value = forced
          ? (value: string) => availableSuits.includes(value)
          : (value: string) => availableSuits.includes(value) || value === "N";

        let message = forced
          ? `[${
              player.nickname
            }] Select prefered trump suit? [${availableSuits.toString()}]`
          : `[${
              player.nickname
            }] Select prefered trump suit? [${availableSuits.toString()} / N]`;

        const response = await prompts({
          type: "text",
          name: "value",
          message: message,
          validate: value
        });

        switch (response.value) {
          case "N":
            console.log(`${player.nickname} has passed!`);
            break;
          default:
            this.trump = new Card(response.value, { Nine: 9 }); // value doesnt matter
            console.log(`${this.trump.suit} has been selected trump!`);
            this.gameState = GameState.INGAME;
            break;
        }

        break;
      }
      case GameState.INGAME: {
        console.log(`[${player.nickname}] You must play one card: `);
        let nums: Array<String> = [];
        for (let i = 0; i < player.cards.length; i++) {
          console.log(`[${i}] ${player.cards[i].format()}`);
          nums.push(i.toString());
        }
        const response = await prompts({
          type: "text",
          name: "value",
          message: `[${
            player.nickname
          }] Which card would you like to play? [${nums.toString()}]`,
          validate: value => nums.includes(value)
        });

        let pickedCard: Card = player.cards[parseInt(response.value)];
        this.currentHand.push({
          pickedCard,
          player
        });

        break;
      }
    }
  }

  findBest(cardsPlayed: Array<Hand>) {
    //make sure we have a trump card "H", "D", "S", "C"
    if (this.trump) {
      let winner: Hand = {
        pickedCard: new Card("", {}),
        player: new Player(false, "")
      };
      let secondSuit: string;
      let currWinner: Hand = cardsPlayed[0];

      //TODO: clean up?
      switch (this.trump.suit) {
        case "H":
          secondSuit = "D";
          break;
        case "D":
          secondSuit = "H";
          break;
        case "S":
          secondSuit = "C";
          break;
        case "C":
          secondSuit = "S";
          break;
        default:
          secondSuit = "";
      }

      // if not follow suit, disregard
      // trump suits always high

      for (let card of cardsPlayed) {
        if (card.pickedCard === new Card(this.trump.suit, { J: 11 })) {
          winner = card;
          break;
        } else if (card.pickedCard === new Card(secondSuit, { J: 11 })) {
          winner = card;
          break;
        } else if (card.pickedCard.suit === this.trump.suit) {
        } else {
          if (
            Object.values(card.pickedCard.value)[0] >
            Object.values(currWinner.pickedCard.value)[0]
          ) {
            currWinner = card;
          }
        }

        if (cardsPlayed[cardsPlayed.length - 1] === card) {
          winner = currWinner;
        }
      }

      console.log(`Winner of the round: ${winner.player.nickname}`);
    }
  }
}
