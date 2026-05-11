// Actions: view | create | edit | delete | export
// Roles: admin | design | browse
// subject schema cho resources scoped:
//   - subject.type: 'private' | 'shared'
//   - subject.user_id: number|string (ownerId)

export const POLICY = {
  web: {
    any: {
      admin: ["view", "create"],
      design: ["view", "create"],
      browse: ["view", "create"],
    },
  },

  // ===== Trends (đúng matrix) =====
  trends: {
    scopedBy: { typeField: "type", ownerField: "user_id" },

    private: {
      owner: {
        admin: ["view", "create", "edit", "delete"],
        design: ["view", "create", "edit", "delete"],
        browse: ["view", "create", "edit", "delete"],
      },
      other: {
        // Private trend owned by a different user:
        // View/Edit: nobody, Delete: admin only
        admin: ["delete"],
        design: [],
        browse: [],
      },
    },

    shared: {
      owner: {
        // Shared trend page owned by this user: admin/design full, browse none ("-")
        admin: ["view", "create", "edit", "delete"],
        design: ["view", "create", "edit", "delete"],
        browse: [],
      },
      other: {
        // Shared trend owned by different user:
        // View: all, Edit: none, Delete: admin+design
        admin: ["view", "delete"],
        design: ["view", "delete"],
        browse: ["view"],
      },
    },
  },

  trends_export: {
    any: {
      admin: ["export"],
      design: ["export"],
      browse: ["export"],
    },
  },

  // ===== Mimics (đúng matrix) =====
  mimics: {
    any: {
      admin: ["create", "view", "edit", "delete"],
      design: ["create", "view", "edit", "delete"],
      browse: [], // browse: X hết
    },
  },

  // ===== Reports (đúng matrix) =====
  reports: {
    any: {
      admin: ["create", "view", "edit", "delete"],
      design: ["create", "view", "edit", "delete"],
      browse: [], // browse: X hết
    },
  },

  // ===== XY Plots (đúng matrix thứ 2) =====
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
        // Shared XY plot owned by this user: admin/design full, browse none ("-")
        admin: ["create", "view", "edit", "delete"],
        design: ["create", "view", "edit", "delete"],
        browse: [],
      },
      other: {
        // Shared XY plot owned by different user:
        // View: all, Edit: none, Delete: admin+design
        admin: ["view", "delete"],
        design: ["view", "delete"],
        browse: ["view"],
      },
    },
  },

  xy_plots_export: {
    any: {
      admin: ["export"],
      design: ["export"],
      browse: ["export"],
    },
  },
};
