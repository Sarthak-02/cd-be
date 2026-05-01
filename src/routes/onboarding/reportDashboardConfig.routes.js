import {
  reportDashboardConfig_post,
  reportDashboardConfig_get,
  reportDashboardConfig_all_get,
  reportDashboardConfig_put,
  reportDashboardConfig_delete,
} from "../../controllers/onboarding/reportDashboardConfig.controller.js";
import {
  reportDashboardConfigCreateSchema,
  reportDashboardConfigUpdateSchema,
  reportDashboardConfigGetSchema,
  reportDashboardConfigAllSchema,
} from "../../schemas/onboarding/reportDashboardConfig.schema.js";

async function reportDashboardConfigRoutes(app, options) {
  app.post("/report-dashboard-config", { schema: reportDashboardConfigCreateSchema }, reportDashboardConfig_post);
  app.get("/report-dashboard-config", { schema: reportDashboardConfigGetSchema }, reportDashboardConfig_get);
  app.get("/report-dashboard-config/all", { schema: reportDashboardConfigAllSchema }, reportDashboardConfig_all_get);
  app.put("/report-dashboard-config", { schema: reportDashboardConfigUpdateSchema }, reportDashboardConfig_put);
  app.delete("/report-dashboard-config", { schema: reportDashboardConfigGetSchema }, reportDashboardConfig_delete);
}

export default reportDashboardConfigRoutes;
