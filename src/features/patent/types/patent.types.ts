export interface Patent {
  patentNumber: string;
  title: string;
  applicant?: string;
  applicationDate?: string;
  summary?: string;
  abstract?: string;
  inventor?: string;
  status?: string;
  registrationDate?: string;
  publicationNumber?: string;
  publicationDate?: string;
  englishTitle?: string;
  classificationCode?: string;
  claimCount?: string;
  expirationDate?: string;
  // 상세 정보 필드
  claimList?: any[];
  bibliographyInfo?: any;
  ipcInfoList?: any[];
  cpcInfoList?: any[];
  technialField?: string;
  backgroundArt?: string;
  techProblem?: string;
  techSolution?: string;
  advantageousEffects?: string;
  descriptionOfDrawings?: string;
  descriptionOfEmbodiments?: string;
  familyList?: any[];
  // 원본 데이터 전체 (전체보기용)
  rawData?: Record<string, any>;
}

