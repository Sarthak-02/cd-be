import { reportDashboardConfig_by_section_get } from "../../controllers/app/reportDashboardConfig.controller.js";
import { ReportDashboardConfigBySectionSchema } from "../../schemas/app/reportDashboardConfig.schema.js";

async function reportDashboardConfigRoutes(app) {
  app.get(
    "/report-dashboard-config",
    { schema: ReportDashboardConfigBySectionSchema },
    reportDashboardConfig_by_section_get
  );
}

export default reportDashboardConfigRoutes;
