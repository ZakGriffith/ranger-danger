type BlobPhase = 'rolling' | 'windup' | 'airborne' | 'recovery';

export class InfectedBlobState {
  private currentPhase: BlobPhase = 'rolling';
  elapsed = 0;
  rollFrame: number;
  previousX: number;
  previousY: number;
  velocityX = 0;
  velocityY = 0;

  constructor(x: number, y: number, initialFrame: number) {
    this.previousX = x;
    this.previousY = y;
    this.rollFrame = initialFrame;
  }

  get phase(): BlobPhase { return this.currentPhase; }
  get attacking(): boolean { return this.currentPhase !== 'rolling'; }

  startWindup(velocityX: number, velocityY: number): void {
    this.currentPhase = 'windup';
    this.elapsed = 0;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  launch(): void {
    this.currentPhase = 'airborne';
  }

  land(): void {
    this.currentPhase = 'recovery';
  }

  resumeRolling(): void {
    this.currentPhase = 'rolling';
    this.elapsed = 0;
    this.rollFrame = 0;
    this.velocityX = 0;
    this.velocityY = 0;
  }
}
