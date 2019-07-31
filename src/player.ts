import { Card } from "./card";

export class Player {
  dealer: boolean = false;
  cards: Array<Card>;
  nickname: string;
  constructor(isDealer: boolean, nickname: string) {
    if (isDealer) this.dealer = isDealer;
    this.cards = [];
    this.nickname = nickname;
  }
}
