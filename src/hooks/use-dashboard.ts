import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { DashboardData } from "@/types";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiClient.get<DashboardData>("/dashboard"),
  });
}
