import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOLTIP_CONTENT } from "@/lib/formulas";

interface SourceAnalysisProps {
  contentImpact: {
    header: string[];
    rows: (string | number | string[])[][];
    depth_notes?: {
      [brand: string]: {
        [source: string]: {
          insight: string;
          pages_used: string[];
        };
      };
    };
  };
  brandName: string;
}

const getVisibilityColor = (visibility: string) => {
  switch (visibility.toLowerCase()) {
    case "high":
      return "bg-success text-success-foreground";
    case "medium":
      return "bg-medium-neutral text-medium-neutral-foreground";
    case "low":
    case "absent":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

const getMentionTier = (ratio: number) => {
  if (ratio >= 70) return "High";
  if (ratio >= 40) return "Medium";
  if (ratio >= 0) return "Low";
  return "N/A";
};

export const SourceAnalysis = ({
  contentImpact,
  brandName,
}: SourceAnalysisProps) => {
  const brandColumnIndex = contentImpact.header.findIndex(
    (h) => h === brandName
  );

  const sources = contentImpact.rows.map((row) => {
    const sourceName = row[0] as string;
    const mentions = Number(row[brandColumnIndex + 1] || 0);

    // Find max mentions in this row across all brands
    const brandNames: string[] = [];
    for (let i = 1; i < contentImpact.header.length - 2; i += 3) {
      brandNames.push(contentImpact.header[i] as string);
    }

    const mentionCounts: number[] = brandNames.map((_, i) =>
      Number(row[1 + i * 3 + 1] || 0)
    );
    const maxMentions = Math.max(...mentionCounts);

    const mentionRatio = maxMentions > 0 ? (mentions / maxMentions) * 100 : 0;
    const tier = getMentionTier(mentionRatio);
    const depthNote = contentImpact.depth_notes?.[brandName]?.[sourceName];

    // Split names by space, slash, or backslash
    const shortCategory = sourceName.split(/[\s\\/]+/).join("\n");

    return {
      category: sourceName,
      shortCategory,
      mentions,
      mentionRatio,
      score: tier,
      insight: depthNote?.insight || "",
      pages_used: depthNote?.pages_used || [],
    };
  });

  const chartData = sources.map((source) => ({
    category: source.shortCategory,
    citations: source.mentions,
    visibility: source.score,
  }));

  const getBarColor = (visibility: string) => {
    switch (visibility.toLowerCase()) {
      case "high":
        return "hsl(var(--success))";
      case "medium":
        return "hsl(var(--medium-neutral))";
      case "low":
        return "hsl(var(--destructive))";
      case "absent":
        return "hsl(var(--destructive))";
      default:
        return "hsl(var(--primary))";
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-foreground">
            Source Analysis
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-5 w-5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm mb-2">
                {TOOLTIP_CONTENT.sourceAnalysis.description}
              </p>
              <p className="text-xs">
                {TOOLTIP_CONTENT.sourceAnalysis.calculation}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Citation Distribution by Source Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ bottom: 60, top: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  interval={0}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y + 5})`}>
                      {payload.value.split("\n").map((line, index) => (
                        <text
                          key={index}
                          x={0}
                          y={index * 11}
                          textAnchor="middle"
                          fontSize={10}
                          fill="hsl(var(--foreground))"
                          fontWeight="500"
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  )}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="citations" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.visibility)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Source Details for{" "}
              <span className="font-bold text-primary">{brandName}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Source</TableHead>
                    <TableHead className="text-center font-semibold">Mentions</TableHead>
                    <TableHead className="text-center font-semibold">Tier</TableHead>
                    <TableHead className="font-semibold">Insights</TableHead>
                    <TableHead className="font-semibold">Pages Used</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {sources.map((source, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium break-words whitespace-pre-line">
                      {source.shortCategory}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {source.mentions}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={getVisibilityColor(source.score)}
                        variant="secondary"
                      >
                        {source.score}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {source.insight || "No insights available"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {Array.isArray(source.pages_used) && source.pages_used.length > 0 &&
                      !source.pages_used.includes("Absent") ? (
                        <ul className="space-y-1 pl-0">
                          {source.pages_used.map((page, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="flex-1">{page}</span>
                            </li>
                          ))}
                        </ul>
                      ) : Array.isArray(source.pages_used) && source.pages_used.includes("Absent") ? (
                        "No pages found"
                      ) : (
                        "No pages found"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
