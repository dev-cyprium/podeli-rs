/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as bookings from "../bookings.js";
import type * as categories from "../categories.js";
import type * as clerk from "../clerk.js";
import type * as cronHandlers from "../cronHandlers.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as items from "../items.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as plans from "../plans.js";
import type * as profiles from "../profiles.js";
import type * as promotionalCodes from "../promotionalCodes.js";
import type * as reviews from "../reviews.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  bookings: typeof bookings;
  categories: typeof categories;
  clerk: typeof clerk;
  cronHandlers: typeof cronHandlers;
  crons: typeof crons;
  debug: typeof debug;
  items: typeof items;
  messages: typeof messages;
  notifications: typeof notifications;
  plans: typeof plans;
  profiles: typeof profiles;
  promotionalCodes: typeof promotionalCodes;
  reviews: typeof reviews;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
