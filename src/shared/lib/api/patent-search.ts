/**
 * Biznavi 특허 검색 API
 * https://api.biznavi.co.kr/api/v1/common/patent/selectKeyword
 */

const BIZNAVI_API_URL = "https://api.biznavi.co.kr/api/v1/common/patent/selectKeyword";

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

/**
 * Biznavi API를 호출하여 특허를 검색하는 함수
 */
export async function searchPatentsFromAPI(
  params: PatentSearchParams
): Promise<PatentSearchResult[]> {
  // 관리자 토큰 우선 사용, 없으면 일반 토큰 사용
  const xToken = process.env.BIZNAVI_TOKEN || process.env.BIZNAVI_X_TOKEN;
  const gwToken = process.env.BIZNAVI_GW_TOKEN;
  
  if (!xToken || !gwToken) {
    console.error("[patent-search] Biznavi API tokens not found. Please set BIZNAVI_TOKEN (or BIZNAVI_X_TOKEN) and BIZNAVI_GW_TOKEN environment variables.");
    throw new Error("API 토큰이 설정되지 않았습니다. 환경변수 BIZNAVI_TOKEN (또는 BIZNAVI_X_TOKEN)과 BIZNAVI_GW_TOKEN을 설정해주세요.");
  }

  // 키워드를 " and "로 연결
  const keywordText = params.keywords.join(" and ");
  const page = String(params.pageNo || 1);
  const count = String(params.numOfRows || 10);

  // 재시도 로직을 위한 헬퍼 함수
  const fetchWithRetry = async (retries = 3, delay = 1000): Promise<Response> => {
    const requestBody = new URLSearchParams({
      keyword: keywordText,
      page: page,
      count: count,
    });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[patent-search] API call attempt ${attempt}/${retries}:`, {
          keyword: keywordText,
          page,
          count,
        });

        // AbortController를 사용하여 타임아웃 설정 (30초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(BIZNAVI_API_URL, {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "Chrome",
            "x-token": xToken,
            "gwtoken": gwToken,
          },
          body: requestBody.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        const isNetworkError = 
          error.name === "AbortError" ||
          error.code === "UND_ERR_SOCKET" ||
          error.message?.includes("fetch failed") ||
          error.message?.includes("other side closed");

        if (isNetworkError && attempt < retries) {
          const waitTime = delay * attempt; // 지수 백오프
          console.warn(`[patent-search] Network error on attempt ${attempt}, retrying in ${waitTime}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // 마지막 시도이거나 네트워크 오류가 아닌 경우
        throw error;
      }
    }

    throw new Error("모든 재시도가 실패했습니다.");
  };

  try {
    const response = await fetchWithRetry();

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[patent-search] API error: ${response.status} ${response.statusText}`, errorText);
      
      // JSON 형식의 에러 응답 파싱 시도
      let errorMessage = `API 호출 실패: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // JSON 파싱 실패 시 원본 텍스트 사용
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log("[patent-search] API response received:", {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      itemsLength: data?.items?.length,
    });

    // API 응답 형식에 따라 파싱
    // 실제 응답 구조에 맞게 수정 필요
    let items: any[] = [];
    
    if (Array.isArray(data)) {
      items = data;
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data.items && Array.isArray(data.items)) {
      items = data.items;
    } else if (data.result && Array.isArray(data.result)) {
      items = data.result;
    } else if (data.list && Array.isArray(data.list)) {
      items = data.list;
    } else {
      // 응답 구조를 로그로 출력하여 확인
      console.log("[patent-search] Unexpected API response structure:", JSON.stringify(data, null, 2).substring(0, 500));
    }

    console.log("[patent-search] Parsed items array length:", items.length);

    // PatentSearchResult 형식으로 변환
    const patents: PatentSearchResult[] = items.map((item: any) => {
      // 출원일자 포맷팅 함수 (YYYYMMDD -> YYYY-MM-DD)
      const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr || dateStr.trim() === "" || dateStr.trim() === " ") return "";
        const str = dateStr.trim();
        if (str.length === 8) {
          return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
        }
        return str;
      };

      // API 응답 필드명에 맞게 매핑 (Biznavi API 실제 응답 구조 반영)
      // 응답 구조: { apply_number, invention_name, apply_at, register_at, register_number, applicant, sm_grade, now_grade, nation, idx, document_number, tear, ... }
      return {
        // 등록번호가 있으면 우선 사용, 없으면 출원번호 사용
        patentNumber: (item.register_number && item.register_number.trim() !== "" && item.register_number.trim() !== " ") 
          ? item.register_number 
          : (item.apply_number || item.patentNumber || item.applicationNumber || ""),
        title: item.invention_name || item.title || item.inventionTitle || item.발명의명칭 || item.특허명 || item.patent_title || "",
        applicant: item.applicant || item.applicantName || item.출원인 || item.최종권리자 || item.applicant_name || "",
        applicationDate: formatDate(item.apply_at) || item.applicationDate || item.출원일자 || item.출원일 || item.application_date || "",
        summary: item.summary || item.abstract || item.요약 || item.요약문 || item.patent_summary || "",
        abstract: item.abstract || item.상세 || item.상세설명 || item.patent_abstract || "",
        inventor: item.inventor || item.inventorName || item.발명자 || item.발명자명 || item.inventor_name || "",
        // now_grade가 있으면 우선 사용, 없으면 sm_grade 사용
        status: item.now_grade || item.sm_grade || item.status || item.legalStatus || item.상태 || item.법적상태 || item.patent_status || "",
        registrationDate: formatDate(item.register_at) || item.registrationDate || item.등록일자 || item.등록일 || item.registration_date || "",
        publicationNumber: item.document_number || item.publicationNumber || item.공고번호 || item.publication_number || "",
        publicationDate: item.publicationDate || item.공고일자 || item.공고일 || item.publication_date || "",
        englishTitle: item.englishTitle || item.영문발명의명칭 || item.english_title || "",
        classificationCode: item.classificationCode || item.분류코드 || item.classification_code || "",
        claimCount: item.claimCount || item.청구항수 || item.claim_count || "",
        expirationDate: item.expirationDate || item.만료일자 || item.expiration_date || "",
        rawData: item, // 원본 데이터 전체 저장 (nation, idx, tear, document_number 등 모든 필드 포함)
      };
    });

    console.log(`[patent-search] Parsed ${patents.length} patents from API response`);
    
    return patents;
  } catch (error) {
    console.error("[patent-search] Error calling Biznavi API:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("특허 검색 API 호출 중 오류가 발생했습니다.");
  }
}

/**
 * 특허 검색 함수 (기존 함수명 유지)
 * Biznavi API를 사용하여 특허를 검색합니다.
 */
export async function searchPatentsFromJSON(
  params: PatentSearchParams
): Promise<PatentSearchResult[]> {
  return searchPatentsFromAPI(params);
}

/**
 * 특허 상세 정보를 가져오는 함수
 * @param idx 특허 인덱스 (rawData.idx)
 * @param applyNumber 출원번호 (필수)
 */
export async function getPatentDetail(
  idx?: number,
  applyNumber?: string
): Promise<PatentSearchResult | null> {
  const xToken = process.env.BIZNAVI_TOKEN || process.env.BIZNAVI_X_TOKEN;
  const gwToken = process.env.BIZNAVI_GW_TOKEN;
  
  if (!xToken || !gwToken) {
    console.error("[patent-detail] Biznavi API tokens not found.");
    throw new Error("API 토큰이 설정되지 않았습니다.");
  }

  // applyNumber가 없으면 null 반환
  if (!applyNumber) {
    console.warn("[patent-detail] No applyNumber provided");
    return null;
  }

  // 재시도 로직을 위한 헬퍼 함수
  const fetchDetailWithRetry = async (retries = 3, delay = 1000): Promise<Response> => {
    const detailApiUrl = `https://api.biznavi.co.kr/api/v1/common/patent/${applyNumber}/detail?&nation=KR`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[patent-detail] API call attempt ${attempt}/${retries}:`, {
          applyNumber,
          url: detailApiUrl,
        });

        // AbortController를 사용하여 타임아웃 설정 (30초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(detailApiUrl, {
          method: "GET",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json",
            "User-Agent": "Chrome",
            "x-token": xToken,
            "gwtoken": gwToken,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 404는 재시도하지 않음
        if (response.status === 404) {
          return response;
        }

        // 5xx 서버 에러는 재시도 (500, 502, 503, 504 등)
        if (response.status >= 500 && response.status < 600 && attempt < retries) {
          const waitTime = delay * attempt;
          console.warn(`[patent-detail] Server error (${response.status}) on attempt ${attempt}/${retries}, retrying in ${waitTime}ms...`);
          // response body를 소비하지 않고 재시도
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // 성공이거나 재시도 불가능한 에러인 경우 응답 반환
        return response;
      } catch (error: any) {
        const isNetworkError = 
          error.name === "AbortError" ||
          error.code === "UND_ERR_SOCKET" ||
          error.message?.includes("fetch failed") ||
          error.message?.includes("other side closed");

        if (isNetworkError && attempt < retries) {
          const waitTime = delay * attempt;
          console.warn(`[patent-detail] Network error on attempt ${attempt}, retrying in ${waitTime}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // 마지막 시도이거나 네트워크 오류가 아닌 경우
        throw error;
      }
    }

    throw new Error("모든 재시도가 실패했습니다.");
  };

  try {
    const response = await fetchDetailWithRetry();

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[patent-detail] API error: ${response.status} ${response.statusText}`, errorText);
      
      // 404 등은 정상적인 경우일 수 있으므로 null 반환
      if (response.status === 404) {
        console.warn("[patent-detail] Patent detail not found");
        return null;
      }
      
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("[patent-detail] API response received:", {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
    });

    // 응답 데이터 파싱
    const item = data.data || data.item || data.result || data;

    if (!item) {
      console.warn("[patent-detail] No detail data in response");
      return null;
    }

    // 출원일자 포맷팅 함수
    const formatDate = (dateStr: string | undefined): string => {
      if (!dateStr || dateStr.trim() === "" || dateStr.trim() === " ") return "";
      const str = dateStr.trim();
      if (str.length === 8) {
        return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
      }
      return str;
    };

    // HTML 태그 제거 함수
    const stripHtmlTags = (html: any): string => {
      if (!html) return "";
      
      // 객체인 경우 처리
      if (typeof html === "object" && html !== null) {
        // 배열인 경우
        if (Array.isArray(html)) {
          return html.map(item => stripHtmlTags(item)).join(" ");
        }
        // 객체에 text, content, description 등의 필드가 있는 경우
        if (html.text) return stripHtmlTags(html.text);
        if (html.content) return stripHtmlTags(html.content);
        if (html.description) return stripHtmlTags(html.description);
        if (html.value) return stripHtmlTags(html.value);
        // 객체의 모든 문자열 값들을 합치기
        const values = Object.values(html).filter(v => typeof v === "string");
        if (values.length > 0) {
          return values.join(" ");
        }
        // 객체를 JSON 문자열로 변환 (디버깅용)
        return "";
      }
      
      // 문자열인 경우
      const htmlStr = String(html);
      if (!htmlStr || htmlStr.trim() === "" || htmlStr === "[object Object]") return "";
      return htmlStr
        .replace(/<[^>]*>/g, "") // HTML 태그 제거
        .replace(/&nbsp;/g, " ") // &nbsp;를 공백으로
        .replace(/&amp;/g, "&") // &amp;를 &로
        .replace(/&lt;/g, "<") // &lt;를 <로
        .replace(/&gt;/g, ">") // &gt;를 >로
        .replace(/&quot;/g, '"') // &quot;를 "로
        .replace(/&#39;/g, "'") // &#39;를 '로
        .trim();
    };

    // PatentSearchResult 형식으로 변환
    // API 응답 구조에 맞게 다양한 필드명 시도
    const patent: PatentSearchResult = {
      patentNumber: item.apply_number || item.patentNumber || item.applicationNumber || item.register_number || "",
      title: item.invention_name || item.title || item.inventionTitle || "",
      applicant: item.applicant || item.applicantName || item.bibliographyInfo?.applicant || "",
      applicationDate: formatDate(item.apply_at) || formatDate(item.application_date) || item.applicationDate || item.bibliographyInfo?.apply_at || "",
      summary: stripHtmlTags(item.summary || item.abstract || item.요약 || item.요약문 || item.summary_text || ""),
      abstract: stripHtmlTags(item.abstract || item.detail || item.상세 || item.상세설명 || item.description || item.detail_text || item.full_text || ""),
      inventor: item.inventor || item.inventorName || item.발명자 || item.bibliographyInfo?.inventor || "",
      status: item.now_grade || item.sm_grade || item.status || "",
      registrationDate: formatDate(item.register_at) || formatDate(item.registration_date) || item.registrationDate || item.bibliographyInfo?.register_at || "",
      publicationNumber: item.publication_number || item.publicationNumber || item.document_number || item.공고번호 || item.open_number || item.bibliographyInfo?.publication_number || "",
      publicationDate: formatDate(item.publication_at) || formatDate(item.publication_date) || item.publicationDate || item.공고일자 || item.bibliographyInfo?.publication_at || "",
      englishTitle: item.englishTitle || item.english_title || item.영문발명의명칭 || item.english_name || "",
      classificationCode: item.classification_code || item.classificationCode || item.분류코드 || item.ipc_code || item.ipc || "",
      claimCount: item.claim_count || item.claimCount || item.청구항수 || item.claims_count || (item.claimList?.length ? String(item.claimList.length) : "") || "",
      expirationDate: formatDate(item.expiration_at) || formatDate(item.expiration_date) || item.expirationDate || item.만료일자 || "",
      // 상세 정보 필드
      claimList: item.claimList || [],
      bibliographyInfo: item.bibliographyInfo || {},
      ipcInfoList: item.ipcInfoList || [],
      cpcInfoList: item.cpcInfoList || [],
      technialField: stripHtmlTags(item.technialField || item.technicalField || item.기술분야 || ""),
      backgroundArt: stripHtmlTags(item.backgroundArt || item.배경기술 || ""),
      techProblem: stripHtmlTags(item.techProblem || item.기술적과제 || item.해결하려는과제 || ""),
      techSolution: stripHtmlTags(item.techSolution || item.기술적해결수단 || item.해결수단 || ""),
      advantageousEffects: stripHtmlTags(item.advantageousEffects || item.유리한효과 || item.발명의효과 || ""),
      descriptionOfDrawings: stripHtmlTags(item.descriptionOfDrawings || item.도면의간단한설명 || ""),
      descriptionOfEmbodiments: stripHtmlTags(item.descriptionOfEmbodiments || item.실시예 || item.실시예에대한상세한설명 || ""),
      familyList: item.familyList || [],
      rawData: item,
    };

    console.log("[patent-detail] Parsed patent detail:", {
      patentNumber: patent.patentNumber,
      title: patent.title?.substring(0, 50),
      hasSummary: !!patent.summary,
      hasAbstract: !!patent.abstract,
    });

    return patent;
  } catch (error) {
    console.error("[patent-detail] Error calling Biznavi detail API:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("특허 상세 정보 조회 중 오류가 발생했습니다.");
  }
}

/**
 * 캐시를 강제로 새로고침하고 특허 데이터를 다시 로드하는 API 엔드포인트용 함수
 * (API 기반 검색에서는 더 이상 사용되지 않지만, 호환성을 위해 유지)
 */
export async function reloadPatents(): Promise<{ success: boolean; count: number; message: string }> {
  return {
    success: true,
    count: 0,
    message: "API 기반 검색에서는 캐시가 필요하지 않습니다.",
  };
}
