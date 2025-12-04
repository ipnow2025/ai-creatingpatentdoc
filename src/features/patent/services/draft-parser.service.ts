export function cleanContent(content: string): string {
  if (!content) return content;
  return content.replace(/\*\*/g, "").replace(/\*/g, "");
}

export interface DraftSection {
  title: string;
  content: string;
  color: string;
}

export function parseDraftSections(content: string): DraftSection[] {
  const cleanedContent = cleanContent(content);
  const lines = cleanedContent.split("\n");
  const sectionsInOrder: DraftSection[] = [];
  let currentSection: DraftSection | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.includes("기술분야") || trimmedLine.includes("기술 분야")) {
      if (currentSection) sectionsInOrder.push(currentSection);
      currentSection = { title: "기술분야", content: "", color: "blue" };
    } else if (trimmedLine.includes("배경기술") || trimmedLine.includes("발명의 배경")) {
      if (currentSection) sectionsInOrder.push(currentSection);
      currentSection = { title: "발명배경", content: "", color: "green" };
    } else if (
      trimmedLine.includes("구성요소") ||
      trimmedLine.includes("주요 구성") ||
      trimmedLine.includes("시스템 구성") ||
      trimmedLine.includes("장치 구성")
    ) {
      if (currentSection) sectionsInOrder.push(currentSection);
      currentSection = { title: "구성요소", content: "", color: "cyan" };
    } else if (
      trimmedLine.includes("발명의 내용") ||
      trimmedLine.includes("발명 내용") ||
      trimmedLine.includes("구체적인 내용") ||
      trimmedLine.includes("실시예")
    ) {
      if (currentSection) sectionsInOrder.push(currentSection);
      currentSection = { title: "발명내용", content: "", color: "teal" };
    } else if (trimmedLine.includes("해결하고자 하는 과제") || trimmedLine.includes("해결과제")) {
      if (currentSection) sectionsInOrder.push(currentSection);
      currentSection = { title: "해결과제", content: "", color: "orange" };
    } else if (
      trimmedLine.includes("과제의 해결 수단") ||
      trimmedLine.includes("해결 수단") ||
      trimmedLine.includes("발명의 구성")
    ) {
      if (currentSection) sectionsInOrder.push(currentSection);
      currentSection = { title: "해결수단", content: "", color: "purple" };
    } else if (trimmedLine.includes("발명의 효과") || trimmedLine.includes("효과")) {
      if (currentSection) sectionsInOrder.push(currentSection);
      currentSection = { title: "발명효과", content: "", color: "red" };
    } else if (trimmedLine.includes("청구항") || trimmedLine.includes("특허청구범위")) {
      if (currentSection) sectionsInOrder.push(currentSection);
      currentSection = { title: "청구항", content: "", color: "indigo" };
    } else if (trimmedLine.includes("요약")) {
      if (currentSection) sectionsInOrder.push(currentSection);
      currentSection = { title: "요약", content: "", color: "gray" };
    } else {
      if (currentSection) {
        currentSection.content += line + "\n";
      }
    }
  }

  if (currentSection) sectionsInOrder.push(currentSection);

  const createSummary = (text: string, sectionTitle: string) => {
    if (!text) return "";
    const cleaned = text.trim();

    // Special handling for claims section - extract first 3-5 claims
    if (sectionTitle === "청구항") {
      const claimMatches = cleaned.match(/【청구항\s*\d+】[^【]*/g);
      if (claimMatches && claimMatches.length > 0) {
        const claimsToShow = claimMatches.slice(0, 5);
        return claimsToShow
          .map((claim) => {
            const claimText = claim.replace(/【청구항\s*\d+】/, "").trim();
            const firstSentence = claimText.split(/[.。]/)[0];
            return `• ${firstSentence}...`;
          })
          .join("\n");
      }
    }

    // For other sections, create a more readable summary
    const sentences = cleaned.split(/[.。]/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) return cleaned.substring(0, 200) + "...";

    const summaryText = sentences.slice(0, 3).join(". ") + ".";
    return summaryText.length > 300 ? summaryText.substring(0, 300) + "..." : summaryText;
  };

  return sectionsInOrder
    .filter((section) => section.content.trim().length > 0)
    .map((section) => ({
      ...section,
      content: createSummary(section.content, section.title),
    }));
}

export interface StructuredSummary {
  title: string;
  abstract: string;
  claims: string[];
  technicalField: string;
  problems: string[];
  effects: string[];
}

export function parseStructuredSummary(content: string, inventionTitle: string): StructuredSummary {
  const cleanedContent = cleanContent(content);
  const lines = cleanedContent.split("\n");

  // Extract invention title
  const titleMatch = cleanedContent.match(/발명의\s*명칭[:\s]*(.+?)(?:\n|$)/i);
  const title = titleMatch ? titleMatch[1].trim() : inventionTitle || "제목 없음";

  // Extract abstract section
  const abstractMatch = cleanedContent.match(/요약[:\s]*\n([\s\S]*?)(?=\n\n|청구|기술분야|$)/i);
  const abstract = abstractMatch ? abstractMatch[1].trim() : "";

  // Extract claims - find first 3 claims
  const claimsSection = cleanedContent.match(/청구항[\s\S]*?(?=\n\n|발명의\s*효과|$)/i);
  const claims: string[] = [];
  if (claimsSection) {
    const claimMatches = claimsSection[0].match(/【청구항\s*\d+】[^【]*/g);
    if (claimMatches) {
      claims.push(
        ...claimMatches.slice(0, 3).map((claim) => {
          const text = claim.replace(/【청구항\s*\d+】/, "").trim();
          const firstSentence = text.split(/[.。]/)[0];
          return firstSentence.length > 150 ? firstSentence.substring(0, 150) + "..." : firstSentence;
        }),
      );
    }
  }

  // Extract technical field
  const techFieldMatch = cleanedContent.match(/기술\s*분야[:\s]*\n([\s\S]*?)(?=\n\n|배경|$)/i);
  let technicalField = "";
  if (techFieldMatch) {
    const sentences = techFieldMatch[1].trim().split(/[.。]/);
    technicalField = sentences.slice(0, 2).join(". ") + ".";
  }

  // Extract problems
  const problemsMatch = cleanedContent.match(
    /해결하[고자]*\s*하는\s*과제[:\s]*\n([\s\S]*?)(?=\n\n과제의\s*해결|발명의\s*효과|$)/i,
  );
  const problems: string[] = [];
  if (problemsMatch) {
    const problemText = problemsMatch[1];
    const problemLines = problemText.split("\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed.match(/^[\d\-•]/) || trimmed.length > 20;
    });
    problems.push(...problemLines.slice(0, 3).map((p) => p.replace(/^[\d\-•.\s]+/, "").trim()));
  }

  // Extract effects
  const effectsMatch = cleanedContent.match(/발명의\s*효과[:\s]*\n([\s\S]*?)(?=\n\n|청구|$)/i);
  const effects: string[] = [];
  if (effectsMatch) {
    const effectText = effectsMatch[1];
    const effectLines = effectText.split("\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed.match(/^[\d\-•]/) || trimmed.length > 20;
    });
    effects.push(...effectLines.slice(0, 3).map((e) => e.replace(/^[\d\-•.\s]+/, "").trim()));
  }

  return {
    title,
    abstract,
    claims,
    technicalField,
    problems,
    effects,
  };
}

