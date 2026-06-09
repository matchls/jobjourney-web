import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Application } from "@/types";

export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: () => apiClient.get<Application[]>("/applications"),
  });
}
