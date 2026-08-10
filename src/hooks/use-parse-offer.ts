import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { JobOfferExtractionResult } from "@/lib/job-offer-prefill";

export type ParseOfferInput = {
  offerText: string;
  offerUrl?: string;
  sourceHint?: string;
};

// POST /applications/parse-offer is an extraction, not a write: it persists
// nothing, so there is no query to invalidate here. The provider (and its
// API key) live server-side only — the browser never talks to it directly.
export function useParseOffer() {
  return useMutation({
    mutationFn: (input: ParseOfferInput) =>
      apiClient.post<JobOfferExtractionResult>(
        "/applications/parse-offer",
        input,
      ),
  });
}
