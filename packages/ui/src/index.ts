export { cn } from "./lib/cn";

export { Button, buttonVariants, type ButtonProps } from "./components/button";
export { Input, type InputProps } from "./components/input";
export { Select, type SelectProps } from "./components/select";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/card";
export { Skeleton } from "./components/skeleton";
export { EmptyState, type EmptyStateProps } from "./components/empty-state";
export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsProps } from "./components/tabs";
export {
  Dialog,
  DialogContent,
  type DialogProps,
  type DialogContentProps,
} from "./components/dialog";
export { ToastProvider, useToast } from "./components/toast";
export { Table, Thead, Tbody, Tr, Th, Td } from "./components/table";
export { DataTable, type Column, type DataTableProps } from "./components/data-table";

// ── Civic / ChamberLens-specific presentational components ────────────────────────
export { SearchBar, FacetGroup, Pagination, type FacetOption } from "./components/civic-search";
export {
  ResultCard,
  MeetingRow,
  PageHeader,
  Stat,
  StatRow,
  SourceMeta,
  AiSummary,
  CoverageList,
  PricingTier,
  type CoverageItem,
  type PricingTierProps,
} from "./components/civic-cards";
export { TranscriptViewer, type TranscriptSegmentView } from "./components/transcript-viewer";
export { AlertBuilder, type AlertConfig, type AlertFrequency } from "./components/alert-builder";
