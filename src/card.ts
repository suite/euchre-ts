//TODO: change to interface?
import colors from "colors";

export class Card {
  suit: string;
  value: object;
  constructor(suit: string, value: object) {
    this.suit = suit;
    this.value = value;
  }

  //♦️♥️ ♠♣️️️

  format(): string {
    switch (this.suit) {
      case "S":
        return colors.black.bgWhite(`${Object.keys(this.value)[0]}♠ `);
      case "C":
        return colors.black.bgWhite(`${Object.keys(this.value)[0]}♣ `);
      case "H":
        return colors.red.bgWhite(`${Object.keys(this.value)[0]}♥ `);
      case "D":
        return colors.red.bgWhite(`${Object.keys(this.value)[0]}♦ `);
      default:
        return "unknown suit";
    }
  }
}
