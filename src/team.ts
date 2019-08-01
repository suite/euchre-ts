export class Team {
  id: number;
  name: string;
  score: number;
  tempScore: number;
  constructor(name: string) {
    this.name = name;
    this.id = Math.floor(1000 + Math.random() * 9000);
    this.score = 0;
    this.tempScore = 0;
  }
}
