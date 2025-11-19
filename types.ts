export interface WindSettings {
  speed: number;
  directionX: number;
  directionY: number;
  directionZ: number;
  particleCount: number;
}

export interface ModelSettings {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

export interface AnalysisResult {
  markdown: string;
  loading: boolean;
  error: string | null;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
