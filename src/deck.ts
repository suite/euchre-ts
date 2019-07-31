import { Card } from "./card";

export class Deck {
  suits: Array<string>;
  values: Array<object>;
  cards: Array<Card>;
  constructor() {
    this.suits = ["H", "D", "S", "C"];
    this.values = [
      {
        Nine: 9
      },
      {
        Ten: 10
      },
      {
        J: 11
      },
      {
        Q: 12
      },
      {
        K: 13
      },
      {
        A: 14
      }
    ];

    this.cards = [];
    for (let suit of this.suits) {
      for (let value of this.values) {
        this.cards.push(new Card(suit, value));
      }
    }
  }

  shuffle() {
    this.cards.sort(() => Math.random() - 0.5);
  }
}
