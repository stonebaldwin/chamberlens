"use client";

import * as React from "react";
import { Bell, FileText, MapPin, Plus, Search } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type Column,
  DataTable,
  Dialog,
  DialogContent,
  EmptyState,
  Input,
  Select,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
  AiSummary,
  AlertBuilder,
  CoverageList,
  FacetGroup,
  Pagination,
  PricingTier,
  ResultCard,
  SearchBar,
  SourceMeta,
  TranscriptViewer,
} from "@repo/ui";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border py-10 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-ink-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-14 rounded-md border border-border ${className}`} />
      <code className="font-mono text-2xs text-ink-muted">{name}</code>
    </div>
  );
}

interface DemoMeeting {
  id: string;
  body: string;
  jurisdiction: string;
  date: string;
  type: string;
}

const demoMeetings: DemoMeeting[] = [
  {
    id: "M-1041",
    body: "City Council",
    jurisdiction: "Raleigh, NC",
    date: "2026-05-28",
    type: "Agenda",
  },
  {
    id: "M-1042",
    body: "Planning Commission",
    jurisdiction: "Charlotte, NC",
    date: "2026-05-27",
    type: "Minutes",
  },
  {
    id: "M-1043",
    body: "Board of Commissioners",
    jurisdiction: "Wake County, NC",
    date: "2026-05-26",
    type: "Packet",
  },
  {
    id: "M-1044",
    body: "School Board",
    jurisdiction: "Durham, NC",
    date: "2026-05-21",
    type: "Minutes",
  },
  {
    id: "M-1045",
    body: "Zoning Board",
    jurisdiction: "Cary, NC",
    date: "2026-05-20",
    type: "Agenda",
  },
  {
    id: "M-1046",
    body: "City Council",
    jurisdiction: "Greensboro, NC",
    date: "2026-05-19",
    type: "Transcript",
  },
];

const columns: Column<DemoMeeting>[] = [
  {
    key: "id",
    header: "Meeting",
    cell: (r) => <span className="font-mono text-2xs text-ink-muted">{r.id}</span>,
    sortAccessor: (r) => r.id,
    width: "120px",
  },
  {
    key: "body",
    header: "Body",
    cell: (r) => <span className="font-medium text-ink">{r.body}</span>,
    sortAccessor: (r) => r.body,
  },
  {
    key: "jurisdiction",
    header: "Jurisdiction",
    cell: (r) => r.jurisdiction,
    sortAccessor: (r) => r.jurisdiction,
  },
  {
    key: "type",
    header: "Doc type",
    cell: (r) => <Badge variant="neutral">{r.type}</Badge>,
  },
  {
    key: "date",
    header: "Date",
    cell: (r) => <span className="font-mono text-2xs">{r.date}</span>,
    sortAccessor: (r) => r.date,
    align: "right",
  },
];

const typeScale: { token: string; cls: string }[] = [
  { token: "text-4xl", cls: "text-4xl" },
  { token: "text-3xl", cls: "text-3xl" },
  { token: "text-2xl", cls: "text-2xl" },
  { token: "text-xl", cls: "text-xl" },
  { token: "text-lg", cls: "text-lg" },
  { token: "text-base", cls: "text-base" },
  { token: "text-sm", cls: "text-sm" },
  { token: "text-xs", cls: "text-xs" },
  { token: "text-2xs", cls: "text-2xs" },
];

export default function StyleguidePage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex flex-col gap-2 pb-4">
        <Badge variant="primary" className="w-fit">
          @repo/ui
        </Badge>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">Design System</h1>
        <p className="max-w-2xl text-ink-muted">
          &ldquo;The Civic Record&rdquo; — an editorial public-records aesthetic: warm parchment,
          deep civic evergreen, and an amber archival highlighter. Every design token and primitive
          used across the platform, plus the ChamberLens-specific civic surfaces.
        </p>
      </header>

      <Section
        title="Color — surfaces & ink"
        description="Warm parchment paper, warm near-black ink, restrained hairline borders."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
          <Swatch name="paper" className="bg-paper" />
          <Swatch name="surface" className="bg-surface" />
          <Swatch name="surface-muted" className="bg-surface-muted" />
          <Swatch name="ink" className="bg-ink" />
          <Swatch name="ink-muted" className="bg-ink-muted" />
          <Swatch name="ink-subtle" className="bg-ink-subtle" />
          <Swatch name="border" className="bg-border" />
          <Swatch name="border-strong" className="bg-border-strong" />
        </div>
      </Section>

      <Section
        title="Color — brand & semantic"
        description="Deep civic evergreen + an amber accent, plus semantic and meeting-recency states."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
          <Swatch name="primary" className="bg-primary" />
          <Swatch name="primary-hover" className="bg-primary-hover" />
          <Swatch name="primary-active" className="bg-primary-active" />
          <Swatch name="primary-tint" className="bg-primary-tint" />
          <Swatch name="accent" className="bg-accent" />
          <Swatch name="accent-tint" className="bg-accent-tint" />
          <Swatch name="success" className="bg-success" />
          <Swatch name="success-tint" className="bg-success-tint" />
          <Swatch name="warning" className="bg-warning" />
          <Swatch name="warning-tint" className="bg-warning-tint" />
          <Swatch name="danger" className="bg-danger" />
          <Swatch name="danger-tint" className="bg-danger-tint" />
          <Swatch name="info" className="bg-info" />
          <Swatch name="info-tint" className="bg-info-tint" />
          <Swatch name="state-upcoming" className="bg-state-upcoming" />
          <Swatch name="state-live" className="bg-state-live" />
          <Swatch name="state-recent" className="bg-state-recent" />
          <Swatch name="state-past" className="bg-state-past" />
        </div>
      </Section>

      <Section
        title="Typography"
        description="Public Sans for UI, Fraunces for editorial display, JetBrains Mono for record metadata."
      >
        <div className="flex flex-col gap-3">
          <div className="mb-2 flex items-baseline gap-4">
            <code className="w-20 shrink-0 font-mono text-2xs text-ink-subtle">font-serif</code>
            <span className="font-serif text-3xl font-semibold tracking-tight text-ink">
              Search the public <span className="italic">record</span>
            </span>
          </div>
          {typeScale.map((t) => (
            <div key={t.token} className="flex items-baseline gap-4">
              <code className="w-20 shrink-0 font-mono text-2xs text-ink-subtle">{t.token}</code>
              <span className={`${t.cls} font-medium tracking-tight text-ink`}>
                Cross-jurisdiction civic search
              </span>
            </div>
          ))}
          <div className="mt-2 flex items-baseline gap-4">
            <code className="w-20 shrink-0 font-mono text-2xs text-ink-subtle">font-mono</code>
            <span className="font-mono text-sm text-ink">M-1042 · 2026-05-27T19:00:00-04:00</span>
          </div>
        </div>
      </Section>

      <Section
        title="Buttons"
        description="Primary / secondary / ghost / danger, three sizes, icons, and states."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Add">
              <Plus />
            </Button>
            <Button variant="primary">
              <Search /> Search
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Badges"
        description="Status and category tags. Default size uses the 2xs metadata scale."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink" htmlFor="sg-q">
              Search query
            </label>
            <Input id="sg-q" placeholder='e.g. rezoning OR "mixed use"' />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink" htmlFor="sg-j">
              Jurisdiction
            </label>
            <Select id="sg-j" defaultValue="">
              <option value="" disabled>
                Select a jurisdiction…
              </option>
              <option value="raleigh">Raleigh, NC</option>
              <option value="charlotte">Charlotte, NC</option>
              <option value="wake">Wake County, NC</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink" htmlFor="sg-d">
              Disabled
            </label>
            <Input id="sg-d" placeholder="Unavailable" disabled />
          </div>
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Raleigh City Council</CardTitle>
              <CardDescription>Regular meeting · agenda + minutes</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-ink-muted">
              23 agenda items · 4 attached documents · video available. Full-text indexed and ready
              for keyword alerts.
            </CardContent>
            <CardFooter>
              <Button size="sm">Open meeting</Button>
              <Button size="sm" variant="secondary">
                <Bell /> Alert me
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Loading state</CardTitle>
              <CardDescription>Skeleton primitives</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section
        title="Data table"
        description="Data-dense, sortable, paginated, virtualization-ready. Click a sortable header."
      >
        <DataTable
          data={demoMeetings}
          columns={columns}
          getRowKey={(r) => r.id}
          pageSize={4}
          initialSort={{ key: "date", dir: "desc" }}
        />
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="agenda" className="max-w-2xl">
          <TabsList>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="minutes">Minutes</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>
          <TabsContent value="agenda" className="text-sm text-ink-muted">
            Ordered agenda items with links to related documents.
          </TabsContent>
          <TabsContent value="minutes" className="text-sm text-ink-muted">
            Adopted minutes — the authoritative record of what happened.
          </TabsContent>
          <TabsContent value="transcript" className="text-sm text-ink-muted">
            Searchable transcript with timestamps that deep-link into the video.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Overlays & feedback" description="Modal dialog and toast notifications.">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                title: "Alert saved",
                description: "We'll email you on new matches.",
                variant: "success",
              })
            }
          >
            Success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                title: "Coverage requested",
                description: "Added to the roadmap queue.",
                variant: "info",
              })
            }
          >
            Info toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                title: "Adapter unhealthy",
                description: "Legistar returned 0 results.",
                variant: "danger",
              })
            }
          >
            Danger toast
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            title="Set a keyword alert"
            description="Email me whenever a covered government mentions this term."
            onClose={() => setDialogOpen(false)}
          >
            <div className="flex flex-col gap-3">
              <Input placeholder="Keyword or phrase" autoFocus />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setDialogOpen(false);
                    toast({ title: "Alert created", variant: "success" });
                  }}
                >
                  Create alert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={<MapPin />}
          title="No coverage here yet"
          description="We don't index this jurisdiction yet. Request it and we'll prioritize it on the roadmap."
          action={
            <Button size="sm" variant="secondary">
              <FileText /> Request this jurisdiction
            </Button>
          }
        />
      </Section>

      <Section
        title="Civic — search & results"
        description="The ChamberLens-specific surfaces, composed on real pages but shown here in isolation."
      >
        <div className="flex flex-col gap-6">
          <SearchBar />
          <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
            <FacetGroup
              title="Document type"
              name="doctype"
              selected={["agenda"]}
              options={[
                { label: "Agendas", value: "agenda", count: 12 },
                { label: "Minutes", value: "minutes", count: 8 },
                { label: "Transcripts", value: "transcript", count: 3 },
              ]}
            />
            <div className="flex flex-col gap-3">
              <ResultCard
                href="#"
                title="Raleigh City Council"
                jurisdiction="Regular Meeting"
                body="agenda item"
                dateLabel="May 12, 2026"
                docType="agenda"
                snippetHtml="Public hearing on a <mark>rezoning</mark> for a mixed-use development with an affordable housing set-aside."
                alertHref="#"
              />
              <Pagination total={42} limit={20} offset={0} hrefFor={() => "#"} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Civic — meeting record & alerts">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SourceMeta sourceUrl="#" retrievedLabel="2 days ago" />
            <AiSummary>
              This meeting covered a Hillsborough Street rezoning, an affordable housing bond
              allocation, and a sidewalk improvement contract.
            </AiSummary>
            <TranscriptViewer
              segments={[
                {
                  startMs: 0,
                  endMs: 8000,
                  speaker: "Mayor",
                  text: "Welcome to the regular meeting.",
                },
                {
                  startMs: 8000,
                  endMs: 22000,
                  speaker: "Staff",
                  text: "The applicant requests a rezoning of 4.2 acres.",
                },
              ]}
              query="rezoning"
            />
          </div>
          <div className="flex flex-col gap-6">
            <AlertBuilder
              query="rezoning"
              scopeSummary="Across all covered jurisdictions"
              onCreate={() => toast({ title: "Alert created (demo)", variant: "success" })}
            />
            <PricingTier
              name="Pro"
              price="$19"
              cadence="/ mo"
              description="For individuals & journalists."
              features={[
                "Unlimited saved searches",
                "Real-time keyword alerts",
                "Monitor specific bodies",
              ]}
              ctaLabel="Start Pro"
              ctaHref="#"
              highlighted
            />
            <CoverageList
              items={[
                { name: "Raleigh", state: "NC", href: "#raleigh", bodyCount: 2, meetingCount: 3 },
                { name: "Charlotte", state: "NC", href: "#charlotte", bodyCount: 2, meetingCount: 3 },
              ]}
            />
          </div>
        </div>
      </Section>
    </main>
  );
}
