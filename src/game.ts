import prompts from "prompts";
import { Card } from "./card";
import { Player } from "./player";
import { GameState } from "./gamestate";
import { Deck } from "./deck";

export class Game {
  gameState: GameState;
  deck: Deck;
  players: Array<Player>;
  trump?: Card;
  possibleTrump?: Card;
  constructor(deck: Deck, players: Array<Player>) {
    this.deck = deck;
    this.players = players;
    this.gameState = GameState.IDLE;
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

            if (customIndex === 3) {
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
          // console.log("trump");
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
    }
  }
}
