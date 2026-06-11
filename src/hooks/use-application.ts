import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Application } from "@/types";

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["applications", id],
    queryFn: () => apiClient.get<Application>(`/applications/${id}`),
  });
}
