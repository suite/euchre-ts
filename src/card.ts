//TODO: change to interface?
export class Card {
  suit: string;
  value: object;
  constructor(suit: string, value: object) {
    this.suit = suit;
    this.value = value;
  }

  format(): string {
    return `Suit: ${this.suit} Value: ${Object.keys(this.value)[0]}`;
  }
}
