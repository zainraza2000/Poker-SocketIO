import * as PokerEvaluator from "poker-evaluator";
import { Socket } from "socket.io";

export enum Text {
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
  SIX = "6",
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",
  TEN = "10",
  ACE = "A",
  KING = "K",
  QUEEN = "Q",
  JACK = "J",
}

export enum Symbol {
  CLOVE = "♣",
  SPADE = "♠️",
  DIAMOND = "♦",
  HEARTS = "♥️",
}

export enum PlayerState {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export class Card {
  symbol: Symbol;
  text: Text;
  constructor(symbol: Symbol, text: Text) {
    this.symbol = symbol;
    this.text = text;
  }
}

export const MAP_SYMBOL_SUITE = {
  "♣": "c",
  "♥️": "h",
  "♦": "d",
  "♠️": "s",
};

export class Deck {
  private cards: Card[] = [];

  constructor() {
    const symbols = Object.values(Symbol);
    const texts = Object.values(Text);
    for (const symbol of symbols) {
      for (const text of texts) {
        this.cards.push(new Card(symbol, text));
      }
    }
  }

  acquire(): Card | undefined {
    return this.cards.pop();
  }

  release(cards: Card[]) {
    if (this.cards.length + cards.length <= 52) {
      console.log("releasing cards ... ", this.cards.length + cards.length);
      this.cards.push(...cards);
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  dealCards(numPlayers: number, cardsPerPlayer: number): Card[][] {
    const hands: Card[][] = [];
    this.shuffle();
    for (let i = 0; i < numPlayers; i++) {
      const hand: Card[] = [];
      for (let j = 0; j < cardsPerPlayer; j++) {
        const card = this.acquire();
        if (card) {
          hand.push(card);
        }
      }
      hands.push(hand);
    }
    return hands;
  }
}

export class Player {
  private cards: Card[];
  private balance: number;
  private isActive: boolean;
  private socketId: string;

  constructor(balance: number, socketId: string) {
    this.cards = [];
    this.balance = balance;
    this.isActive = false;
    this.socketId = socketId;
  }
  subtractBalance(subtract: number) {
    if (subtract <= this.balance) this.balance -= subtract;
    else this.balance = 0;
  }
  addBalance(add: number) {
    this.balance += add;
  }
  setCards(cards: Card[]) {
    if (cards && cards.length == 2) this.cards = cards;
  }
  getCards() {
    return this.cards;
  }
  isPlayerActive() {
    return this.isActive;
  }
  setSocket(socketId: string): void {
    this.socketId = socketId;
  }
  getSocketId(): string {
    return this.socketId;
  }
}

export class Poker {
  private players: Player[];
  private deck: Deck;
  private hand: Card[];
  private stage: number;
  private stake: number;
  private raised: number;
  private numPlayers: number;

  constructor(numPlayers: number) {
    this.players = [];
    this.deck = new Deck();
    this.hand = [];
    this.stage = 1;
    this.stake = 0;
    this.raised = 0;
    this.numPlayers = numPlayers;
  }

  startHand() {
    const cards = this.deck.dealCards(this.players.length, 2);
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].setCards(cards[i]);
    }
    this.stage = 1;
    this.stake = 0;
  }

  addPlayer(socketId: string): string {
    const player = new Player(5000, socketId);
    this.players.push(player);
    return socketId;
  }

  endHand(winnerId: number) {
    this.players[winnerId].addBalance(this.stake);
    this.deck.release(this.hand);
    this.players.forEach((player) => this.deck.release(player.getCards()));
    this.stake = 0;
    this.stage = 1;
    this.hand = [];
  }
  calculateWinner(playerCardPairs: Record<string, Card[]>): string | null {
    let winnerId: string | null = null;
    let bestHandValue = 0;
    for (const playerId in playerCardPairs) {
      if (Object.prototype.hasOwnProperty.call(playerCardPairs, playerId)) {
        const playerHoleCards = playerCardPairs[playerId];
        const combinedHand = [...playerHoleCards, ...this.hand];
        const handValue = PokerEvaluator.evalHand(
          combinedHand.map(
            (card) =>
              card.text +
              MAP_SYMBOL_SUITE[card.symbol as keyof typeof MAP_SYMBOL_SUITE]
          )
        );
        if (handValue.value > bestHandValue) {
          bestHandValue = handValue.value;
          winnerId = playerId;
        }
      }
    }
    return winnerId;
  }
  getHandWinner() {
    let playerCardPairs: Record<string, Card[]> = {};
    this.players.forEach((player) => {
      if (player.isPlayerActive()) {
        playerCardPairs[player.getSocketId()] = player.getCards();
      }
    });
    return this.calculateWinner(playerCardPairs);
  }
}
