export interface DraftVersion {
  version: number;
  content: string;
  timestamp: Date;
  feedbackUsed?: string;
}

