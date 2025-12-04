/**
 * 공공데이터포털 특허 정보 검색 API
 * https://www.data.go.kr/data/15001113/openapi.do
 */

import * as fs from "fs";
import * as path from "path";
// Next.js에서 xlsx 라이브러리를 동적으로 import
let XLSX: any;
try {
  XLSX = require("xlsx");
} catch (e) {
  console.error("[patent-search] Failed to load xlsx library:", e);
}

const PATENT_API_BASE = "http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice";

// JSON 파일에서 로드한 특허 데이터를 메모리에 캐싱
let patentDataCache: PatentSearchResult[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 1 * 60 * 1000; // 1분 캐시 (개발 중에는 짧게 설정)

// 개발 모드에서는 캐시를 비활성화하거나 매우 짧게 설정
const isDevelopment = process.env.NODE_ENV !== "production";
const DEV_CACHE_TTL = 0; // 개발 모드에서는 캐시 사용 안 함

export interface PatentSearchParams {
  keywords: string[];
  numOfRows?: number; // 기본값: 10
  pageNo?: number; // 기본값: 1
}

export interface PatentSearchResult {
  patentNumber: string;
  title: string;
  applicant?: string;
  applicationDate?: string;
  summary?: string;
  abstract?: string;
  inventor?: string;
  status?: string;
  // RG_BS.txt 파일의 추가 필드들
  registrationDate?: string;
  publicationNumber?: string;
  publicationDate?: string;
  englishTitle?: string;
  classificationCode?: string;
  claimCount?: string;
  expirationDate?: string;
  // 원본 데이터 전체 (전체보기용)
  rawData?: Record<string, string>;
}

/**
 * 공공데이터포털 특허 API를 직접 호출하는 함수
 * API 키가 필요한 경우 환경변수에서 가져옵니다.
 */
export async function searchPatentsFromAPI(
  params: PatentSearchParams
): Promise<PatentSearchResult[]> {
  const apiKey = process.env.PATENT_API_KEY || process.env.DATA_GO_KR_API_KEY;
  
  if (!apiKey) {
    console.warn("[patent-search] API key not found, will use AI-based search");
    return [];
  }

  const keywordsText = params.keywords.join(" OR ");
  const numOfRows = params.numOfRows || 10;
  const pageNo = params.pageNo || 1;

  try {
    // 공공데이터포털 특허 정보 API 호출
    // 실제 API 엔드포인트와 파라미터는 API 문서에 따라 조정 필요
    const url = `${PATENT_API_BASE}?serviceKey=${encodeURIComponent(apiKey)}&keyword=${encodeURIComponent(keywordsText)}&numOfRows=${numOfRows}&pageNo=${pageNo}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[patent-search] API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    // API 응답 형식에 따라 파싱 로직 조정 필요
    // 예시 구조 (실제 API 응답에 맞게 수정 필요)
    if (data.response?.body?.items) {
      return data.response.body.items.map((item: any) => ({
        patentNumber: item.applicationNumber || item.patentNumber || "",
        title: item.inventionTitle || item.title || "",
        applicant: item.applicantName || item.applicant || "",
        applicationDate: item.applicationDate || "",
        summary: item.abstract || item.summary || "",
        abstract: item.abstract,
        inventor: item.inventorName || item.inventor,
        status: item.legalStatus || item.status,
      }));
    }

    return [];
  } catch (error) {
    console.error("[patent-search] Error calling patent API:", error);
    return [];
  }
}

/**
 * 재귀적으로 디렉토리에서 파일을 찾는 함수
 */
function findFilesRecursive(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // 하위 폴더도 재귀적으로 탐색
      files.push(...findFilesRecursive(fullPath, extensions));
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      if (extensions.some(e => item.name.endsWith(e))) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * LAST_RG_HOLDER.txt 파일에서 특허번호별 출원인 정보를 로드하는 함수
 * 파일이 없어도 에러 없이 빈 Map을 반환합니다.
 */
function loadApplicantMap(): Map<string, string> {
  const applicantMap = new Map<string, string>();
  
  try {
    const patentsDir = path.join(process.cwd(), "data", "patents");
    
    if (!fs.existsSync(patentsDir)) {
      console.log("[patent-search] Patents directory does not exist, skipping applicant map loading");
      return applicantMap;
    }
    
    const holderFiles = findFilesRecursive(patentsDir, [".txt"]).filter((filePath) => {
      const fileName = path.basename(filePath);
      return fileName.includes("LAST_RG_HOLDER");
    });

    if (holderFiles.length === 0) {
      console.log("[patent-search] No LAST_RG_HOLDER files found, applicant information will be empty");
      return applicantMap;
    }

    console.log(`[patent-search] Found ${holderFiles.length} LAST_RG_HOLDER files`);

    const pipeChar = String.fromCharCode(182);
    
    for (const filePath of holderFiles) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split("\n").filter((line) => line.trim().length > 0);
        
        if (lines.length < 2) continue;
        
        const headers = lines[0].split(pipeChar).map((h) => h.trim());
        const patentNumberIndex = headers.indexOf("등록번호");
        const applicantIndex = headers.indexOf("최종권리권자성명");
        
        if (patentNumberIndex === -1 || applicantIndex === -1) {
          console.warn(`[patent-search] Missing required columns in LAST_RG_HOLDER file: ${path.basename(filePath)}`);
          continue;
        }
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(pipeChar).map((v) => v.trim());
          const patentNumber = values[patentNumberIndex] || "";
          const applicant = values[applicantIndex] || "";
          
          if (patentNumber && applicant && !applicantMap.has(patentNumber)) {
            applicantMap.set(patentNumber, applicant);
          }
        }
      } catch (error) {
        console.error(`[patent-search] Error reading LAST_RG_HOLDER file ${filePath}:`, error);
        // 파일 읽기 실패해도 계속 진행
      }
    }
    
    console.log(`[patent-search] Loaded ${applicantMap.size} applicant mappings`);
  } catch (error) {
    console.error("[patent-search] Error loading applicant map:", error);
    // 에러가 발생해도 빈 Map 반환하여 계속 진행
  }
  
  return applicantMap;
}

/**
 * CSV/TXT 파일에서 특허 데이터를 로드하는 함수
 * data/patents/ 폴더의 모든 CSV/TXT 파일을 재귀적으로 읽어서 병합합니다.
 */
async function loadPatentsFromCSV(): Promise<PatentSearchResult[]> {
  try {
    const patentsDir = path.join(process.cwd(), "data", "patents");
    
    if (!fs.existsSync(patentsDir)) {
      return [];
    }

    // 재귀적으로 모든 CSV/TXT 파일 찾기
    const csvFiles = findFilesRecursive(patentsDir, [".csv", ".txt"]);

    // RG_BS.txt 파일만 필터링
    const rgBsFiles = csvFiles.filter((filePath) => {
      const fileName = path.basename(filePath);
      return fileName.includes("RG_BS");
    });

    console.log(`[patent-search] Found ${csvFiles.length} CSV/TXT files, ${rgBsFiles.length} RG_BS files`);

    if (rgBsFiles.length === 0) {
      console.warn("[patent-search] No RG_BS.txt files found");
      return [];
    }

    // 출원인 정보 로드 (LAST_RG_HOLDER.txt에서)
    const applicantMap = loadApplicantMap();

    const allPatents: PatentSearchResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const filePath of rgBsFiles) {
      try {
        const fileName = path.basename(filePath);
        
        if (!fs.existsSync(filePath)) {
          console.warn(`[patent-search] File not found: ${filePath}`);
          failCount++;
          continue;
        }
        
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split("\n").filter((line) => line.trim().length > 0);
        
        if (lines.length < 2) {
          console.warn(`[patent-search] File has no data rows: ${fileName}`);
          failCount++;
          continue;
        }

        // 첫 번째 줄은 헤더
        // 구분자 감지: ¶ (파이프, 유니코드 182), \t (탭), , (쉼표)
        const pipeChar = String.fromCharCode(182);
        let delimiter = "\t";
        let headers = lines[0].split("\t").map((h) => h.trim());
        
        // 파이프 문자(¶) 구분자 확인
        if (headers.length === 1 && lines[0].includes(pipeChar)) {
          headers = lines[0].split(pipeChar).map((h) => h.trim());
          if (headers.length > 1) {
            delimiter = pipeChar;
          }
        }
        
        if (headers.length === 1) {
          // 탭이 없으면 쉼표로 시도 (CSV)
          const csvHeaders = lines[0].split(",").map((h) => h.trim());
          if (csvHeaders.length > 1) {
            headers.length = 0;
            headers.push(...csvHeaders);
            delimiter = ",";
          }
        }

        console.log(`[patent-search] Reading file: ${fileName} (${lines.length - 1} rows, delimiter: ${delimiter === pipeChar ? "pipe" : delimiter === "\t" ? "tab" : "comma"})`);

        // 각 행을 파싱
        let validCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // 구분자에 따라 파싱
          let values: string[] = [];
          if (delimiter === pipeChar) {
            values = line.split(pipeChar).map((v) => v.trim());
          } else if (delimiter === "\t") {
            values = line.split("\t").map((v) => v.trim());
          } else {
            // CSV 파싱 (쉼표로 구분, 따옴표 처리)
            values = [];
            let current = "";
            let inQuotes = false;
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                values.push(current.trim());
                current = "";
              } else {
                current += char;
              }
            }
            values.push(current.trim());
          }

          // 헤더와 값 매핑
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          // PatentSearchResult 형식으로 변환
          // RG_BS.txt 파일의 컬럼명: 등록번호, 등록일자, 출원번호, 출원일자, 발명의명칭 등
          const patentNumber = row["등록번호"] || row["출원번호"] || row["특허번호"] || row["patentNumber"] || row["특허 번호"] || row["번호"] || "";
          
          const patent: PatentSearchResult = {
            patentNumber: patentNumber,
            title: row["발명의명칭"] || row["발명의 명칭"] || row["특허명"] || row["title"] || row["제목"] || "",
            // LAST_RG_HOLDER.txt에서 출원인 정보 가져오기
            applicant: applicantMap.get(patentNumber) || row["출원인"] || row["applicant"] || row["출원인명"] || row["최종권리자"] || "",
            applicationDate: row["출원일자"] || row["출원일"] || row["applicationDate"] || row["등록일자"] || row["날짜"] || row["공개일자"] || "",
            summary: row["요약"] || row["summary"] || row["요약문"] || row["개요"] || "",
            abstract: row["상세"] || row["abstract"] || row["상세설명"] || row["내용"] || "",
            inventor: row["발명자"] || row["inventor"] || row["발명자명"] || "",
            status: row["소멸원인"] || row["상태"] || row["status"] || row["법적상태"] || "",
            // RG_BS.txt 파일의 추가 필드들
            registrationDate: row["등록일자"] || "",
            publicationNumber: row["공고번호"] || "",
            publicationDate: row["공고일자"] || "",
            englishTitle: row["영문발명의명칭"] || "",
            classificationCode: row["지정분류코드"] || "",
            claimCount: row["청구항수"] || "",
            expirationDate: row["존속기간만료일자"] || "",
            // 원본 데이터 전체 저장 (전체보기용)
            rawData: { ...row },
          };
          
          // 출원일자 형식 변환 (2022.08.08 -> 2022-08-08)
          if (patent.applicationDate && patent.applicationDate.includes(".")) {
            patent.applicationDate = patent.applicationDate.replace(/\./g, "-");
          }

          // 필수 필드가 있는 경우에만 추가
          if (patent.patentNumber || patent.title) {
            allPatents.push(patent);
            validCount++;
          }
        }
        
        console.log(`[patent-search] Successfully loaded ${validCount} valid patents from ${fileName}`);
        successCount++;
      } catch (error) {
        console.error(`[patent-search] Error reading CSV/TXT file ${fileName}:`, error);
        if (error instanceof Error) {
          console.error(`[patent-search] Error message: ${error.message}`);
          console.error(`[patent-search] Error stack:`, error.stack);
        }
        failCount++;
      }
    }

    console.log(`[patent-search] CSV/TXT loading summary: ${successCount} succeeded, ${failCount} failed, total patents before deduplication: ${allPatents.length}`);
    
    // patentNumber 기준으로 중복 제거 (여러 파일에서 같은 특허가 있을 수 있음)
    const uniquePatentsMap = new Map<string, PatentSearchResult>();
    for (const patent of allPatents) {
      const key = patent.patentNumber || `${patent.title}_${patent.applicationDate}`;
      // 이미 존재하지 않거나, 존재하지만 현재 것이 더 많은 정보를 가지고 있으면 업데이트
      if (!uniquePatentsMap.has(key) || 
          (!patent.title && uniquePatentsMap.get(key)?.title) ||
          (!patent.applicant && uniquePatentsMap.get(key)?.applicant)) {
        // 현재 특허가 더 많은 정보를 가지고 있으면 업데이트
        const existing = uniquePatentsMap.get(key);
        if (existing) {
          // 빈 필드를 기존 값으로 채우기
          uniquePatentsMap.set(key, {
            ...patent,
            title: patent.title || existing.title,
            applicant: patent.applicant || existing.applicant,
            applicationDate: patent.applicationDate || existing.applicationDate,
            summary: patent.summary || existing.summary,
            abstract: patent.abstract || existing.abstract,
            inventor: patent.inventor || existing.inventor,
            status: patent.status || existing.status,
          });
        } else {
          uniquePatentsMap.set(key, patent);
        }
      }
    }
    
    const uniquePatents = Array.from(uniquePatentsMap.values());
    console.log(`[patent-search] After deduplication: ${uniquePatents.length} unique patents`);
    
    return uniquePatents;
  } catch (error) {
    console.error("[patent-search] Error loading patents from CSV/TXT:", error);
    return [];
  }
}

/**
 * 엑셀 파일에서 특허 데이터를 로드하는 함수
 * data/patents/ 폴더의 모든 엑셀 파일(.xlsx, .xls)을 읽어서 병합합니다.
 */
async function loadPatentsFromExcel(): Promise<PatentSearchResult[]> {
  try {
    const patentsDir = path.join(process.cwd(), "data", "patents");
    
    if (!fs.existsSync(patentsDir)) {
      console.log("[patent-search] Patents directory does not exist");
      return [];
    }

    const files = fs.readdirSync(patentsDir);
    const excelFiles = files.filter((file) => 
      file.endsWith(".xlsx") || file.endsWith(".xls")
    );

    console.log(`[patent-search] Found ${excelFiles.length} Excel files:`, excelFiles);

    if (excelFiles.length === 0) {
      return [];
    }

    const allPatents: PatentSearchResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const file of excelFiles) {
      try {
        const filePath = path.join(patentsDir, file);
        
        // 파일이 존재하고 읽을 수 있는지 확인
        if (!fs.existsSync(filePath)) {
          console.warn(`[patent-search] File not found: ${file}`);
          failCount++;
          continue;
        }
        
        // 파일이 열려있는지 확인 (파일 크기로 간접 확인)
        let stats;
        try {
          stats = fs.statSync(filePath);
          if (stats.size === 0) {
            console.warn(`[patent-search] File is empty: ${file}`);
            failCount++;
            continue;
          }
          console.log(`[patent-search] Reading file: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        } catch (statError) {
          console.warn(`[patent-search] Cannot access file stats: ${file}`, statError);
          failCount++;
          continue;
        }
        
        // xlsx 라이브러리가 로드되지 않았으면 동적으로 로드
        if (!XLSX) {
          XLSX = require("xlsx");
        }
        
        const workbook = XLSX.readFile(filePath);
        
        // 첫 번째 시트를 읽음
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON 형식으로 변환 (헤더 포함)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          defval: "", // 빈 셀은 빈 문자열로
          raw: false, // 모든 값을 문자열로 변환
        });

        // 각 행을 PatentSearchResult 형식으로 변환
        let validCount = 0;
        for (const row of jsonData as any[]) {
          // 컬럼명 매핑 (다양한 형식 지원)
          const patent: PatentSearchResult = {
            patentNumber: row["특허번호"] || row["patentNumber"] || row["특허 번호"] || row["번호"] || row["출원번호"] || row["등록번호"] || "",
            title: row["특허명"] || row["title"] || row["제목"] || row["발명의 명칭"] || row["발명의명칭"] || "",
            applicant: row["출원인"] || row["applicant"] || row["출원인명"] || row["최종권리자"] || "",
            applicationDate: row["출원일"] || row["applicationDate"] || row["출원일자"] || row["날짜"] || row["등록일자"] || row["공개일자"] || "",
            summary: row["요약"] || row["summary"] || row["요약문"] || row["개요"] || "",
            abstract: row["상세"] || row["abstract"] || row["상세설명"] || row["내용"] || "",
            inventor: row["발명자"] || row["inventor"] || row["발명자명"] || "",
            status: row["상태"] || row["status"] || row["법적상태"] || "",
          };
          
          // 출원일자 형식 변환 (2022.08.08 -> 2022-08-08)
          if (patent.applicationDate && patent.applicationDate.includes(".")) {
            patent.applicationDate = patent.applicationDate.replace(/\./g, "-");
          }

          // 필수 필드가 있는 경우에만 추가
          if (patent.patentNumber || patent.title) {
            allPatents.push(patent);
            validCount++;
          }
        }
        
        console.log(`[patent-search] Successfully loaded ${validCount} valid patents from ${file} (${jsonData.length} total rows)`);
        successCount++;
      } catch (error) {
        console.error(`[patent-search] Error reading Excel file ${file}:`, error);
        if (error instanceof Error) {
          console.error(`[patent-search] Error message: ${error.message}`);
          console.error(`[patent-search] Error stack: ${error.stack?.substring(0, 200)}`);
        }
        failCount++;
      }
    }

    console.log(`[patent-search] Excel loading summary: ${successCount} succeeded, ${failCount} failed, total patents: ${allPatents.length}`);
    return allPatents;
  } catch (error) {
    console.error("[patent-search] Error loading patents from Excel:", error);
    return [];
  }
}

/**
 * JSON 파일에서 특허 데이터를 로드하는 함수
 * data/patents/ 폴더의 모든 JSON 파일을 읽어서 병합합니다.
 */
async function loadPatentsFromJSON(): Promise<PatentSearchResult[]> {
  // 캐시가 유효하면 캐시 반환
  const now = Date.now();
  if (patentDataCache && (now - cacheTimestamp) < CACHE_TTL) {
    return patentDataCache;
  }

  try {
    const patentsDir = path.join(process.cwd(), "data", "patents");
    
    // data/patents 폴더가 없으면 생성
    if (!fs.existsSync(patentsDir)) {
      fs.mkdirSync(patentsDir, { recursive: true });
      console.log("[patent-search] Created patents directory:", patentsDir);
      patentDataCache = [];
      cacheTimestamp = now;
      return [];
    }

    const files = fs.readdirSync(patentsDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    if (jsonFiles.length === 0) {
      return [];
    }

    const allPatents: PatentSearchResult[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(patentsDir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(fileContent);

        // JSON 파일이 배열인 경우
        if (Array.isArray(data)) {
          allPatents.push(...data);
        }
        // JSON 파일이 단일 객체인 경우
        else if (data.patents && Array.isArray(data.patents)) {
          allPatents.push(...data.patents);
        }
        // JSON 파일이 단일 특허 객체인 경우
        else if (data.patentNumber || data.title) {
          allPatents.push(data);
        }
      } catch (error) {
        console.error(`[patent-search] Error reading file ${file}:`, error);
      }
    }

    return allPatents;
  } catch (error) {
    console.error("[patent-search] Error loading patents from JSON:", error);
    return [];
  }
}

/**
 * 키워드로 특허 데이터를 검색하는 함수
 * 제목, 요약, 출원인, 발명자 등에서 키워드를 검색합니다.
 */
function searchPatentsInData(
  patents: PatentSearchResult[],
  keywords: string[]
): PatentSearchResult[] {
  if (patents.length === 0) {
    return [];
  }

  // 키워드가 없으면 빈 배열 반환 (임의 특허 반환 방지)
  if (!keywords || keywords.length === 0) {
    return [];
  }

  // 키워드를 소문자로 변환하고 공백 제거
  const lowerKeywords = keywords
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length > 0);

  if (lowerKeywords.length === 0) {
    return []; // 키워드가 없으면 빈 배열 반환
  }

  // 각 특허에 대해 점수 계산 (매칭되는 키워드 수)
  const scoredPatents = patents.map((patent) => {
    const searchText = [
      patent.title || "",
      patent.summary || "",
      patent.abstract || "",
      patent.applicant || "",
      patent.inventor || "",
      patent.patentNumber || "",
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    let matchedKeywords = 0;
    
    for (const keyword of lowerKeywords) {
      // 키워드가 검색 텍스트에 포함되어 있는지 확인
      if (searchText.includes(keyword)) {
        matchedKeywords++;
        score++;
        
        // 제목에 포함되면 가중치 추가
        if ((patent.title || "").toLowerCase().includes(keyword)) {
          score += 2;
        }
        
        // 요약에 포함되면 가중치 추가
        if ((patent.summary || "").toLowerCase().includes(keyword)) {
          score += 1;
        }
      }
    }

    return { patent, score, matchedKeywords };
  });

  // 키워드가 하나라도 매칭된 것만 필터링하고 점수 순으로 정렬
  const matchedPatents = scoredPatents
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      // 먼저 매칭된 키워드 수로 정렬
      if (b.matchedKeywords !== a.matchedKeywords) {
        return b.matchedKeywords - a.matchedKeywords;
      }
      // 그 다음 점수로 정렬
      return b.score - a.score;
    })
    .map((item) => item.patent);

  // 매칭된 결과가 없으면 빈 배열 반환 (임의 특허 반환 방지)
  if (matchedPatents.length === 0) {
    console.log("[patent-search] No exact matches found for keywords:", keywords);
    return [];
  }

  console.log("[patent-search] Found", matchedPatents.length, "matching patents");
  return matchedPatents;
}

/**
 * 모든 파일(JSON + Excel)에서 특허 데이터를 로드하는 함수
 */
async function loadAllPatents(): Promise<PatentSearchResult[]> {
  // 캐시가 유효하면 캐시 반환
  const now = Date.now();
  const effectiveTTL = isDevelopment ? DEV_CACHE_TTL : CACHE_TTL;
  
  if (patentDataCache && effectiveTTL > 0 && (now - cacheTimestamp) < effectiveTTL) {
    console.log("[patent-search] Using cached patents:", patentDataCache.length, "(cache age:", Math.round((now - cacheTimestamp) / 1000), "seconds)");
    return patentDataCache;
  }
  
  // 캐시가 만료되었거나 없으면 강제로 새로고침
  console.log("[patent-search] Cache expired or empty, reloading patents...");
  patentDataCache = null;
  cacheTimestamp = 0;

  try {
    const patentsDir = path.join(process.cwd(), "data", "patents");
    
    // data/patents 폴더가 없으면 생성
    if (!fs.existsSync(patentsDir)) {
      fs.mkdirSync(patentsDir, { recursive: true });
      console.log("[patent-search] Created patents directory:", patentsDir);
      patentDataCache = [];
      cacheTimestamp = now;
      return [];
    }

    console.log("[patent-search] Loading patents from CSV/TXT files only...");
    
    // CSV/TXT 파일만 로드
    let csvPatents: PatentSearchResult[] = [];
    
    try {
      csvPatents = await loadPatentsFromCSV();
      console.log("[patent-search] Loaded CSV/TXT patents:", csvPatents.length);
    } catch (error) {
      console.error("[patent-search] Error loading CSV/TXT patents:", error);
      if (error instanceof Error) {
        console.error("[patent-search] Error message:", error.message);
        console.error("[patent-search] Error stack:", error.stack);
      }
    }
    
    const allPatents = csvPatents;

    console.log(`[patent-search] Loaded ${allPatents.length} patents total (${csvPatents.length} from CSV/TXT)`);
    
    patentDataCache = allPatents;
    cacheTimestamp = now;
    return allPatents;
  } catch (error) {
    console.error("[patent-search] Error loading all patents:", error);
    if (error instanceof Error) {
      console.error("[patent-search] Error message:", error.message);
      console.error("[patent-search] Error stack:", error.stack);
    }
    throw error; // 오류를 다시 throw하여 상위에서 처리할 수 있도록
  }
}

/**
 * 파일(JSON + Excel)에서 특허를 검색하는 함수
 * data/patents/ 폴더의 모든 파일들을 검색합니다.
 */
export async function searchPatentsFromJSON(
  params: PatentSearchParams
): Promise<PatentSearchResult[]> {
  try {
    console.log("[patent-search] Starting search with keywords:", params.keywords);
    const patents = await loadAllPatents();
    
    console.log("[patent-search] Loaded patents count:", patents.length);
    
    if (patents.length === 0) {
      console.log("[patent-search] No patents loaded, returning empty array");
      return [];
    }

    // 키워드가 없으면 빈 배열 반환 (임의 특허 반환 방지)
    if (!params.keywords || params.keywords.length === 0) {
      console.log("[patent-search] No keywords provided, returning empty array");
      return [];
    }

    const results = searchPatentsInData(patents, params.keywords);
    const numOfRows = params.numOfRows || 10;
    
    console.log("[patent-search] Search results count:", results.length);
    
    // 검색 결과 샘플 로그 (디버깅용)
    if (results.length > 0) {
      console.log("[patent-search] Sample result:", {
        patentNumber: results[0].patentNumber,
        title: results[0].title?.substring(0, 50),
        applicant: results[0].applicant
      });
    }
    
    return results.slice(0, numOfRows);
  } catch (error) {
    console.error("[patent-search] Error searching patents from files:", error);
    if (error instanceof Error) {
      console.error("[patent-search] Error message:", error.message);
      console.error("[patent-search] Error stack:", error.stack);
    }
    throw error; // 오류를 다시 throw하여 상위에서 처리할 수 있도록
  }
}

/**
 * 특허 데이터 캐시를 강제로 새로고침하는 함수
 */
export function refreshPatentCache(): void {
  patentDataCache = null;
  cacheTimestamp = 0;
  console.log("[patent-search] Patent cache refreshed");
}

/**
 * 캐시를 강제로 새로고침하고 특허 데이터를 다시 로드하는 API 엔드포인트용 함수
 */
export async function reloadPatents(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    refreshPatentCache();
    const patents = await loadAllPatents();
    return {
      success: true,
      count: patents.length,
      message: `Successfully loaded ${patents.length} patents`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      count: 0,
      message: `Failed to reload patents: ${errorMessage}`,
    };
  }
}


