import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ProgressionData } from "@/types";

export function useProgression() {
  return useQuery({
    queryKey: ["progression"],
    queryFn: () => apiClient.get<ProgressionData>("/progression"),
  });
}
