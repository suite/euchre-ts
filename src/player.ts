import { Card } from "./card";
import { Team } from "./team";

export class Player {
  dealer: boolean = false;
  cards: Array<Card>;
  nickname: string;
  team: Team;
  constructor(isDealer: boolean, nickname: string, team: Team) {
    if (isDealer) this.dealer = isDealer;
    this.cards = [];
    this.nickname = nickname;
    this.team = team;
  }
}
