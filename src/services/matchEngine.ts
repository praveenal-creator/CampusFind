import { MatchFactor, MatchResult, ReportItem } from '../types.ts';

// Common English stopwords to exclude from keyword similarity
const STOP_WORDS = new Set([
  'the', 'and', 'with', 'for', 'this', 'that', 'from', 'have', 'were',
  'left', 'lost', 'found', 'near', 'some', 'about', 'desk', 'room',
  'floor', 'area', 'please', 'help', 'onto', 'into', 'when', 'while'
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  );
}

export function computeReportMatch(
  target: ReportItem,
  candidate: ReportItem
): MatchResult {
  // Can only match opposite types: lost to found or found to lost
  if (target.type === candidate.type) {
    return {
      target_report: target,
      candidate_report: candidate,
      total_score: 0,
      factors: []
    };
  }

  const factors: MatchFactor[] = [];

  // 1. Category Factor (Weight: 30)
  const categoryWeight = 30;
  let categoryScore = 0;
  let categoryExpl = 'Different categories';
  if (target.category === candidate.category) {
    categoryScore = 1.0;
    categoryExpl = `Exact category match: ${target.category}`;
  } else {
    categoryScore = 0;
    categoryExpl = `Categories differ (${target.category} vs ${candidate.category})`;
  }
  factors.push({
    factor: 'Category',
    weight: categoryWeight,
    score: categoryScore,
    contribution: Math.round(categoryWeight * categoryScore),
    explanation: categoryExpl
  });

  // 2. Brand Factor (Weight: 20)
  const brandWeight = 20;
  let brandScore = 0;
  let brandExpl = 'No brand provided';
  const targetBrand = target.brand?.trim().toLowerCase();
  const candidateBrand = candidate.brand?.trim().toLowerCase();

  if (targetBrand && candidateBrand) {
    if (targetBrand === candidateBrand) {
      brandScore = 1.0;
      brandExpl = `Exact brand match: ${target.brand}`;
    } else if (targetBrand.includes(candidateBrand) || candidateBrand.includes(targetBrand)) {
      brandScore = 0.8;
      brandExpl = `Partial brand match: ${target.brand} / ${candidate.brand}`;
    } else {
      brandScore = 0;
      brandExpl = `Different brands specified (${target.brand} vs ${candidate.brand})`;
    }
  } else if (!targetBrand && !candidateBrand) {
    brandScore = 0.3;
    brandExpl = 'Neither report specified a brand';
  } else {
    // One has brand, check if candidate description contains it
    const knownBrand = targetBrand || candidateBrand;
    const otherText = (targetBrand ? `${candidate.title} ${candidate.description}` : `${target.title} ${target.description}`).toLowerCase();
    if (knownBrand && otherText.includes(knownBrand)) {
      brandScore = 0.75;
      brandExpl = `Brand mentioned in text description: ${targetBrand || candidateBrand}`;
    } else {
      brandScore = 0.2;
      brandExpl = 'One report omitted brand information';
    }
  }
  factors.push({
    factor: 'Brand',
    weight: brandWeight,
    score: brandScore,
    contribution: Math.round(brandWeight * brandScore),
    explanation: brandExpl
  });

  // 3. Color Factor (Weight: 15)
  const colorWeight = 15;
  let colorScore = 0;
  let colorExpl = 'Colors differ';
  const targetColor = target.primary_color.toLowerCase();
  const candidateColor = candidate.primary_color.toLowerCase();

  if (targetColor === candidateColor) {
    colorScore = 1.0;
    colorExpl = `Identical primary color: ${target.primary_color}`;
  } else if (
    (target.secondary_color && target.secondary_color.toLowerCase().includes(candidateColor)) ||
    (candidate.secondary_color && candidate.secondary_color.toLowerCase().includes(targetColor))
  ) {
    colorScore = 0.7;
    colorExpl = `Secondary color overlap: ${target.primary_color}/${target.secondary_color || 'none'}`;
  } else {
    // Check if color appears in the description
    const candidateText = `${candidate.title} ${candidate.description}`.toLowerCase();
    if (candidateText.includes(targetColor)) {
      colorScore = 0.5;
      colorExpl = `Color (${target.primary_color}) mentioned in report details`;
    } else {
      colorScore = 0;
      colorExpl = `Color mismatch (${target.primary_color} vs ${candidate.primary_color})`;
    }
  }
  factors.push({
    factor: 'Color',
    weight: colorWeight,
    score: colorScore,
    contribution: Math.round(colorWeight * colorScore),
    explanation: colorExpl
  });

  // 4. Campus Location Factor (Weight: 15)
  const locationWeight = 15;
  let locationScore = 0;
  let locationExpl = 'Different campus zones';

  if (target.location_zone === candidate.location_zone) {
    locationScore = 1.0;
    locationExpl = `Same campus building/zone: ${target.location_zone}`;
  } else {
    // Check text overlap in detailed location
    const targetLocTokens = tokenize(target.location_detail);
    const candidateLocTokens = tokenize(candidate.location_detail);
    let commonLocTokens = 0;
    targetLocTokens.forEach((t) => {
      if (candidateLocTokens.has(t)) commonLocTokens++;
    });

    if (commonLocTokens > 0) {
      locationScore = 0.5;
      locationExpl = `Shared location detail references (${commonLocTokens} matching terms)`;
    } else {
      locationScore = 0.1;
      locationExpl = `Different zones (${target.location_zone} vs ${candidate.location_zone})`;
    }
  }
  factors.push({
    factor: 'Location',
    weight: locationWeight,
    score: locationScore,
    contribution: Math.round(locationWeight * locationScore),
    explanation: locationExpl
  });

  // 5. Date Proximity Factor (Weight: 10)
  const dateWeight = 10;
  let dateScore = 0;
  let dateExpl = '';
  const date1 = new Date(target.date_occurred).getTime();
  const date2 = new Date(candidate.date_occurred).getTime();
  const dayDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);

  if (dayDiff < 1) {
    dateScore = 1.0;
    dateExpl = 'Identical calendar day recorded';
  } else if (dayDiff <= 3) {
    dateScore = 0.8;
    dateExpl = `Within 3 days (${Math.round(dayDiff)} days apart)`;
  } else if (dayDiff <= 7) {
    dateScore = 0.5;
    dateExpl = `Within 1 week (${Math.round(dayDiff)} days apart)`;
  } else if (dayDiff <= 14) {
    dateScore = 0.25;
    dateExpl = `Within 2 weeks (${Math.round(dayDiff)} days apart)`;
  } else {
    dateScore = 0.05;
    dateExpl = `Over 2 weeks apart (${Math.round(dayDiff)} days difference)`;
  }
  factors.push({
    factor: 'Date Proximity',
    weight: dateWeight,
    score: dateScore,
    contribution: Math.round(dateWeight * dateScore),
    explanation: dateExpl
  });

  // 6. Keywords & Description Similarity (Weight: 10)
  const keywordWeight = 10;
  const targetTokens = tokenize(`${target.title} ${target.description}`);
  const candidateTokens = tokenize(`${candidate.title} ${candidate.description}`);

  let intersectionCount = 0;
  targetTokens.forEach((token) => {
    if (candidateTokens.has(token)) {
      intersectionCount++;
    }
  });

  const unionSize = new Set([...targetTokens, ...candidateTokens]).size;
  const jaccard = unionSize > 0 ? intersectionCount / unionSize : 0;
  // Scale jaccard so 0.25+ gets full marks for short reports
  const keywordScore = Math.min(1.0, jaccard * 3.5);
  const keywordExpl =
    intersectionCount > 0
      ? `${intersectionCount} shared keywords in title/description`
      : 'No distinctive keywords shared';

  factors.push({
    factor: 'Keywords',
    weight: keywordWeight,
    score: keywordScore,
    contribution: Math.round(keywordWeight * keywordScore),
    explanation: keywordExpl
  });

  const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);

  return {
    target_report: target,
    candidate_report: candidate,
    total_score: totalScore,
    factors
  };
}

export function findTopMatches(
  target: ReportItem,
  allReports: ReportItem[],
  minScore = 35
): MatchResult[] {
  return allReports
    .filter((r) => r.id !== target.id && r.type !== target.type && r.status === 'open')
    .map((candidate) => computeReportMatch(target, candidate))
    .filter((res) => res.total_score >= minScore)
    .sort((a, b) => b.total_score - a.total_score);
}
