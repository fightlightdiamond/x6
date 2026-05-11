/**
 * Unit tests for the plugin system and policy merger.
 *
 * Tests cover:
 * - createPluginRegistry: register, unregister, getAll, get
 * - mergePluginPolicies: merges plugin policies with base policy
 * - applyPlugins: applies plugin build hooks
 * - mergePolicies: merges multiple policy definitions
 * - loadPolicy in authorizationStore: dynamic policy loading
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createPluginRegistry,
  mergePluginPolicies,
  applyPlugins,
} from "./plugin";
import { mergePolicies } from "./policy-merger";
import { buildAbility } from "./ability";
import { POLICY } from "./policy";
import type {
  AuthorizationPlugin,
  PolicyDefinition,
  UserContext,
  AbilityBuildHook,
} from "../types/index";
import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import type { AppAbility } from "../types/index";

// ─── Test fixtures ────────────────────────────────────────────────────────────

const adminUser: UserContext = { id: "user-1", role: "admin" };
const browseUser: UserContext = { id: "user-2", role: "browse" };

// A minimal any-based policy for testing
const minimalPolicy: PolicyDefinition = {
  web: {
    any: {
      admin: ["view", "create"],
      design: ["view"],
      browse: ["view"],
    },
  },
  trends: POLICY.trends,
  mimics: POLICY.mimics,
  reports: POLICY.reports,
  xy_plots: POLICY.xy_plots,
  trends_export: POLICY.trends_export,
  xy_plots_export: POLICY.xy_plots_export,
};

// ─── createPluginRegistry ─────────────────────────────────────────────────────

describe("createPluginRegistry", () => {
  it("starts empty", () => {
    const registry = createPluginRegistry();
    expect(registry.getAll()).toHaveLength(0);
  });

  it("registers a plugin and retrieves it by name", () => {
    const registry = createPluginRegistry();
    const plugin: AuthorizationPlugin = { name: "my-plugin" };
    registry.register(plugin);
    expect(registry.get("my-plugin")).toBe(plugin);
    expect(registry.getAll()).toHaveLength(1);
  });

  it("throws when registering a duplicate plugin name", () => {
    const registry = createPluginRegistry();
    registry.register({ name: "dup" });
    expect(() => registry.register({ name: "dup" })).toThrow(
      /already registered/,
    );
  });

  it("unregisters a plugin by name", () => {
    const registry = createPluginRegistry();
    registry.register({ name: "to-remove" });
    registry.unregister("to-remove");
    expect(registry.get("to-remove")).toBeUndefined();
    expect(registry.getAll()).toHaveLength(0);
  });

  it("unregister is a no-op for unknown names", () => {
    const registry = createPluginRegistry();
    expect(() => registry.unregister("nonexistent")).not.toThrow();
  });

  it("returns plugins in registration order", () => {
    const registry = createPluginRegistry();
    registry.register({ name: "a" });
    registry.register({ name: "b" });
    registry.register({ name: "c" });
    const names = registry.getAll().map((p) => p.name);
    expect(names).toEqual(["a", "b", "c"]);
  });

  it("getAll returns a snapshot (not a live reference)", () => {
    const registry = createPluginRegistry();
    const snapshot = registry.getAll();
    registry.register({ name: "late" });
    // The snapshot taken before registration should not include "late"
    expect(snapshot).toHaveLength(0);
  });
});

// ─── applyPlugins ─────────────────────────────────────────────────────────────

describe("applyPlugins", () => {
  it("is a no-op when plugins array is empty", () => {
    const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
    expect(() => applyPlugins(builder, adminUser, [])).not.toThrow();
  });

  it("calls buildHook for each plugin that defines one", () => {
    const hook1 = vi.fn();
    const hook2 = vi.fn();
    const plugins: AuthorizationPlugin[] = [
      { name: "p1", buildHook: hook1 },
      { name: "p2" }, // no hook
      { name: "p3", buildHook: hook2 },
    ];
    const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
    applyPlugins(builder, adminUser, plugins);
    expect(hook1).toHaveBeenCalledOnce();
    expect(hook1).toHaveBeenCalledWith(builder, adminUser);
    expect(hook2).toHaveBeenCalledOnce();
    expect(hook2).toHaveBeenCalledWith(builder, adminUser);
  });

  it("hook can add custom rules to the builder", () => {
    const customHook: AbilityBuildHook = (builder, _user) => {
      builder.can("view" as never, "custom-resource" as never);
    };
    const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
    applyPlugins(builder, adminUser, [
      { name: "custom", buildHook: customHook },
    ]);
    const ability = builder.build();
    // The custom rule was added
    expect(ability.rules).toHaveLength(1);
  });
});

// ─── mergePluginPolicies ──────────────────────────────────────────────────────

describe("mergePluginPolicies", () => {
  it("returns base policy unchanged when no plugins have policies", () => {
    const plugins: AuthorizationPlugin[] = [
      { name: "no-policy" },
      { name: "also-no-policy" },
    ];
    const result = mergePluginPolicies(POLICY, plugins);
    expect(result).toBe(POLICY);
  });

  it("merges plugin policy actions with base policy", () => {
    const pluginPolicy: Partial<PolicyDefinition> = {
      web: {
        any: {
          admin: ["edit", "delete"], // adds edit/delete to web for admin
          design: [],
          browse: [],
        },
      },
    };
    const plugin: AuthorizationPlugin = {
      name: "web-extension",
      policy: pluginPolicy as PolicyDefinition,
    };
    const result = mergePluginPolicies(POLICY, [plugin]);
    const webDef = result.web;
    if ("any" in webDef) {
      // admin should now have view, create (from base) + edit, delete (from plugin)
      expect(webDef.any.admin).toContain("view");
      expect(webDef.any.admin).toContain("create");
      expect(webDef.any.admin).toContain("edit");
      expect(webDef.any.admin).toContain("delete");
    } else {
      throw new Error("Expected any-based resource def");
    }
  });

  it("returns base policy when plugins array is empty", () => {
    const result = mergePluginPolicies(POLICY, []);
    expect(result).toBe(POLICY);
  });
});

// ─── mergePolicies ────────────────────────────────────────────────────────────

describe("mergePolicies", () => {
  it("returns empty policy when called with no arguments", () => {
    const result = mergePolicies();
    expect(result).toEqual({});
  });

  it("returns the same policy when called with one argument", () => {
    const result = mergePolicies(POLICY);
    expect(result).toBe(POLICY);
  });

  it("merges two any-based resource defs by unioning actions", () => {
    const policyA: PolicyDefinition = {
      ...POLICY,
      web: {
        any: {
          admin: ["view"],
          design: ["view"],
          browse: ["view"],
        },
      },
    };
    const policyB: PolicyDefinition = {
      ...POLICY,
      web: {
        any: {
          admin: ["create", "edit"],
          design: ["create"],
          browse: [],
        },
      },
    };
    const merged = mergePolicies(policyA, policyB);
    const webDef = merged.web;
    if ("any" in webDef) {
      expect(webDef.any.admin).toEqual(
        expect.arrayContaining(["view", "create", "edit"]),
      );
      expect(webDef.any.admin).toHaveLength(3);
      expect(webDef.any.design).toEqual(
        expect.arrayContaining(["view", "create"]),
      );
      expect(webDef.any.browse).toEqual(["view"]);
    } else {
      throw new Error("Expected any-based resource def");
    }
  });

  it("deduplicates actions when merging", () => {
    const policyA: PolicyDefinition = {
      ...POLICY,
      web: { any: { admin: ["view", "create"], design: [], browse: [] } },
    };
    const policyB: PolicyDefinition = {
      ...POLICY,
      web: { any: { admin: ["view", "edit"], design: [], browse: [] } },
    };
    const merged = mergePolicies(policyA, policyB);
    const webDef = merged.web;
    if ("any" in webDef) {
      // "view" should appear only once
      expect(webDef.any.admin.filter((a) => a === "view")).toHaveLength(1);
      expect(webDef.any.admin).toEqual(
        expect.arrayContaining(["view", "create", "edit"]),
      );
    }
  });

  it("merges scoped resource defs by unioning actions per scope/ownership", () => {
    const policyA: PolicyDefinition = {
      ...POLICY,
      trends: {
        scopedBy: { typeField: "type", ownerField: "user_id" },
        private: {
          owner: { admin: ["view"], design: ["view"], browse: ["view"] },
          other: { admin: [], design: [], browse: [] },
        },
        shared: {
          owner: { admin: ["view"], design: ["view"], browse: [] },
          other: { admin: ["view"], design: ["view"], browse: ["view"] },
        },
      },
    };
    const policyB: PolicyDefinition = {
      ...POLICY,
      trends: {
        scopedBy: { typeField: "type", ownerField: "user_id" },
        private: {
          owner: { admin: ["create", "edit"], design: [], browse: [] },
          other: { admin: ["delete"], design: [], browse: [] },
        },
        shared: {
          owner: { admin: ["create"], design: [], browse: [] },
          other: { admin: ["delete"], design: [], browse: [] },
        },
      },
    };
    const merged = mergePolicies(policyA, policyB);
    const trendsDef = merged.trends;
    if ("scopedBy" in trendsDef) {
      expect(trendsDef.private.owner.admin).toEqual(
        expect.arrayContaining(["view", "create", "edit"]),
      );
      expect(trendsDef.private.other.admin).toContain("delete");
      expect(trendsDef.shared.owner.admin).toEqual(
        expect.arrayContaining(["view", "create"]),
      );
      expect(trendsDef.shared.other.admin).toEqual(
        expect.arrayContaining(["view", "delete"]),
      );
    } else {
      throw new Error("Expected scoped resource def");
    }
  });

  it("includes resources from only one policy unchanged", () => {
    const policyA: PolicyDefinition = {
      ...POLICY,
      web: { any: { admin: ["view"], design: [], browse: [] } },
    };
    // policyB doesn't override mimics
    const policyB: PolicyDefinition = {
      ...POLICY,
      web: { any: { admin: ["create"], design: [], browse: [] } },
    };
    const merged = mergePolicies(policyA, policyB);
    // mimics should be present from both (same value)
    expect(merged.mimics).toBeDefined();
  });

  it("merges three policies correctly", () => {
    const p1: PolicyDefinition = {
      ...POLICY,
      web: { any: { admin: ["view"], design: [], browse: [] } },
    };
    const p2: PolicyDefinition = {
      ...POLICY,
      web: { any: { admin: ["create"], design: [], browse: [] } },
    };
    const p3: PolicyDefinition = {
      ...POLICY,
      web: { any: { admin: ["edit"], design: [], browse: [] } },
    };
    const merged = mergePolicies(p1, p2, p3);
    const webDef = merged.web;
    if ("any" in webDef) {
      expect(webDef.any.admin).toEqual(
        expect.arrayContaining(["view", "create", "edit"]),
      );
    }
  });
});

// ─── buildAbility with hooks ──────────────────────────────────────────────────

describe("buildAbility with extension hooks", () => {
  it("calls hooks after standard rules are built", () => {
    const hookFn = vi.fn();
    buildAbility(adminUser, POLICY, [hookFn]);
    expect(hookFn).toHaveBeenCalledOnce();
  });

  it("hook receives the builder and userContext", () => {
    let capturedUser: UserContext | undefined;
    const hook: AbilityBuildHook = (_builder, user) => {
      capturedUser = user;
    };
    buildAbility(adminUser, POLICY, [hook]);
    expect(capturedUser).toEqual(adminUser);
  });

  it("hook can add custom rules that are reflected in the built ability", () => {
    const hook: AbilityBuildHook = (builder, _user) => {
      // Add a custom rule: admin can 'export' 'web'
      builder.can("export", "web");
    };
    const ability = buildAbility(browseUser, POLICY, [hook]);
    // browse normally cannot export web, but the hook adds it
    expect(ability.can("export", "web")).toBe(true);
  });

  it("works without hooks (backward compatible)", () => {
    const ability = buildAbility(adminUser, POLICY);
    expect(ability.can("view", "web")).toBe(true);
  });

  it("works with empty hooks array", () => {
    const ability = buildAbility(adminUser, POLICY, []);
    expect(ability.can("view", "web")).toBe(true);
  });

  it("applies multiple hooks in order", () => {
    const callOrder: number[] = [];
    const hook1: AbilityBuildHook = () => {
      callOrder.push(1);
    };
    const hook2: AbilityBuildHook = () => {
      callOrder.push(2);
    };
    const hook3: AbilityBuildHook = () => {
      callOrder.push(3);
    };
    buildAbility(adminUser, POLICY, [hook1, hook2, hook3]);
    expect(callOrder).toEqual([1, 2, 3]);
  });
});
