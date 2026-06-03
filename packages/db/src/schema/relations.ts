import { relations } from "drizzle-orm";
import { users } from "./auth";
import { memberships, organizations, subscriptions } from "./billing";
import { govBodies, jurisdictions, platformConfigs } from "./jurisdictions";
import { agendaItems, documents, meetings, transcripts, transcriptSegments } from "./meetings";
import { alertSubscriptions, savedSearches } from "./alerts";

export const jurisdictionsRelations = relations(jurisdictions, ({ many }) => ({
  govBodies: many(govBodies),
  platformConfigs: many(platformConfigs),
  meetings: many(meetings),
}));

export const govBodiesRelations = relations(govBodies, ({ one, many }) => ({
  jurisdiction: one(jurisdictions, {
    fields: [govBodies.jurisdictionId],
    references: [jurisdictions.id],
  }),
  meetings: many(meetings),
}));

export const platformConfigsRelations = relations(platformConfigs, ({ one }) => ({
  jurisdiction: one(jurisdictions, {
    fields: [platformConfigs.jurisdictionId],
    references: [jurisdictions.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  govBody: one(govBodies, { fields: [meetings.govBodyId], references: [govBodies.id] }),
  jurisdiction: one(jurisdictions, {
    fields: [meetings.jurisdictionId],
    references: [jurisdictions.id],
  }),
  agendaItems: many(agendaItems),
  documents: many(documents),
  transcript: one(transcripts),
}));

export const agendaItemsRelations = relations(agendaItems, ({ one, many }) => ({
  meeting: one(meetings, { fields: [agendaItems.meetingId], references: [meetings.id] }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  meeting: one(meetings, { fields: [documents.meetingId], references: [meetings.id] }),
  agendaItem: one(agendaItems, {
    fields: [documents.agendaItemId],
    references: [agendaItems.id],
  }),
}));

export const transcriptsRelations = relations(transcripts, ({ one, many }) => ({
  meeting: one(meetings, { fields: [transcripts.meetingId], references: [meetings.id] }),
  segments: many(transcriptSegments),
}));

export const transcriptSegmentsRelations = relations(transcriptSegments, ({ one }) => ({
  transcript: one(transcripts, {
    fields: [transcriptSegments.transcriptId],
    references: [transcripts.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  savedSearches: many(savedSearches),
  subscriptions: many(subscriptions),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, { fields: [organizations.ownerId], references: [users.id] }),
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  user: one(users, { fields: [savedSearches.userId], references: [users.id] }),
  alertSubscription: one(alertSubscriptions),
}));

export const alertSubscriptionsRelations = relations(alertSubscriptions, ({ one }) => ({
  savedSearch: one(savedSearches, {
    fields: [alertSubscriptions.savedSearchId],
    references: [savedSearches.id],
  }),
}));
