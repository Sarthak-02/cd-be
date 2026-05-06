export const ReportDashboardConfigBySectionSchema = {
  tags: ["ReportDashboardConfig"],
  querystring: {
    type: "object",
    required: ["campus_id", "section_id"],
    properties: {
      campus_id: { type: "string", description: "Campus ID" },
      section_id: { type: "string", description: "Section ID" },
    },
  },
};
