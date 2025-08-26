export interface AnalysisResult {
  id: string;
  adArchiveId: string;
  pageName?: string;
  summary?: string;
  contentType: "image" | "video" | "text";
  analysisStatus: "pending" | "completed" | "error";
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  images: number;
  videos: number;
  text: number;
  errors: number;
} 