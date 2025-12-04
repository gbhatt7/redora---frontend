import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Speedometer } from "@/components/Speedometer";
import { TrendingUp, Eye, MessageSquare, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOLTIP_CONTENT } from "@/lib/formulas";

interface ExecutiveSummary {
  brand_score_and_tier: string;
  strengths: string[];
  weaknesses: string[];
  competitor_positioning: {
    leaders: { name: string; summary: string }[];
    mid_tier: { name: string; summary: string }[];
    laggards: { name: string; summary: string }[];
  };
  prioritized_actions: string[];
  conclusion: string;
}

interface OverallInsightsProps {
  insights: {
    ai_visibility?: {
      tier: string;
      ai_visibility_score: { Value: number };
      weighted_mentions_total: { Value: number };
      distinct_queries_count?: { Value: number };
      breakdown?: {
        top_two_mentions: number;
        top_five_mentions: number;
        later_mentions: number;
        calculation?: string;
      };
      tier_mapping_method?: string;
      explanation?: string;
    };
    brand_mentions?: {
      total_sources_checked: { Value: number };
    };
    dominant_sentiment?: {
      sentiment: string;
      statement: string;
      summary?: string;
    };
    summary?: string;
  };
  executiveSummary?: ExecutiveSummary;
  yourBrandTotal?: number;
  topBrand?: string;
  topBrandTotal?: number;
}

const getTierColor = (tier: string) => {
  const lowerTier = tier.toLowerCase();
  switch (lowerTier) {
    case "high":
      return "bg-success text-success-foreground";
    case "medium":
      return "bg-medium-neutral text-medium-neutral-foreground";
    case "low":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

const getSentimentColor = (sentiment: string) => {
  const lowerSentiment = sentiment.toLowerCase();
  switch (lowerSentiment) {
    case "positive":
      return "bg-success text-success-foreground";
    case "negative":
      return "bg-destructive text-destructive-foreground";
    case "neutral":
      return "bg-medium-neutral text-medium-neutral-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export const OverallInsights = ({
  insights,
  executiveSummary,
  yourBrandTotal = 0,
  topBrand = "",
  topBrandTotal = 0,
}: OverallInsightsProps) => {
  const visibilityScore =
    insights?.ai_visibility?.ai_visibility_score?.Value || 0;

  // Calculate brand mentions tier based on ratio to top brand
  const mentionRatio =
    topBrandTotal > 0 ? (yourBrandTotal / topBrandTotal) * 100 : 0;

  const brandMentionsLevel =
    mentionRatio >= 70
      ? "High"
      : mentionRatio >= 40
      ? "Medium"
      : "Low";

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-5 md:space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
            Overall Insights
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm">
                {TOOLTIP_CONTENT.overallInsights.description}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* AI Visibility Card */}
          <Card
            className={`w-full max-w-full border-2 ${
              insights?.ai_visibility?.tier?.toLowerCase() === "high"
                ? "border-success"
                : insights?.ai_visibility?.tier?.toLowerCase() === "medium"
                ? "border-medium-neutral"
                : insights?.ai_visibility?.tier?.toLowerCase() === "low"
                ? "border-destructive"
                : "border-border"
            }`}
          >
            <CardHeader className="pb-2 sm:pb-3 p-3 md:p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  AI Visibility
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="text-sm mb-2">
                        {TOOLTIP_CONTENT.aiVisibility.description}
                      </p>
                      <p className="text-xs font-semibold">Formula:</p>
                      <p className="text-xs mb-2">
                        {TOOLTIP_CONTENT.aiVisibility.formula}
                      </p>
                      <p className="text-xs font-semibold">Tiers:</p>
                      <p className="text-xs">
                        • High: {TOOLTIP_CONTENT.aiVisibility.tiers.high}
                      </p>
                      <p className="text-xs">
                        • Medium: {TOOLTIP_CONTENT.aiVisibility.tiers.medium}
                      </p>
                      <p className="text-xs">
                        • Low: {TOOLTIP_CONTENT.aiVisibility.tiers.low}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <Badge
                  className={`${getTierColor(insights?.ai_visibility?.tier || "")} text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}
                  variant="secondary"
                >
                  {insights?.ai_visibility?.tier || "N/A"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 md:p-4">
              <div className="pt-2 sm:pt-4">
                <Speedometer
                  value={visibilityScore}
                  color={
                    insights?.ai_visibility?.tier?.toLowerCase() === "high"
                      ? "hsl(var(--success))"
                      : insights?.ai_visibility?.tier?.toLowerCase() ===
                        "medium"
                      ? "hsl(var(--medium-neutral))"
                      : insights?.ai_visibility?.tier?.toLowerCase() === "low"
                      ? "hsl(var(--destructive))"
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Brand Mentions Card */}
          <Card
            className={`w-full max-w-full border-2 ${
              brandMentionsLevel.toLowerCase() === "high"
                ? "border-success"
                : brandMentionsLevel.toLowerCase() === "medium"
                ? "border-medium-neutral"
                : brandMentionsLevel.toLowerCase() === "low"
                ? "border-destructive"
                : "border-border"
            }`}
          >
            <CardHeader className="pb-2 sm:pb-3 p-3 md:p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Brand Mentions
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="text-sm mb-2">
                        {TOOLTIP_CONTENT.brandMentions.description}
                      </p>
                      <p className="text-xs font-semibold">Calculation:</p>
                      <p className="text-xs mb-2">
                        {TOOLTIP_CONTENT.brandMentions.calculation}
                      </p>
                      <p className="text-xs font-semibold">Formula:</p>
                      <p className="text-xs mb-2">
                        {TOOLTIP_CONTENT.brandMentions.formula}
                      </p>
                      <p className="text-xs font-semibold">Tiers:</p>
                      <p className="text-xs">
                        • High: {TOOLTIP_CONTENT.brandMentions.tiers.high}
                      </p>
                      <p className="text-xs">
                        • Medium: {TOOLTIP_CONTENT.brandMentions.tiers.medium}
                      </p>
                      <p className="text-xs">
                        • Low: {TOOLTIP_CONTENT.brandMentions.tiers.low}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <Badge
                  className={`${getTierColor(brandMentionsLevel)} text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}
                  variant="secondary"
                >
                  {brandMentionsLevel}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 sm:space-y-4 p-3 md:p-4">
              <div className="space-y-2 sm:space-y-3">
                <div className="pt-2 sm:pt-4">
                  <Speedometer
                    value={yourBrandTotal}
                    maxValue={topBrandTotal}
                    color={
                      brandMentionsLevel.toLowerCase() === "high"
                        ? "hsl(var(--success))"
                        : brandMentionsLevel.toLowerCase() === "medium"
                        ? "hsl(var(--medium-neutral))"
                        : brandMentionsLevel.toLowerCase() === "low"
                        ? "hsl(var(--destructive))"
                        : undefined
                    }
                  />
                </div>
                <div className="text-center text-xs sm:text-sm text-muted-foreground">
                  Top Brand Mention -{" "}
                  <span className="font-bold text-primary">{topBrand}</span> -{" "}
                  <span className="font-bold text-primary">
                    {topBrandTotal}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Analysis Card */}
          <Card
            className={`w-full max-w-full border-2 ${
              insights?.dominant_sentiment?.sentiment?.toLowerCase() ===
              "positive"
                ? "border-success"
                : insights?.dominant_sentiment?.sentiment?.toLowerCase() ===
                  "negative"
                ? "border-destructive"
                : insights?.dominant_sentiment?.sentiment?.toLowerCase() ===
                  "neutral"
                ? "border-medium-neutral"
                : "border-border"
            }`}
          >
            <CardHeader className="pb-2 sm:pb-3 p-3 md:p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Sentiment Analysis
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="text-sm">
                        {TOOLTIP_CONTENT.sentimentAnalysis.description}
                      </p>
                      <p className="text-xs mt-2">
                        {TOOLTIP_CONTENT.sentimentAnalysis.explanation}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <Badge
                  className={`${getSentimentColor(
                    insights?.dominant_sentiment?.sentiment || ""
                  )} text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}
                  variant="secondary"
                >
                  {insights?.dominant_sentiment?.sentiment || "N/A"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {insights?.dominant_sentiment?.statement ||
                  "No sentiment analysis available"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Executive Summary Section */}
        {executiveSummary && (
          <Card className="w-full max-w-full border-2 border-primary shadow-excutive-summary/20 p-3 md:p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Executive Summary
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm">
                      {TOOLTIP_CONTENT.executiveSummary.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 text-xs sm:text-sm text-muted-foreground p-0">
              {/* Benchmark */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Brand Visibility Scoring and Tier
                </h3>
                <p>{executiveSummary.brand_score_and_tier}</p>
              </div>

              {/* Strengths */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Strengths</h3>
                <ul className="list-disc pl-4 space-y-1">
                  {executiveSummary.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Weaknesses</h3>
                <ul className="list-disc pl-4 space-y-1">
                  {executiveSummary.weaknesses.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* Competitor Benchmarking */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Competitor Benchmarking
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Leaders</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {executiveSummary.competitor_positioning.leaders.map(
                        (l, idx) => (
                          <li key={idx}>
                            {l.name} : {l.summary}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Mid-Tier</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {executiveSummary.competitor_positioning.mid_tier.map(
                        (m, idx) => (
                          <li key={idx}>
                            {m.name} : {m.summary}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  {executiveSummary.competitor_positioning.laggards.length >
                    0 && (
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Laggards</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {executiveSummary.competitor_positioning.laggards.map(
                          (lag, idx) => (
                            <li key={idx}>
                              {lag.name} : {lag.summary}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Prioritized Actions
                </h3>
                <ul className="list-disc pl-4 space-y-1">
                  {executiveSummary.prioritized_actions.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>

              {/* Conclusion */}
              <div className="border-t border-border pt-3 sm:pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">Conclusion</h3>
                <p>{executiveSummary.conclusion}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};
