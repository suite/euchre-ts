import prompts from "prompts";
import { Card } from "./card";
import { Player } from "./player";
import { GameState } from "./gamestate";
import { Deck } from "./deck";
import { Team } from "./team";
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
  startingSuit: string; //TODO: make sure to reset...
  pickedTrump?: Team;
  constructor(deck: Deck, players: Array<Player>) {
    this.deck = deck;
    this.players = players;
    this.gameState = GameState.IDLE;
    this.currentHand = [];
    this.startingSuit = "";

    console.log(`${this.deck.cards.length}${this.deck.cards.length}`);
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
  }

  //Main game loop
  async start(dealer: Player, starterNum: number) {
    let modiStarterNum: number = starterNum;
    let modiDealer: Player = dealer;
    console.log(`Player #${modiStarterNum + 1} is starting`);
    while (true) {
      switch (this.gameState) {
        case GameState.TRUMP_ONE: {
          this.possibleTrump = this.deck.cards[
            Math.floor(Math.random() * this.deck.cards.length)
          ];

          console.log(`Trump: ${this.possibleTrump.format()}. Pickup or pass?`);
          let customIndex = modiStarterNum; //1
          console.log("debug..", customIndex);
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
          await this.input(modiDealer);
          break;
        }
        case GameState.TRUMP_TWO: {
          // console.log("no trump");
          let customIndex = modiStarterNum; //1
          for (let i = 0; i < 4; i++) {
            if (this.gameState !== GameState.TRUMP_TWO) break;

            await this.input(this.players[customIndex]);

            //TODO; check if err

            if (customIndex === 3) {
              customIndex = 0;
            } else {
              customIndex++;
            }

            //force user to get trump
            if (i === 2) {
              //check to avoid past bug
              if (this.gameState === GameState.TRUMP_TWO)
                await this.input(this.players[customIndex], true);
            }
          }

          break;
        }
        case GameState.INGAME: {
          //TODO; whoever wins starts
          let customIndex = modiStarterNum; //1

          for (let i = 0; i < 5; i++) {
            for (let i = 0; i < 4; i++) {
              if (this.gameState !== GameState.INGAME) break;

              await this.input(this.players[customIndex]);

              if (customIndex === 3) {
                customIndex = 0;
              } else {
                customIndex++;
              }
            }

            this.findBest(this.currentHand);

            //reset every round
            this.currentHand = [];
            this.startingSuit = "";
          }

          //reset after 5 rounds

          //Go to next player

          //VERIFY THIS WORKS
          modiStarterNum++;
          if (modiStarterNum >= 4) {
            modiStarterNum = 0;
          }

          //Select new dealer

          for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].dealer) {
              //pass it on

              //TODO: FIX BUG !!!!!!
              this.players[i].dealer = false;

              let dealIndex: number = i;
              if (dealIndex === 3) {
                dealIndex = 0;
              } else {
                dealIndex = i + 1;
              }
              this.players[dealIndex].dealer = true;

              modiDealer = this.players[dealIndex];

              console.log(this.players[dealIndex].dealer);
              break;
            }
          }

          let winners: Team = this.players[0].team;

          //Loop through the first 2 players, each on different teams
          for (let i = 0; i < 2; i++) {
            if (this.players[i].team.tempScore === 5) {
              winners = this.players[i].team;
              this.players[i].team.score += 2;
              break;
            } else if (
              this.players[i].team.tempScore >= 3 &&
              this.players[i].team != this.pickedTrump
            ) {
              winners = this.players[i].team;
              this.players[i].team.score += 2;
              break;
            } else {
              //This should only have if the second team has higher score.
              if (this.players[i].team.tempScore > winners.tempScore) {
                winners = this.players[i].team;
                this.players[i].team.score++;
                break;
              }
            }
          }

          //TODO: change these numbers to constants

          if (winners.score === 10) {
            for (let i = 0; i < 10; i++)
              console.log(`[${winners.name}] won the game!`);
            this.gameState = GameState.FINISHED;
          } else {
            console.log(`[${winners.name}] won the round!`);

            console.log(
              `[${this.players[0].team.name}] Points: ${
                this.players[0].team.score
              }`
            );
            console.log(
              `[${this.players[1].team.name}] Points: ${
                this.players[1].team.score
              }`
            );

            //TODO: Move to function

            this.startingSuit = "";
            this.trump = undefined;
            this.pickedTrump = undefined;
            let newDeck = new Deck();
            newDeck.shuffle();
            this.deck = newDeck;
            this.deal();

            console.log("DEBUG new starterum", modiStarterNum);

            this.gameState = GameState.TRUMP_ONE;

            break;
          }
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
            this.pickedTrump = player.team;
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
            this.pickedTrump = player.team;
            console.log(`${this.trump.suit} has been selected trump!`);
            this.gameState = GameState.INGAME;
            break;
        }

        break;
      }
      case GameState.INGAME: {
        console.log(`[${player.nickname}] You must play one card: `);
        let nums: Array<String> = [];
        let hasStart: boolean = false;
        //Make sure they follow suit
        if (this.startingSuit != "" && this.trump) {
          for (let i = 0; i < player.cards.length; i++) {
            if (player.cards[i].suit === this.startingSuit) {
              //they must play this card
              hasStart = true;
              nums.push(i.toString());
            }
          }
        }

        if (!hasStart) {
          for (let i = 0; i < player.cards.length; i++) {
            nums.push(i.toString());
          }
        }

        for (let i = 0; i < player.cards.length; i++) {
          console.log(`[${i}] ${player.cards[i].format()}`);
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

        if (this.startingSuit === "") {
          this.startingSuit = pickedCard.suit;
        }

        let index = parseInt(response.value);
        if (index > -1) {
          player.cards.splice(index, 1);
        }

        break;
      }
    }
  }

  findBest(cardsPlayed: Array<Hand>) {
    //make sure we have a trump card "H", "D", "S", "C"
    if (this.trump) {
      //TODO: clean this up
      let winner: Hand = {
        pickedCard: new Card("", {}),
        player: new Player(false, "", new Team(""))
      };

      //TODO add ten if trump

      let currWinner: Hand = cardsPlayed[0];
      if (currWinner.pickedCard.suit === this.trump.suit) {
        currWinner.pickedCard.value[
          Object.keys(currWinner.pickedCard.value)[0]
        ] = Object.values(currWinner.pickedCard.value)[0] + 10;
      }

      const secondSuits = { H: "D", D: "H", C: "S", S: "C" };

      // if not follow suit, disregard
      // trump suits always high
      let trumpSuit = this.trump.suit;
      for (let card of cardsPlayed) {
        //auto win if jack trump
        // console.log(card.pickedCard, new Card(trumpSuit, { J: 11 }));
        // console.log(
        //   JSON.stringify(card.pickedCard) ===
        //     JSON.stringify(new Card(trumpSuit, { J: 11 }))
        // );
        if (
          JSON.stringify(card.pickedCard) ===
          JSON.stringify(new Card(trumpSuit, { J: 11 }))
        ) {
          winner = card;
          // console.log("PLAYED HIGH TRUMP");
          break;
        } else if (
          //TODO: fix formatting/ :/
          JSON.stringify(card.pickedCard) ===
          JSON.stringify(
            new Card(secondSuits[trumpSuit as keyof typeof secondSuits], {
              J: 11
            })
          )
        ) {
          winner = card;
          // console.log("PLAYED SECOND HIGH TRUMP");
        } else if (card.pickedCard.suit === this.trump.suit) {
          //trump higher
          // console.log("PLAYED TRUMP");
          if (
            Object.values(card.pickedCard.value)[0] + 10 >
            Object.values(currWinner.pickedCard.value)[0]
          ) {
            currWinner = card;
          }
        } else {
          if (card.pickedCard.suit === this.startingSuit) {
            // console.log("PLAYED CORRECT SUIT");
            if (
              Object.values(card.pickedCard.value)[0] >
              Object.values(currWinner.pickedCard.value)[0]
            ) {
              currWinner = card;
            }
          }
        }

        if (
          cardsPlayed[cardsPlayed.length - 1] === card &&
          winner.pickedCard.suit === ""
        ) {
          winner = currWinner;
        }
      }

      console.log(`[${winner.player.nickname}] won the round!`);

      //Add one to teams score
      winner.player.team.tempScore++;
    }
  }
}
