export enum GameState {
  IDLE,
  DEALING,
  TRUMP_ONE,
  TRUMP_TWO /* if no one picks up trump, move to seperate stage */,
  INGAME,
  FINISHED
}
