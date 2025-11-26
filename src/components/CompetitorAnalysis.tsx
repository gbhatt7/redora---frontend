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
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOLTIP_CONTENT } from "@/lib/formulas";

interface CompetitorAnalysisProps {
  brandName: string;
  analysis: {
    competitor_visibility_table?: {
      header: string[];
      rows: Array<Array<string | number>>;
    };
    competitor_sentiment_table?: {
      header: string[];
      rows: Array<Array<string>>;
    };
  };
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment.toLowerCase()) {
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

export const CompetitorAnalysis = ({
  brandName,
  analysis,
}: CompetitorAnalysisProps) => {
  if (
    !analysis.competitor_visibility_table &&
    !analysis.competitor_sentiment_table
  ) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-foreground">
            Competitor Analysis
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-5 w-5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm">
                {TOOLTIP_CONTENT.competitorAnalysis.description}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Competitor Visibility by Keyword */}
        {analysis.competitor_visibility_table && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Competitor Visibility by Keyword
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm">
                      {TOOLTIP_CONTENT.competitorAnalysis.visibilityTable}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-normal break-words font-semibold">
                        Brand's
                      </TableHead>
                      {analysis.competitor_visibility_table.header
                        .filter((header) => header !== "brand_names")
                        .map((header, index) => (
                          <TableHead
                            key={index}
                            className="whitespace-normal break-words font-semibold text-center"
                          >
                            {header}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.competitor_visibility_table.rows.map(
                      (row, rowIndex) => {
                        const isYourBrand = row[0] === brandName;
                        return (
                          <TableRow
                            key={rowIndex}
                            className={
                              isYourBrand
                                ? "bg-primary/5 border-l-4 border-primary"
                                : ""
                            }
                          >
                            <TableCell
                              className={`whitespace-normal break-words font-medium ${
                                isYourBrand ? "text-primary font-bold" : ""
                              }`}
                            >
                              {row[0]}
                            </TableCell>
                            {row.slice(1).map((cell, cellIndex) => (
                              <TableCell
                                key={cellIndex}
                                className="text-center whitespace-normal break-words"
                              >
                                <span
                                  className={
                                    isYourBrand
                                      ? "font-semibold text-primary"
                                      : ""
                                  }
                                >
                                  {cell}
                                </span>
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitor Sentiment Analysis */}
        {analysis.competitor_sentiment_table && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Competitor Sentiment Analysis
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm">
                      {TOOLTIP_CONTENT.competitorAnalysis.sentimentTable}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[15%] min-w-[120px] font-bold">
                        Brand
                      </TableHead>
                      <TableHead className="w-[65%] min-w-[300px] font-bold">
                        Sentiment Summary
                      </TableHead>
                      <TableHead className="w-[20%] min-w-[150px] text-center font-bold">
                        Overall Outlook
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.competitor_sentiment_table.rows.map(
                      (row, rowIndex) => {
                        const isYourBrand = row[0] === brandName;
                        return (
                          <TableRow
                            key={rowIndex}
                            className={
                              isYourBrand
                                ? "bg-primary/5 border-l-4 border-primary"
                                : ""
                            }
                          >
                            <TableCell
                              className={`font-semibold w-[15%] whitespace-normal break-words ${
                                isYourBrand ? "text-primary font-bold" : ""
                              }`}
                            >
                              {row[0]}
                            </TableCell>
                            <TableCell
                              className={`font-semibold w-[65%] whitespace-normal break-words${
                                isYourBrand ? "text-primary font-bold" : ""
                              }`}
                            >
                              {row[1]}
                            </TableCell>
                            <TableCell className="text-center w-[20%]">
                              <Badge className={getSentimentColor(row[2])}>
                                {row[2]}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};
