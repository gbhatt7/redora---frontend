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
import { Search } from "lucide-react";
import { toast } from "sonner";
import { getProductAnalytics } from "@/apiHelpers";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { MessageSquare } from "lucide-react";

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
  const [analyticsResponse, setAnalyticsResponse] = useState<AnalyticsResponse | null>(null);
  const [currentAnalytics, setCurrentAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user, products } = useAuth();
  const { toast } = useToast();
  const accessToken = localStorage.getItem("access_token") || "";
  const navigate = useNavigate();
  const location = useLocation();
  const pollingRef = useRef<{ productTimer?: number; hasShownStartMessage?: boolean }>({});
  const mountedRef = useRef(true);

  const handleNewAnalysis = () => {
    // Get the current product's website from products or analytics
    const currentWebsite = products[0]?.website || currentAnalytics?.analytics?.brand_website || "";
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
          (state.website ||
            state.product.website ||
            state.product.name ||
            "") + "",
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
        const today = new Date().toISOString().split("T")[0];
        const res = await getProductAnalytics(productId, today, accessToken);
        
        if (!mountedRef.current) return;

        if (res && res.analytics && Array.isArray(res.analytics)) {
          setAnalyticsResponse(res);
          
          // Find the most recent completed analysis or the first one
          const completedAnalysis = res.analytics.find(item => 
            item.status?.toLowerCase() === "completed"
          );
          const analysisToUse = completedAnalysis || res.analytics[0];
          
          if (analysisToUse) {
            // Check if this is a new analysis by comparing dates
            const storedDate = localStorage.getItem("last_analysis_date");
            const currentDate = analysisToUse.date || analysisToUse.updated_at || analysisToUse.created_at;
            
            setCurrentAnalytics(analysisToUse);
            
            // Update localStorage with latest analytics data
            if (res.product_id) {
              localStorage.setItem("product_id", res.product_id);
            }
            if (analysisToUse.analytics?.analysis_scope?.search_keywords) {
              const keywords = analysisToUse.analytics.analysis_scope.search_keywords;
              localStorage.setItem("keywords", JSON.stringify(keywords.map(k => ({ keyword: k }))));
              localStorage.setItem("keyword_count", keywords.length.toString());
            }
            
            // Store the full analytics response in localStorage
            localStorage.setItem("last_analysis_data", JSON.stringify(res));
          
            // Check the status to determine if we should stop polling
            const status = analysisToUse.status?.toLowerCase() || "";
          
            if (status === "completed") {
              // Check if this is a new completed analysis
              if (storedDate && currentDate && storedDate !== currentDate) {
                // New analysis completed - show success toast
                toast({
                  title: "Analysis Complete",
                  description: "Your new analysis is ready! Please refresh the page to see the updated insights.",
                  duration: 10000,
                });
                localStorage.setItem("last_analysis_date", currentDate);
              } else if (!storedDate && currentDate) {
                // First time storing the date
                localStorage.setItem("last_analysis_date", currentDate);
              }
              
              // Analysis is complete, stop polling and loading
              setIsLoading(false);
              setError(null);
              
              // Clear any existing timer
              if (pollingRef.current.productTimer) {
                clearTimeout(pollingRef.current.productTimer);
              }
            } else if (status === "failed") {
              // Analysis failed, stop polling but don't show error
              setIsLoading(false);
              setError(null);
              
              // Clear any existing timer
              if (pollingRef.current.productTimer) {
                clearTimeout(pollingRef.current.productTimer);
              }
            } else {
              // Analysis is still in progress, continue polling every 30 seconds
              setError(null);
              
              // Only show the "analysis started" message once
              if (!pollingRef.current.hasShownStartMessage && mountedRef.current) {
                toast({
                  title: "Analysis in Progress",
                  description: "Your analysis is now in progress. This process typically takes around 20 minutes to complete. You'll be notified once it's ready.",
                  duration: 10000, // Keep it visible until dismissed
                });
                pollingRef.current.hasShownStartMessage = true;
              }
              
              if (pollingRef.current.productTimer) {
                clearTimeout(pollingRef.current.productTimer);
              }
              
              pollingRef.current.productTimer = window.setTimeout(() => {
                if (mountedRef.current) {
                  pollProductAnalytics(productId);
                }
              }, 30000); // Poll every 30 seconds
            }
          } else {
            // No analysis data found, continue polling
            if (pollingRef.current.productTimer) {
              clearTimeout(pollingRef.current.productTimer);
            }
            
            pollingRef.current.productTimer = window.setTimeout(() => {
              if (mountedRef.current) {
                pollProductAnalytics(productId);
              }
            }, 30000); // Poll every 30 seconds
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        // Continue polling on error, don't show error messages
        if (pollingRef.current.productTimer) {
          clearTimeout(pollingRef.current.productTimer);
        }
        
        // Retry after 30 seconds on error
        pollingRef.current.productTimer = window.setTimeout(() => {
          if (mountedRef.current) {
            pollProductAnalytics(productId);
          }
        }, 30000);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (resultsData?.product?.id) {
      // Reset the start message flag for new analysis
      pollingRef.current.hasShownStartMessage = false;
      if (pollingRef.current.productTimer) {
        clearTimeout(pollingRef.current.productTimer);
      }
      pollProductAnalytics(resultsData.product.id);
    }
  }, [resultsData, pollProductAnalytics]);

  // Show loading state if still loading or if analysis is not completed
  if (isLoading || !resultsData || !currentAnalytics || currentAnalytics.status?.toLowerCase() !== "completed") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Analysis Started</h2>
              <p className="text-muted-foreground">
                We are preparing your brand's comprehensive analysis. This strategic process ensures precision in every insight.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Extract data from API response
  const data = currentAnalytics.analytics;
  
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
        top_five_mentions: data.ai_visibility?.breakdown?.top_five_mentions || 0,
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
    // Extract brand names from header (every 3rd column starting from index 1)
    const brandNames: string[] = [];
    for (let i = 1; i < contentImpact.header.length - 2; i += 3) {
      brandNames.push(contentImpact.header[i] as string);
    }

    // Calculate totals for each brand (sum of mentions across all rows)
    brandNames.forEach((brand, index) => {
      let total = 0;
      contentImpact.rows.forEach((row) => {
        const mentions = row[1 + index * 3 + 1] as number; // Mentions column for each brand
        total += mentions;
      });
      brandMentionTotals[brand] = total;
    });
  }

  // Find top brand and its total
  let topBrand = "";
  let topBrandTotal = 0;
  Object.entries(brandMentionTotals).forEach(([brand, total]) => {
    if (total > topBrandTotal) {
      topBrandTotal = total;
      topBrand = brand;
    }
  });

  // Get your brand's total (last brand in the list)
  const yourBrandTotal = Object.values(brandMentionTotals)[Object.values(brandMentionTotals).length - 1] || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <BrandHeader
            brandName={data.brand_name || ""}
            brandWebsite={data.brand_website || ""}
            keywordsAnalyzed={data.analysis_scope?.search_keywords || []}
            status={data.status || ""}
            date={currentAnalytics.updated_at || currentAnalytics.created_at || ""}
            modelName={data.model_name || ""}
          />

              <OverallInsights
                insights={insights}
                executiveSummary={data.executive_summary ? {
                  brand_score_and_tier: data.executive_summary.brand_score_and_tier || "",
                  strengths: data.executive_summary.strengths || [],
                  weaknesses: data.executive_summary.weaknesses || [],
                  competitor_positioning: {
                    leaders: data.executive_summary.competitor_positioning?.leaders || [],
                    mid_tier: data.executive_summary.competitor_positioning?.mid_tier || [],
                    laggards: data.executive_summary.competitor_positioning?.laggards || [],
                  },
                  prioritized_actions: data.executive_summary.prioritized_actions || [],
                  conclusion: data.executive_summary.conclusion || "",
                } : undefined}
                yourBrandTotal={yourBrandTotal}
                topBrand={topBrand}
                topBrandTotal={topBrandTotal}
              />

              {data.sources_and_content_impact &&
                data.sources_and_content_impact.header &&
                data.sources_and_content_impact.rows && (
                  <SourceAnalysis
                    contentImpact={{
                      header: data.sources_and_content_impact.header,
                      rows: data.sources_and_content_impact.rows,
                      depth_notes: data.sources_and_content_impact.depth_notes,
                    }}
                    brandName={data.brand_name || ""}
                  />
                )}

              {(data.competitor_visibility_table?.header &&
                data.competitor_visibility_table?.rows) ||
              (data.competitor_sentiment_table?.header &&
                data.competitor_sentiment_table?.rows) ? (
                <CompetitorAnalysis
                  brandName={data.brand_name || ""}
                  analysis={{
                    competitor_visibility_table: data.competitor_visibility_table?.header &&
                      data.competitor_visibility_table?.rows
                      ? {
                          header: data.competitor_visibility_table.header,
                          rows: data.competitor_visibility_table.rows,
                        }
                      : undefined,
                    competitor_sentiment_table: data.competitor_sentiment_table?.header &&
                      data.competitor_sentiment_table?.rows
                      ? {
                          header: data.competitor_sentiment_table.header,
                          rows: data.competitor_sentiment_table.rows,
                        }
                      : undefined,
                  }}
                />
              ) : null}

              {data.sources_and_content_impact &&
                data.sources_and_content_impact.header &&
                data.sources_and_content_impact.rows &&
                data.sources_and_content_impact.rows.length > 0 && (
                  <ContentImpact
                    brandName={data.brand_name || ""}
                    contentImpact={{
                      header: data.sources_and_content_impact.header,
                      rows: data.sources_and_content_impact.rows,
                      depth_notes: data.sources_and_content_impact.depth_notes,
                    }}
                  />
                )}

          {data.recommendations && data.recommendations.length > 0 && (
            <Recommendations
              recommendations={data.recommendations.map(rec => ({
                overall_insight: rec.overall_insight || "",
                suggested_action: rec.suggested_action || "",
                overall_effort: rec.overall_effort || "",
                impact: rec.impact || "",
              }))}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}