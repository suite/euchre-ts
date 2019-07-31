export enum GameState {
  IDLE,
  DEALING,
  TRUMP_ONE,
  DISCARD_CARD,
  TRUMP_TWO /* if no one picks up trump, move to seperate stage */,
  INGAME,
  FINISHED
}
