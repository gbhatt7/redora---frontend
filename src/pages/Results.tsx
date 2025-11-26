import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Layout } from "@/components/Layout";
import { BrandHeader } from "@/components/BrandHeader";
import { OverallInsights } from "@/components/OverallInsights";
import { SourceAnalysis } from "@/components/SourceAnalysis";
import { CompetitorAnalysis } from "@/components/CompetitorAnalysis";
import { ContentImpact } from "@/components/ContentImpact";
import { Recommendations } from "@/components/Recommendations";
import { QueryAnalysis } from "@/components/QueryAnalysis";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Search } from "lucide-react";
import { regenerateAnalysis, getProductAnalytics } from "@/apiHelpers";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Printer, Plus } from "lucide-react";

interface InputStateAny {
  product?: { id: string; name?: string; website?: string };
  id?: string;
  productId?: string;
  website?: string;
  search_keywords?: Array<{ id?: string; keyword: string }>;
  keywords?: string[];
  analytics?: any;
}

// Updated interface for the API response structure
interface AnalyticsResponse {
  analytics: AnalyticsData[];
  count: number;
  limit: number;
  product_id: string;
}

// Updated AnalyticsData interface to match the new API structure
interface AnalyticsData {
  id?: string;
  product_id?: string;
  product_name?: string;
  date?: string;
  status?: string;
  analytics?: {
    brand_name?: string;
    brand_website?: string;
    model_name?: string;
    status?: string;
    analysis_scope?: {
      search_keywords?: string[];
      keywords_or_queries?: string[];
      date_range?: {
        from?: string | null;
        to?: string | null;
      };
    };
    ai_visibility?: {
      weighted_mentions_total?: number;
      breakdown?: {
        top_two_mentions?: number;
        top_five_mentions?: number;
        later_mentions?: number;
        calculation?: string;
      };
      tier_mapping_method?: string;
      brand_tier?: string;
      explanation?: string;
    };
    sentiment?: {
      dominant_sentiment?: string;
      summary?: string;
    };
    competitor_visibility_table?: {
      header?: string[];
      rows?: any[][];
    };
    competitor_sentiment_table?: {
      header?: string[];
      rows?: any[][];
    };
    brand_mentions?: {
      total_mentions?: number;
      queries_with_mentions?: number;
      total_sources_checked?: number;
      alignment_with_visibility?: string;
    };
    sources_and_content_impact?: {
      header?: any[];
      rows?: any[][];
      depth_notes?: any;
    };
    recommendations?: Array<{
      overall_insight?: string;
      suggested_action?: string;
      overall_effort?: string;
      impact?: string;
    }>;
    executive_summary?: {
      brand_score_and_tier?: string;
      strengths?: string[];
      weaknesses?: string[];
      competitor_positioning?: {
        leaders?: Array<{ name: string; summary: string }>;
        mid_tier?: Array<{ name: string; summary: string }>;
        laggards?: Array<{ name: string; summary: string }>;
      };
      prioritized_actions?: string[];
      conclusion?: string;
    };
  };
  created_at?: string;
  updated_at?: string;
}

interface ResultsData {
  website: string;
  product: { id: string; name?: string };
  search_keywords: Array<{ id?: string; keyword: string }>;
}

export default function Results() {
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [analyticsResponse, setAnalyticsResponse] =
    useState<AnalyticsResponse | null>(null);
  const [currentAnalytics, setCurrentAnalytics] =
    useState<AnalyticsData | null>(null);
  const [previousAnalytics, setPreviousAnalytics] =
    useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user, products } = useAuth();
  const { toast } = useToast();
  const accessToken = localStorage.getItem("access_token") || "";
  const navigate = useNavigate();
  const location = useLocation();
  const pollingRef = useRef<{
    productTimer?: number;
    hasShownStartMessage?: boolean;
  }>({});
  const mountedRef = useRef(true);

  const handleNewAnalysis = () => {
    const currentWebsite =
      products[0]?.website || currentAnalytics?.analytics?.brand_website || "";
    const productId = products[0]?.id || resultsData?.product.id || "";

    navigate("/input", {
      state: {
        prefillWebsite: currentWebsite,
        productId: productId,
        isNewAnalysis: true,
        disableWebsiteEdit: true,
      },
    });
  };

  // Parse and normalize location.state
  useEffect(() => {
    mountedRef.current = true;
    const state = (location.state || {}) as InputStateAny;

    if (state && state.product?.id) {
      const normalized: ResultsData = {
        website:
          (state.website || state.product.website || state.product.name || "") +
          "",
        product: {
          id: state.product.id,
          name: state.product.name || state.product.website || state.product.id,
        },
        search_keywords: (state.search_keywords || []).map((k) => ({
          id: k.id,
          keyword: k.keyword,
        })),
      };
      setResultsData(normalized);
    } else if ((state as any).productId || (state as any).id) {
      const pid = (state as any).productId || (state as any).id;
      const normalized: ResultsData = {
        website: state.website || "",
        product: { id: pid.toString(), name: state.website || pid.toString() },
        search_keywords: Array.isArray(state.search_keywords)
          ? state.search_keywords.map((k) => ({ id: k.id, keyword: k.keyword }))
          : (state.keywords || []).map((k: string) => ({ keyword: k })),
      };
      setResultsData(normalized);
    } else {
      navigate("/input");
    }

    return () => {
      mountedRef.current = false;
    };
  }, [location.state, navigate]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollingRef.current.productTimer) {
        clearTimeout(pollingRef.current.productTimer);
      }
    };
  }, []);

  // Poll product analytics function
  const pollProductAnalytics = useCallback(
    async (productId: string) => {
      if (!productId || !accessToken || !mountedRef.current) return;

      try {
        const res = await getProductAnalytics(productId, accessToken);

        if (!mountedRef.current) return;

        if (res && res.analytics && Array.isArray(res.analytics)) {
          setAnalyticsResponse(res);

          const mostRecentAnalysis = res.analytics[0];

          if (mostRecentAnalysis) {
            const currentStatus =
              mostRecentAnalysis.status?.toLowerCase() || "";
            const currentDate =
              mostRecentAnalysis.date ||
              mostRecentAnalysis.updated_at ||
              mostRecentAnalysis.created_at;

            if (res.product_id) {
              localStorage.setItem("product_id", res.product_id);
            }
            if (mostRecentAnalysis.analytics?.analysis_scope?.search_keywords) {
              const keywords =
                mostRecentAnalysis.analytics.analysis_scope.search_keywords;
              localStorage.setItem(
                "keywords",
                JSON.stringify(keywords.map((k) => ({ keyword: k })))
              );
              localStorage.setItem("keyword_count", keywords.length.toString());
            }

            if (currentStatus === "error" || currentStatus === "in_progress") {
              setCurrentAnalytics(mostRecentAnalysis);

              if (
                previousAnalytics &&
                previousAnalytics.status?.toLowerCase() === "completed"
              ) {
                setIsLoading(false);

                if (
                  !pollingRef.current.hasShownStartMessage &&
                  mountedRef.current
                ) {
                  toast({
                    title: "Analysis in Progress",
                    description:
                      "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
                    duration: 10000,
                  });
                  pollingRef.current.hasShownStartMessage = true;
                }
              } else {
                setIsLoading(true);

                if (
                  !pollingRef.current.hasShownStartMessage &&
                  mountedRef.current
                ) {
                  toast({
                    title: "Analysis in Progress",
                    description:
                      "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
                    duration: 10000,
                  });
                  pollingRef.current.hasShownStartMessage = true;
                }
              }

              setError(null);
              if (pollingRef.current.productTimer) {
                clearTimeout(pollingRef.current.productTimer);
              }
              pollingRef.current.productTimer = window.setTimeout(() => {
                if (mountedRef.current) {
                  pollProductAnalytics(productId);
                }
              }, 30000);
            } else if (currentStatus === "completed") {
              setCurrentAnalytics(mostRecentAnalysis);
              setIsLoading(false);
              setError(null);

              const previousDate =
                previousAnalytics?.date ||
                previousAnalytics?.updated_at ||
                previousAnalytics?.created_at;

              if (previousDate && currentDate && currentDate > previousDate) {
                toast({
                  title: "Analysis Updated",
                  description:
                    "Your updated analysis is now available on this page. Refresh if you don't see the latest insights.",
                  duration: 10000,
                });
              }

              setPreviousAnalytics(mostRecentAnalysis);
              localStorage.setItem("last_analysis_data", JSON.stringify(res));

              if (currentDate) {
                localStorage.setItem("last_analysis_date", currentDate);
              }

              if (pollingRef.current.productTimer) {
                clearTimeout(pollingRef.current.productTimer);
              }
            } else {
              setCurrentAnalytics(mostRecentAnalysis);

              if (
                previousAnalytics &&
                previousAnalytics.status?.toLowerCase() === "completed"
              ) {
                setIsLoading(false);
              } else {
                setIsLoading(true);
              }

              if (pollingRef.current.productTimer) {
                clearTimeout(pollingRef.current.productTimer);
              }
              pollingRef.current.productTimer = window.setTimeout(() => {
                if (mountedRef.current) {
                  pollProductAnalytics(productId);
                }
              }, 30000);
            }
          } else {
            setIsLoading(true);
            if (pollingRef.current.productTimer) {
              clearTimeout(pollingRef.current.productTimer);
            }
            pollingRef.current.productTimer = window.setTimeout(() => {
              if (mountedRef.current) {
                pollProductAnalytics(productId);
              }
            }, 30000);
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        if (pollingRef.current.productTimer) {
          clearTimeout(pollingRef.current.productTimer);
        }

        pollingRef.current.productTimer = window.setTimeout(() => {
          if (mountedRef.current) {
            pollProductAnalytics(productId);
          }
        }, 30000);
      }
    },
    [accessToken, previousAnalytics, toast]
  );

  // Load previous completed analysis from localStorage on mount
  useEffect(() => {
    const lastAnalysisData = localStorage.getItem("last_analysis_data");
    if (lastAnalysisData) {
      try {
        const parsed = JSON.parse(lastAnalysisData);
        if (parsed.analytics && parsed.analytics.length > 0) {
          const lastCompleted = parsed.analytics.find(
            (a: AnalyticsData) => a.status?.toLowerCase() === "completed"
          );
          if (lastCompleted) {
            setPreviousAnalytics(lastCompleted);
          }
        }
      } catch (e) {
        console.error("Failed to parse last analysis data:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (resultsData?.product?.id) {
      pollingRef.current.hasShownStartMessage = false;
      if (pollingRef.current.productTimer) {
        clearTimeout(pollingRef.current.productTimer);
      }
      pollProductAnalytics(resultsData.product.id);
    }
  }, [resultsData, pollProductAnalytics]);

  const shouldShowLoader = isLoading || !resultsData || !currentAnalytics;

  // Determine which analytics to display
  const displayAnalytics = (() => {
    if (!currentAnalytics) return null;

    const currentStatus = currentAnalytics.status?.toLowerCase() || "";

    if (
      (currentStatus === "error" || currentStatus === "in_progress") &&
      previousAnalytics &&
      previousAnalytics.status?.toLowerCase() === "completed"
    ) {
      return previousAnalytics;
    }

    return currentAnalytics;
  })();

  if (shouldShowLoader && !displayAnalytics) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Analysis Started</h2>
              <p className="text-muted-foreground">
                We are preparing your brand's comprehensive analysis. This
                strategic process ensures precision in every insight.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const data = displayAnalytics?.analytics;

  if (!data) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Transform data to match component interfaces
  const insights = {
    ai_visibility: {
      tier: data.ai_visibility?.brand_tier || "",
      ai_visibility_score: {
        Value: data.ai_visibility?.weighted_mentions_total || 0,
      },
      weighted_mentions_total: {
        Value: data.ai_visibility?.weighted_mentions_total || 0,
      },
      distinct_queries_count: {
        Value: data.brand_mentions?.queries_with_mentions || 0,
      },
      breakdown: {
        top_two_mentions: data.ai_visibility?.breakdown?.top_two_mentions || 0,
        top_five_mentions:
          data.ai_visibility?.breakdown?.top_five_mentions || 0,
        later_mentions: data.ai_visibility?.breakdown?.later_mentions || 0,
        calculation: data.ai_visibility?.breakdown?.calculation,
      },
      tier_mapping_method: data.ai_visibility?.tier_mapping_method,
      explanation: data.ai_visibility?.explanation,
    },
    brand_mentions: {
      total_sources_checked: {
        Value: data.brand_mentions?.total_sources_checked || 0,
      },
    },
    dominant_sentiment: {
      sentiment: data.sentiment?.dominant_sentiment || "",
      statement: data.sentiment?.summary || "",
    },
  };

  // Calculate total mentions per brand from sources_and_content_impact table
  const brandMentionTotals: { [key: string]: number } = {};
  const contentImpact = data.sources_and_content_impact;

  if (contentImpact?.header && contentImpact?.rows) {
    const brandNames: string[] = [];
    for (let i = 1; i < contentImpact.header.length - 2; i += 3) {
      brandNames.push(contentImpact.header[i] as string);
    }

    brandNames.forEach((brand, index) => {
      let total = 0;
      contentImpact.rows.forEach((row) => {
        const mentions = row[1 + index * 3 + 1] as number;
        total += mentions;
      });
      brandMentionTotals[brand] = total;
    });
  }

  let topBrand = "";
  let topBrandTotal = 0;
  Object.entries(brandMentionTotals).forEach(([brand, total]) => {
    if (total > topBrandTotal) {
      topBrandTotal = total;
      topBrand = brand;
    }
  });

  const yourBrandTotal =
    Object.values(brandMentionTotals)[
      Object.values(brandMentionTotals).length - 1
    ] || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": "28rem",
        } as React.CSSProperties
      }
    >
      <Sidebar side="left" collapsible="offcanvas" className="no-print">
        <SidebarContent>
          <ChatSidebar productId={resultsData.product.id} />
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <Layout
          sidebarTrigger={<SidebarTrigger className="h-8 w-8 no-print" />}
        >
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 space-y-8">
              {/* GeoRankers Print Header - Shows only in print, once at top */}
              <div className="hidden print:block print-only-header">
                <h1 className="text-5xl font-bold font-bold gradient-text">GeoRankers</h1>
                <p className="text-xl text-gray-600 mt-1">
                  AI Visibility Analysis Report
                </p>
              </div>

              {/* Brand Header Section */}
              <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                <BrandHeader
                  brandName={data.brand_name || ""}
                  brandWebsite={data.brand_website || ""}
                  keywordsAnalyzed={data.analysis_scope?.search_keywords || []}
                  status={data.status || ""}
                  date={
                    displayAnalytics?.updated_at ||
                    displayAnalytics?.created_at ||
                    ""
                  }
                  modelName={data.model_name || ""}
                />
              </div>

              {/* New Analysis Button - Hidden in print */}
              <div className="flex justify-center no-print">
                <Button
                  onClick={handleNewAnalysis}
                  variant="default"
                  size="lg"
                  className="gap-2 text-lg px-12 shadow-elevated hover:shadow-glow"
                >
                  <Plus className="h-5 w-5" /> New Analysis{" "}
                </Button>
              </div>

              {/* Overall Insights Section */}
              <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                <OverallInsights
                  insights={insights}
                  executiveSummary={
                    data.executive_summary
                      ? {
                          brand_score_and_tier:
                            data.executive_summary.brand_score_and_tier || "",
                          strengths: data.executive_summary.strengths || [],
                          weaknesses: data.executive_summary.weaknesses || [],
                          competitor_positioning: {
                            leaders:
                              data.executive_summary.competitor_positioning
                                ?.leaders || [],
                            mid_tier:
                              data.executive_summary.competitor_positioning
                                ?.mid_tier || [],
                            laggards:
                              data.executive_summary.competitor_positioning
                                ?.laggards || [],
                          },
                          prioritized_actions:
                            data.executive_summary.prioritized_actions || [],
                          conclusion: data.executive_summary.conclusion || "",
                        }
                      : undefined
                  }
                  yourBrandTotal={yourBrandTotal}
                  topBrand={topBrand}
                  topBrandTotal={topBrandTotal}
                />
              </div>

              {/* Source Analysis Section */}
              {data.sources_and_content_impact &&
                data.sources_and_content_impact.header &&
                data.sources_and_content_impact.rows && (
                  <div
                    style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
                  >
                    <SourceAnalysis
                      contentImpact={{
                        header: data.sources_and_content_impact.header,
                        rows: data.sources_and_content_impact.rows,
                        depth_notes:
                          data.sources_and_content_impact.depth_notes,
                      }}
                      brandName={data.brand_name || ""}
                    />
                  </div>
                )}

              {/* Competitor Analysis Section */}
              {(data.competitor_visibility_table?.header &&
                data.competitor_visibility_table?.rows) ||
              (data.competitor_sentiment_table?.header &&
                data.competitor_sentiment_table?.rows) ? (
                <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                  <CompetitorAnalysis
                    brandName={data.brand_name || ""}
                    analysis={{
                      competitor_visibility_table:
                        data.competitor_visibility_table?.header &&
                        data.competitor_visibility_table?.rows
                          ? {
                              header: data.competitor_visibility_table.header,
                              rows: data.competitor_visibility_table.rows,
                            }
                          : undefined,
                      competitor_sentiment_table:
                        data.competitor_sentiment_table?.header &&
                        data.competitor_sentiment_table?.rows
                          ? {
                              header: data.competitor_sentiment_table.header,
                              rows: data.competitor_sentiment_table.rows,
                            }
                          : undefined,
                    }}
                  />
                </div>
              ) : null}

              {/* Content Impact Section */}
              {data.sources_and_content_impact &&
                data.sources_and_content_impact.header &&
                data.sources_and_content_impact.rows &&
                data.sources_and_content_impact.rows.length > 0 && (
                  <div
                    style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
                  >
                    <ContentImpact
                      brandName={data.brand_name || ""}
                      contentImpact={{
                        header: data.sources_and_content_impact.header,
                        rows: data.sources_and_content_impact.rows,
                        depth_notes:
                          data.sources_and_content_impact.depth_notes,
                      }}
                    />
                  </div>
                )}

              {/* Recommendations Section */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                  <Recommendations
                    recommendations={data.recommendations.map((rec) => ({
                      overall_insight: rec.overall_insight || "",
                      suggested_action: rec.suggested_action || "",
                      overall_effort: rec.overall_effort || "",
                      impact: rec.impact || "",
                    }))}
                  />
                </div>
              )}

              {/* Print button - Hidden in print */}
              <div className="flex justify-center pt-8 no-print">
                <Button onClick={handlePrint} size="lg" className="gap-2">
                  <Printer className="h-5 w-5" /> Download Report
                </Button>
              </div>
            </div>
          </div>
        </Layout>
      </SidebarInset>
    </SidebarProvider>
  );
}
