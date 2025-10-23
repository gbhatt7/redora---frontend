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
import { Lightbulb, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOLTIP_CONTENT } from "@/lib/formulas";

interface RecommendationsProps {
  recommendations: Array<{
    overall_insight: string;
    suggested_action: string;
    overall_effort: string;
    impact: string;
  }>;
}

const getEffortColor = (effort: string) => {
  const effortLower = effort.toLowerCase();
  if (effortLower === "high")
    return "bg-destructive text-destructive-foreground";
  if (effortLower === "medium")
    return "bg-medium-neutral text-medium-neutral-foreground";
  if (effortLower === "low") return "bg-success text-success-foreground";
  return "bg-secondary text-secondary-foreground";
};

const getImpactColor = (impact: string) => {
  switch (impact.toLowerCase()) {
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

export const Recommendations = ({ recommendations }: RecommendationsProps) => {
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-7 w-7 text-primary" />
            Strategic Recommendations
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-5 w-5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="text-sm space-y-1">
                {Object.entries(TOOLTIP_CONTENT.recommendations).map(
                  ([key, value]) => (
                    <p key={key}>
                      <span className="font-semibold">{key}:</span> {value}
                    </p>
                  )
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actionable Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      Overall Insight
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      Suggested Action
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      Effort
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      Impact
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((rec, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {rec.overall_insight}
                    </TableCell>
                    <TableCell>{rec.suggested_action}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getEffortColor(rec.overall_effort)}>
                        {rec.overall_effort}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getImpactColor(rec.impact)}>
                        {rec.impact}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
