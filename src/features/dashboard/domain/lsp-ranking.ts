import type { CompanyRating } from "@/src/features/assessments/data/assessment.repository";

export interface LspScore {
  companyId: string;
  companyName: string;
  /** Mean of every rating given across the company's completed assessments, 1 to 10. */
  averageRating: number;
  assessmentCount: number;
}

export interface LspRanking {
  top: LspScore[];
  bottom: LspScore[];
}

const MAX_LISTED = 5;

const roundToOneDecimal = (value: number): number => Math.round(value * 10) / 10;

/**
 * Scores each assessed company by the average rating on its completed
 * assessments. Companies with no ratings are skipped. The top and bottom lists
 * never overlap: each holds at most half of the ranked companies.
 */
export const rankLsps = (entries: readonly CompanyRating[]): LspRanking => {
  const byCompany = new Map<string, { name: string; sum: number; count: number; assessments: number }>();
  for (const entry of entries) {
    const current = byCompany.get(entry.companyId) ?? { name: entry.companyName, sum: 0, count: 0, assessments: 0 };
    current.sum += entry.ratings.reduce((total, rating) => total + rating, 0);
    current.count += entry.ratings.length;
    current.assessments += 1;
    byCompany.set(entry.companyId, current);
  }

  const scores: LspScore[] = Array.from(byCompany, ([companyId, value]) => ({
    companyId,
    companyName: value.name || "Unnamed company",
    averageRating: value.count > 0 ? roundToOneDecimal(value.sum / value.count) : 0,
    assessmentCount: value.assessments,
    ratedCount: value.count,
  })).filter((score) => score.ratedCount > 0).map(({ ratedCount: _ratedCount, ...score }) => score);

  scores.sort((first, second) => second.averageRating - first.averageRating || first.companyName.localeCompare(second.companyName));
  const listed = Math.min(MAX_LISTED, Math.floor(scores.length / 2));
  const topCount = scores.length === 1 ? 1 : listed;
  return {
    top: scores.slice(0, topCount),
    bottom: listed > 0 ? scores.slice(scores.length - listed).reverse() : [],
  };
};
