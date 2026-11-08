import type { IconName } from "./icons";

// Same width as the CSS that swaps the side panel for the bottom bar.
export const MOBILE_MEDIA_QUERY = "(max-width: 760px)";

export function isMobileLayout(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

// Mobile bottom bar. "Camadas" (always first) opens the layer sheet; these tabs
// choose the one overlay shown over the map.
export type MobileView = "time" | "measure" | "legend";

export const MOBILE_TABS: { id: MobileView; label: string; icon: IconName }[] = [
  { id: "time", label: "Tempo", icon: "history" },
  { id: "measure", label: "Medir", icon: "ruler" },
  { id: "legend", label: "Legenda", icon: "legend" },
];

// Tabs exist only for what the project has: "Tempo" needs campaigns, "Legenda" a legend.
export function shownMobileTabs(hasCampaigns: boolean, legendCount: number) {
  return MOBILE_TABS.filter(tab => (tab.id !== "time" || hasCampaigns) && (tab.id !== "legend" || legendCount > 0));
}

// Start: "Tempo" with campaigns. Without campaigns the map starts clear (sheet
// closed, no overlay) until the user taps "Camadas"; startOpen = true
// (panel.mobileStartOpen) opens the sheet instead. A popup.openOnHome layer
// always keeps the map clear so that popup is visible.
export function initialMobileState(hasCampaigns: boolean, homePopup = false, startOpen = false): { panelOpen: boolean; view: MobileView | null } {
  return hasCampaigns ? { panelOpen: false, view: "time" } : { panelOpen: startOpen && !homePopup, view: null };
}

// A tab that disappears (e.g. the last legend turned off) falls back to the start view.
export function activeMobileView(view: MobileView | null, hasCampaigns: boolean, legendCount: number): MobileView | null {
  return view && shownMobileTabs(hasCampaigns, legendCount).some(tab => tab.id === view) ? view : initialMobileState(hasCampaigns).view;
}
