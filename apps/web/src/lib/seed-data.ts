import type { DocType, GovBodyType, MeetingStatus } from "./data/types";

export interface SeedJurisdiction {
  id: string;
  slug: string;
  name: string;
  state: string;
  type: string;
  lat: number;
  lng: number;
  population?: number;
}

export interface SeedBody {
  id: string;
  slug: string;
  jurisdictionId: string;
  name: string;
  type: GovBodyType;
}

export interface SeedAgendaItem {
  itemNumber?: string;
  title: string;
  description?: string;
}

export interface SeedDocument {
  docType: DocType;
  title: string;
  originalUrl: string;
  textContent?: string;
}

export interface SeedSegment {
  startMs: number;
  endMs: number;
  speaker?: string;
  text: string;
}

export interface SeedMeeting {
  id: string;
  bodyId: string;
  title: string;
  meetingType?: string;
  scheduledAt: string;
  status: MeetingStatus;
  location?: string;
  videoUrl?: string;
  sourceUrl: string;
  agendaItems: SeedAgendaItem[];
  documents: SeedDocument[];
  transcript?: { provider: string; segments: SeedSegment[] };
}

export const SEED_JURISDICTIONS: SeedJurisdiction[] = [
  {
    id: "jur_raleigh",
    slug: "raleigh-nc",
    name: "Raleigh",
    state: "NC",
    type: "city",
    lat: 35.7796,
    lng: -78.6382,
    population: 482295,
  },
  {
    id: "jur_charlotte",
    slug: "charlotte-nc",
    name: "Charlotte",
    state: "NC",
    type: "city",
    lat: 35.2271,
    lng: -80.8431,
    population: 897720,
  },
  {
    id: "jur_durham",
    slug: "durham-nc",
    name: "Durham",
    state: "NC",
    type: "city",
    lat: 35.994,
    lng: -78.8986,
    population: 285527,
  },
  {
    id: "jur_cary",
    slug: "cary-nc",
    name: "Cary",
    state: "NC",
    type: "town",
    lat: 35.7915,
    lng: -78.7811,
    population: 174721,
  },
  {
    id: "jur_wake",
    slug: "wake-county-nc",
    name: "Wake County",
    state: "NC",
    type: "county",
    lat: 35.7898,
    lng: -78.6512,
    population: 1129410,
  },
];

export const SEED_BODIES: SeedBody[] = [
  {
    id: "body_ral_council",
    slug: "city-council",
    jurisdictionId: "jur_raleigh",
    name: "City Council",
    type: "city_council",
  },
  {
    id: "body_ral_planning",
    slug: "planning-commission",
    jurisdictionId: "jur_raleigh",
    name: "Planning Commission",
    type: "planning_commission",
  },
  {
    id: "body_clt_council",
    slug: "city-council",
    jurisdictionId: "jur_charlotte",
    name: "City Council",
    type: "city_council",
  },
  {
    id: "body_clt_zoning",
    slug: "zoning-committee",
    jurisdictionId: "jur_charlotte",
    name: "Zoning Committee",
    type: "zoning_board",
  },
  {
    id: "body_dur_council",
    slug: "city-council",
    jurisdictionId: "jur_durham",
    name: "City Council",
    type: "city_council",
  },
  {
    id: "body_dur_school",
    slug: "board-of-education",
    jurisdictionId: "jur_durham",
    name: "Durham Public Schools Board of Education",
    type: "school_board",
  },
  {
    id: "body_cary_council",
    slug: "town-council",
    jurisdictionId: "jur_cary",
    name: "Town Council",
    type: "city_council",
  },
  {
    id: "body_wake_commissioners",
    slug: "board-of-commissioners",
    jurisdictionId: "jur_wake",
    name: "Board of Commissioners",
    type: "county_commission",
  },
  {
    id: "body_wake_school",
    slug: "board-of-education",
    jurisdictionId: "jur_wake",
    name: "Wake County Board of Education",
    type: "school_board",
  },
];

const legistar = (client: string, id: number) =>
  `https://${client}.legistar.com/MeetingDetail.aspx?LEGID=${id}`;

export const SEED_MEETINGS: SeedMeeting[] = [
  {
    id: "mtg_ral_council_0512",
    bodyId: "body_ral_council",
    title: "City Council",
    meetingType: "Regular Meeting",
    scheduledAt: "2026-05-12T23:00:00Z",
    status: "completed",
    location: "Council Chamber, 222 W. Hargett St.",
    videoUrl: "https://example.org/video/ral-council-0512",
    sourceUrl: legistar("raleigh", 5012),
    agendaItems: [
      {
        itemNumber: "1",
        title: "Rezoning Z-12-2026: Hillsborough Street mixed-use",
        description:
          "Public hearing on a request to rezone 4.2 acres for a mixed-use development with ground-floor retail and 280 residential units, including an affordable housing set-aside.",
      },
      {
        itemNumber: "2",
        title: "Affordable housing bond allocation",
        description:
          "Allocation of $8M from the affordable housing bond toward two developments near transit corridors.",
      },
      {
        itemNumber: "3",
        title: "Sidewalk improvement program — Glenwood Avenue",
        description: "Award of construction contract for pedestrian and ADA improvements.",
      },
      {
        itemNumber: "4",
        title: "Short-term rental regulations update",
        description:
          "Second reading of an ordinance amending short-term rental permitting and enforcement.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — May 12, 2026",
        originalUrl: legistar("raleigh", 5012) + "&agenda",
        textContent:
          "City Council Regular Meeting Agenda. Rezoning Z-12-2026 Hillsborough Street mixed-use. Affordable housing bond allocation. Sidewalk improvement program Glenwood Avenue. Short-term rental regulations.",
      },
      {
        docType: "minutes",
        title: "Minutes — May 12, 2026",
        originalUrl: legistar("raleigh", 5012) + "&minutes",
        textContent:
          "The Council approved rezoning Z-12-2026 by a vote of 6-2 after a public hearing in which residents raised concerns about traffic and affordable housing. The affordable housing bond allocation passed unanimously.",
      },
    ],
    transcript: {
      provider: "deepgram",
      segments: [
        {
          startMs: 0,
          endMs: 8000,
          speaker: "Mayor",
          text: "Good evening and welcome to the May 12th regular meeting of the Raleigh City Council. We'll begin with the public hearing on rezoning case Z-12-2026.",
        },
        {
          startMs: 8000,
          endMs: 22000,
          speaker: "Planning Staff",
          text: "Thank you, Mayor. The applicant is requesting to rezone 4.2 acres along Hillsborough Street for a mixed-use development that includes ground-floor retail and 280 residential units, with twenty percent reserved as affordable housing.",
        },
        {
          startMs: 22000,
          endMs: 41000,
          speaker: "Resident",
          text: "I live two blocks from the proposed site, and while I support more affordable housing, I'm concerned about traffic on Hillsborough Street during peak hours and whether the sidewalk improvements will keep up.",
        },
        {
          startMs: 41000,
          endMs: 60000,
          speaker: "Council Member",
          text: "I share the traffic concern, but this project advances our affordable housing goals near a transit corridor, which is exactly the kind of development our comprehensive plan calls for. I'll be voting in favor.",
        },
      ],
    },
  },
  {
    id: "mtg_ral_planning_0506",
    bodyId: "body_ral_planning",
    title: "Planning Commission",
    meetingType: "Regular Meeting",
    scheduledAt: "2026-05-06T22:30:00Z",
    status: "completed",
    sourceUrl: legistar("raleigh", 5006),
    agendaItems: [
      {
        itemNumber: "A",
        title: "Comprehensive plan amendment — transit-oriented development overlay",
        description:
          "Recommendation on a comprehensive plan amendment creating a transit-oriented development overlay district along the Bus Rapid Transit line.",
      },
      {
        itemNumber: "B",
        title: "Accessory dwelling unit (ADU) text change",
        description:
          "Text change to allow accessory dwelling units by-right in residential districts.",
      },
      {
        itemNumber: "C",
        title: "Rezoning Z-09-2026: Capital Boulevard corridor",
        description: "Rezoning to support corridor revitalization.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — May 6, 2026",
        originalUrl: legistar("raleigh", 5006) + "&agenda",
        textContent:
          "Planning Commission. Comprehensive plan amendment transit-oriented development overlay. Accessory dwelling unit text change. Rezoning Z-09-2026 Capital Boulevard corridor.",
      },
    ],
  },
  {
    id: "mtg_clt_council_0511",
    bodyId: "body_clt_council",
    title: "City Council",
    meetingType: "Business Meeting",
    scheduledAt: "2026-05-11T23:00:00Z",
    status: "completed",
    videoUrl: "https://example.org/video/clt-council-0511",
    sourceUrl: legistar("charlotte", 5111),
    agendaItems: [
      {
        itemNumber: "1",
        title: "FY2027 budget public hearing",
        description:
          "Public hearing on the recommended $3.5B budget, including transit, police body cameras, and affordable housing investments.",
      },
      {
        itemNumber: "2",
        title: "Light rail Silver Line funding agreement",
        description: "Interlocal agreement for the Silver Line light rail extension.",
      },
      {
        itemNumber: "3",
        title: "Police body camera policy update",
        description: "Update to the body-worn camera footage release policy.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — May 11, 2026",
        originalUrl: legistar("charlotte", 5111) + "&agenda",
        textContent:
          "Charlotte City Council Business Meeting. FY2027 budget public hearing transit police body cameras affordable housing. Light rail Silver Line funding agreement. Police body camera policy update.",
      },
      {
        docType: "minutes",
        title: "Minutes — May 11, 2026",
        originalUrl: legistar("charlotte", 5111) + "&minutes",
        textContent:
          "Council held a public hearing on the FY2027 budget. Several speakers urged additional funding for affordable housing and transit. The Silver Line funding agreement was approved 9-2.",
      },
    ],
  },
  {
    id: "mtg_clt_zoning_0518",
    bodyId: "body_clt_zoning",
    title: "Zoning Committee",
    meetingType: "Zoning Meeting",
    scheduledAt: "2026-05-18T22:00:00Z",
    status: "completed",
    sourceUrl: legistar("charlotte", 5118),
    agendaItems: [
      {
        itemNumber: "1",
        title: "Rezoning petition 2026-045: South End",
        description:
          "Petition to rezone for transit-oriented mixed-use development near the light rail station.",
      },
      {
        itemNumber: "2",
        title: "Rezoning petition 2026-051: solar farm in extraterritorial jurisdiction",
        description: "Conditional rezoning for a 60-acre solar farm.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — May 18, 2026",
        originalUrl: legistar("charlotte", 5118) + "&agenda",
        textContent:
          "Zoning Committee. Rezoning petition 2026-045 South End transit-oriented mixed-use. Rezoning petition 2026-051 solar farm.",
      },
    ],
  },
  {
    id: "mtg_dur_council_0504",
    bodyId: "body_dur_council",
    title: "City Council",
    meetingType: "Regular Session",
    scheduledAt: "2026-05-04T23:00:00Z",
    status: "completed",
    videoUrl: "https://example.org/video/dur-council-0504",
    sourceUrl: legistar("durham", 5004),
    agendaItems: [
      {
        itemNumber: "1",
        title: "Eviction diversion and affordable housing update",
        description:
          "Quarterly update on the eviction diversion program and affordable housing pipeline.",
      },
      {
        itemNumber: "2",
        title: "Bike lane and complete streets plan — Roxboro Street",
        description: "Approval of the complete streets redesign adding protected bike lanes.",
      },
      {
        itemNumber: "3",
        title: "Water and sewer rate adjustment",
        description: "Public hearing on a proposed 4% water and sewer rate adjustment.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — May 4, 2026",
        originalUrl: legistar("durham", 5004) + "&agenda",
        textContent:
          "Durham City Council Regular Session. Eviction diversion affordable housing update. Bike lane complete streets Roxboro Street. Water and sewer rate adjustment public hearing.",
      },
      {
        docType: "minutes",
        title: "Minutes — May 4, 2026",
        originalUrl: legistar("durham", 5004) + "&minutes",
        textContent:
          "Council received the eviction diversion update and approved the Roxboro Street complete streets redesign. The water and sewer rate adjustment public hearing was continued to the next meeting.",
      },
    ],
    transcript: {
      provider: "assemblyai",
      segments: [
        {
          startMs: 0,
          endMs: 9000,
          speaker: "Mayor",
          text: "We're now on item one, the eviction diversion and affordable housing update. I'll ask staff to walk us through the quarterly numbers.",
        },
        {
          startMs: 9000,
          endMs: 26000,
          speaker: "Housing Director",
          text: "Thank you. Over the last quarter the eviction diversion program kept 412 households in their homes, and our affordable housing pipeline now includes just over 900 units in predevelopment.",
        },
        {
          startMs: 26000,
          endMs: 44000,
          speaker: "Council Member",
          text: "These are encouraging numbers, but I want to make sure the water and sewer rate adjustment we're considering tonight doesn't undercut affordability for the same families we're trying to help.",
        },
      ],
    },
  },
  {
    id: "mtg_dur_school_0521",
    bodyId: "body_dur_school",
    title: "Durham Public Schools Board of Education",
    meetingType: "Regular Meeting",
    scheduledAt: "2026-05-21T23:00:00Z",
    status: "completed",
    sourceUrl: legistar("dpsnc", 5021),
    agendaItems: [
      {
        itemNumber: "1",
        title: "School redistricting and boundary changes for 2027",
        description:
          "Public comment and first read on proposed elementary school boundary changes to address overcrowding.",
      },
      {
        itemNumber: "2",
        title: "Teacher supplement and budget request",
        description:
          "Approval of the local budget request including a teacher supplement increase.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — May 21, 2026",
        originalUrl: legistar("dpsnc", 5021) + "&agenda",
        textContent:
          "Board of Education. School redistricting boundary changes 2027 overcrowding. Teacher supplement budget request.",
      },
    ],
  },
  {
    id: "mtg_cary_council_0514",
    bodyId: "body_cary_council",
    title: "Town Council",
    meetingType: "Regular Meeting",
    scheduledAt: "2026-05-14T22:30:00Z",
    status: "completed",
    sourceUrl: legistar("cary", 5014),
    agendaItems: [
      {
        itemNumber: "1",
        title: "Downtown park expansion and bond projects",
        description: "Update on downtown park expansion funded by the parks bond.",
      },
      {
        itemNumber: "2",
        title: "Rezoning 26-REZ-04: Cary Towne Center redevelopment",
        description: "Mixed-use redevelopment of the former mall site.",
      },
      {
        itemNumber: "3",
        title: "Stormwater and flood mitigation ordinance",
        description: "Amendments to stormwater management requirements for new development.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — May 14, 2026",
        originalUrl: legistar("cary", 5014) + "&agenda",
        textContent:
          "Cary Town Council. Downtown park expansion bond projects. Rezoning 26-REZ-04 Cary Towne Center redevelopment mixed-use. Stormwater flood mitigation ordinance.",
      },
    ],
  },
  {
    id: "mtg_wake_commissioners_0519",
    bodyId: "body_wake_commissioners",
    title: "Board of Commissioners",
    meetingType: "Regular Meeting",
    scheduledAt: "2026-05-19T17:00:00Z",
    status: "completed",
    sourceUrl: legistar("wake", 5019),
    agendaItems: [
      {
        itemNumber: "1",
        title: "County budget and property tax rate FY2027",
        description: "Presentation of the recommended county budget and property tax rate.",
      },
      {
        itemNumber: "2",
        title: "Affordable housing trust fund expansion",
        description: "Expansion of the county affordable housing trust fund.",
      },
      {
        itemNumber: "3",
        title: "Transit governance interlocal agreement",
        description: "Regional transit governance and funding.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — May 19, 2026",
        originalUrl: legistar("wake", 5019) + "&agenda",
        textContent:
          "Wake County Board of Commissioners. County budget property tax rate FY2027. Affordable housing trust fund expansion. Transit governance interlocal agreement.",
      },
      {
        docType: "minutes",
        title: "Minutes — May 19, 2026",
        originalUrl: legistar("wake", 5019) + "&minutes",
        textContent:
          "The Board received the recommended budget and set a public hearing. The affordable housing trust fund expansion was approved.",
      },
    ],
  },
  {
    id: "mtg_wake_school_0507",
    bodyId: "body_wake_school",
    title: "Wake County Board of Education",
    meetingType: "Board Meeting",
    scheduledAt: "2026-05-07T22:30:00Z",
    status: "completed",
    sourceUrl: legistar("wcpss", 5007),
    agendaItems: [
      {
        itemNumber: "1",
        title: "Student assignment and school redistricting plan",
        description: "Public hearing on the student assignment plan affecting fourteen schools.",
      },
      {
        itemNumber: "2",
        title: "Capital improvement program — new elementary school",
        description: "Approval of design funding for a new elementary school.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — May 7, 2026",
        originalUrl: legistar("wcpss", 5007) + "&agenda",
        textContent:
          "Wake County Board of Education. Student assignment school redistricting plan fourteen schools. Capital improvement program new elementary school.",
      },
    ],
  },
  // ── Upcoming meetings ──────────────────────────────────────────────────────
  {
    id: "mtg_ral_council_0609",
    bodyId: "body_ral_council",
    title: "City Council",
    meetingType: "Regular Meeting",
    scheduledAt: "2026-06-09T23:00:00Z",
    status: "scheduled",
    sourceUrl: legistar("raleigh", 6009),
    agendaItems: [
      {
        itemNumber: "1",
        title: "FY2027 budget adoption",
        description: "Adoption of the fiscal year 2027 budget.",
      },
      {
        itemNumber: "2",
        title: "Rezoning Z-15-2026: Person Street",
        description: "Public hearing on a rezoning for a mixed-use infill project.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — June 9, 2026",
        originalUrl: legistar("raleigh", 6009) + "&agenda",
        textContent:
          "City Council Regular Meeting. FY2027 budget adoption. Rezoning Z-15-2026 Person Street mixed-use infill.",
      },
    ],
  },
  {
    id: "mtg_clt_council_0608",
    bodyId: "body_clt_council",
    title: "City Council",
    meetingType: "Business Meeting",
    scheduledAt: "2026-06-08T23:00:00Z",
    status: "scheduled",
    sourceUrl: legistar("charlotte", 6008),
    agendaItems: [
      {
        itemNumber: "1",
        title: "FY2027 budget adoption and tax rate",
        description: "Adoption of the budget and property tax rate.",
      },
      {
        itemNumber: "2",
        title: "Affordable housing land acquisition",
        description: "Acquisition of land for affordable housing near a transit station.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — June 8, 2026",
        originalUrl: legistar("charlotte", 6008) + "&agenda",
        textContent:
          "Charlotte City Council. FY2027 budget adoption tax rate. Affordable housing land acquisition transit station.",
      },
    ],
  },
  {
    id: "mtg_cary_council_0611",
    bodyId: "body_cary_council",
    title: "Town Council",
    meetingType: "Quasi-Judicial Hearing",
    scheduledAt: "2026-06-11T22:30:00Z",
    status: "scheduled",
    sourceUrl: legistar("cary", 6011),
    agendaItems: [
      {
        itemNumber: "1",
        title: "Rezoning 26-REZ-09: solar and battery storage facility",
        description: "Conditional use for a solar and battery storage facility.",
      },
      {
        itemNumber: "2",
        title: "Greenway connector and park trail expansion",
        description: "Construction contract for a greenway connector.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — June 11, 2026",
        originalUrl: legistar("cary", 6011) + "&agenda",
        textContent:
          "Cary Town Council Quasi-Judicial Hearing. Rezoning 26-REZ-09 solar battery storage. Greenway connector park trail expansion.",
      },
    ],
  },
  {
    id: "mtg_wake_commissioners_0616",
    bodyId: "body_wake_commissioners",
    title: "Board of Commissioners",
    meetingType: "Budget Public Hearing",
    scheduledAt: "2026-06-16T17:00:00Z",
    status: "scheduled",
    sourceUrl: legistar("wake", 6016),
    agendaItems: [
      {
        itemNumber: "1",
        title: "Public hearing on FY2027 county budget",
        description: "Public comment on the recommended budget and property tax rate.",
      },
    ],
    documents: [
      {
        docType: "agenda",
        title: "Agenda — June 16, 2026",
        originalUrl: legistar("wake", 6016) + "&agenda",
        textContent:
          "Wake County Board of Commissioners Budget Public Hearing FY2027 county budget property tax rate.",
      },
    ],
  },
];
