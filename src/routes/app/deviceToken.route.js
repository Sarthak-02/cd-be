import {
  registerDeviceTokenController,
  unregisterDeviceTokenController,
  unregisterAllDeviceTokensController,
  getDeviceTokensController
} from "../../controllers/app/deviceToken.controller.js";

import {
  RegisterDeviceTokenSchema,
  UnregisterDeviceTokenSchema,
  UnregisterAllDeviceTokensSchema,
  GetDeviceTokensSchema
} from "../../schemas/app/deviceToken.schema.js";

/**
 * Device Token Routes
 * Base path: /app/device-token
 */
export default async function deviceTokenRoutes(app, options) {
  // Register a device token
  app.post(
    "/register",
    {
      schema: RegisterDeviceTokenSchema
    },
    registerDeviceTokenController
  );

  // Unregister a specific device token
  app.post(
    "/unregister",
    {
      schema: UnregisterDeviceTokenSchema
    },
    unregisterDeviceTokenController
  );

  // Unregister all device tokens for the user
  app.delete(
    "/unregister-all",
    {
      schema: UnregisterAllDeviceTokensSchema
    },
    unregisterAllDeviceTokensController
  );

  // Get all device tokens for the user
  app.get(
    "/list",
    {
      schema: GetDeviceTokensSchema
    },
    getDeviceTokensController
  );
}
