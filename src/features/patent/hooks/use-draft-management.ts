import { useState } from "react";
import type { DraftVersion } from "@/features/patent/types/draft.types";

export function useDraftManagement() {
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([]);
  const [currentDraftIndex, setCurrentDraftIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("draft-1");

  const addDraft = (content: string, feedbackUsed?: string) => {
    const newVersion = draftVersions.length + 1;
    const newDraft: DraftVersion = {
      version: newVersion,
      content,
      timestamp: new Date(),
      feedbackUsed,
    };
    setDraftVersions((prev) => [...prev, newDraft]);
    setCurrentDraftIndex(draftVersions.length);
    setActiveTab(`draft-${newVersion}`);
    return newDraft;
  };

  const getCurrentDraft = () => draftVersions[currentDraftIndex];
  const getCurrentContent = () => getCurrentDraft()?.content || "";

  const resetDrafts = () => {
    setDraftVersions([]);
    setCurrentDraftIndex(0);
    setActiveTab("draft-1");
  };

  return {
    draftVersions,
    currentDraftIndex,
    activeTab,
    setCurrentDraftIndex,
    setActiveTab,
    addDraft,
    getCurrentDraft,
    getCurrentContent,
    resetDrafts,
  };
}

