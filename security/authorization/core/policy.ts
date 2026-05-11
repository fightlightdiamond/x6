/**
 * Typed policy definition for the CASL Authorization System.
 *
 * Converted from `x6/security/authoriztion/policy.sample.ts` (note: legacy folder has typo).
 * Uses `as const satisfies PolicyDefinition` for full TypeScript type-safety.
 *
 * NOTE — Action order differences vs. design.md:
 * The legacy `policy.sample.ts` lists actions in a different order for some resources.
 * Order does not affect authorization logic (the engine uses Set membership checks),
 * but the legacy order is preserved here for exact parity with the source of truth.
 *
 * Differences from design.md expected structure:
 *   - mimics.any.admin/design:    legacy = ['create','view','edit','delete']
 *                                 design  = ['view','create','edit','delete']
 *   - reports.any.admin/design:   legacy = ['create','view','edit','delete']
 *                                 design  = ['view','create','edit','delete']
 *   - xy_plots private/owner:     legacy = ['create','view','edit','delete']
 *                                 design  = ['view','create','edit','delete']
 *   - xy_plots shared/owner:      legacy = ['create','view','edit','delete']
 *                                 design  = ['view','create','edit','delete']
 *
 * All permission sets are identical — only ordering differs.
 */

import type { PolicyDefinition } from "../types/index";

export const POLICY = {
  // ===== Web (any-based) =====
  web: {
    any: {
      admin: ["view", "create"],
      design: ["view", "create"],
      browse: ["view", "create"],
    },
  },

  // ===== Trends (scoped: private/shared × owner/other) =====
  trends: {
    scopedBy: { typeField: "type", ownerField: "user_id" },
    private: {
      owner: {
        admin: ["view", "create", "edit", "delete"],
        design: ["view", "create", "edit", "delete"],
        browse: ["view", "create", "edit", "delete"],
      },
      other: {
        // Private trend owned by a different user: delete admin only
        admin: ["delete"],
        design: [],
        browse: [],
      },
    },
    shared: {
      owner: {
        // Shared trend owned by this user: admin/design full, browse none
        admin: ["view", "create", "edit", "delete"],
        design: ["view", "create", "edit", "delete"],
        browse: [],
      },
      other: {
        // Shared trend owned by different user: view all, delete admin+design
        admin: ["view", "delete"],
        design: ["view", "delete"],
        browse: ["view"],
      },
    },
  },

  // ===== Trends Export (any-based) =====
  trends_export: {
    any: {
      admin: ["export"],
      design: ["export"],
      browse: ["export"],
    },
  },

  // ===== Mimics (any-based) =====
  // NOTE: legacy order is ['create','view','edit','delete'] — preserved here.
  mimics: {
    any: {
      admin: ["create", "view", "edit", "delete"],
      design: ["create", "view", "edit", "delete"],
      browse: [], // browse: no access
    },
  },

  // ===== Reports (any-based) =====
  // NOTE: legacy order is ['create','view','edit','delete'] — preserved here.
  reports: {
    any: {
      admin: ["create", "view", "edit", "delete"],
      design: ["create", "view", "edit", "delete"],
      browse: [], // browse: no access
    },
  },

  // ===== XY Plots (scoped: private/shared × owner/other) =====
  // NOTE: legacy order for owner actions is ['create','view','edit','delete'] — preserved here.
  xy_plots: {
    scopedBy: { typeField: "type", ownerField: "user_id" },
    private: {
      owner: {
        admin: ["create", "view", "edit", "delete"],
        design: ["create", "view", "edit", "delete"],
        browse: ["create", "view", "edit", "delete"],
      },
      other: {
        // Private XY plot owned by different user: delete admin only
        admin: ["delete"],
        design: [],
        browse: [],
      },
    },
    shared: {
      owner: {
        // Shared XY plot owned by this user: admin/design full, browse none
        admin: ["create", "view", "edit", "delete"],
        design: ["create", "view", "edit", "delete"],
        browse: [],
      },
      other: {
        // Shared XY plot owned by different user: view all, delete admin+design
        admin: ["view", "delete"],
        design: ["view", "delete"],
        browse: ["view"],
      },
    },
  },

  // ===== XY Plots Export (any-based) =====
  xy_plots_export: {
    any: {
      admin: ["export"],
      design: ["export"],
      browse: ["export"],
    },
  },
} as const satisfies PolicyDefinition;
