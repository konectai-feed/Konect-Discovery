export type Result = {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  reviews: number;

  // UI / optional
  imageUrl?: string;
  website?: string;
  bookingUrl?: string;
  phone?: string;
  status?: "active" | "preview";

  // Konect ranking (from v_business_search)
  konect_rank?: number;
  trust_score?: number;
  reason_codes?: string[];

  // Legacy ranking fields
  finalScore?: number;
  score?: number;
  vertical?: string;
  _rank?: Record<string, unknown>;
  _debug?: Record<string, unknown>;
};
