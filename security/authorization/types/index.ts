/**
 * Core TypeScript types and interfaces for the CASL Authorization System.
 *
 * @module types
 */

import type { PureAbility } from "@casl/ability";

// ===== Actions =====
export const ACTIONS = ["view", "create", "edit", "delete", "export"] as const;
export type Action = (typeof ACTIONS)[number];

// ===== Roles =====
export const ROLES = ["admin", "design", "browse"] as const;
export type Role = (typeof ROLES)[number];

// ===== Resource Types =====
export const RESOURCE_TYPES = [
  "web",
  "trends",
  "mimics",
  "reports",
  "xy_plots",
  "trends_export",
  "xy_plots_export",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

// ===== Scope Types =====
export type ScopeType = "private" | "shared";

// ===== User Context =====
export interface UserContext {
  readonly id: string | number;
  readonly role: Role;
  readonly metadata?: Record<string, unknown>;
}

// ===== Subject Metadata (for scoped resources) =====
export interface SubjectMetadata {
  readonly type: ScopeType;
  readonly user_id: string | number;
  readonly [key: string]: unknown;
}

// ===== Policy Definition =====

/** Resource definition where permissions are not scope-dependent. */
export interface AnyResourceDef {
  readonly any: Readonly<Record<Role, readonly Action[]>>;
}

/** Resource definition where permissions depend on scope (private/shared) and ownership. */
export interface ScopedResourceDef {
  readonly scopedBy: ScopedResourceConfig;
  readonly private: ScopePermissions;
  readonly shared: ScopePermissions;
}

/** Configuration describing which subject fields carry scope and ownership info. */
export interface ScopedResourceConfig {
  readonly typeField: string;
  readonly ownerField: string;
}

/** Permission matrix for a single scope level, split by owner vs. other. */
export interface ScopePermissions {
  readonly owner: Readonly<Record<Role, readonly Action[]>>;
  readonly other: Readonly<Record<Role, readonly Action[]>>;
}

export type ResourceDef = AnyResourceDef | ScopedResourceDef;
export type PolicyDefinition = Readonly<Record<ResourceType, ResourceDef>>;

// ===== CASL Typed Ability =====

/** Union of all valid CASL subjects: resource type strings, subject metadata objects, or 'all'. */
export type AppSubjects = ResourceType | SubjectMetadata | "all";

/** Typed CASL ability for this application. */
export type AppAbility = PureAbility<[Action, AppSubjects]>;

// ===== Permission Check Result =====

/** Result returned by a permission check operation. */
export interface PermissionCheckResult {
  readonly allowed: boolean;
  readonly action: Action;
  readonly resource: ResourceType;
  readonly subject?: SubjectMetadata;
}

// ===== Extensibility Types (Requirement 20) =====

import type { AbilityBuilder } from "@casl/ability";

/**
 * A hook function called after standard rules are built, allowing custom rules
 * to be injected into the ability builder.
 *
 * @param builder     - The CASL `AbilityBuilder` instance (pre-populated with standard rules).
 * @param userContext - The current user context.
 */
export type AbilityBuildHook = (
  builder: AbilityBuilder<AppAbility>,
  userContext: UserContext,
) => void;

/**
 * A plugin that extends the Authorization System with custom actions, resources,
 * conditions, and/or ability-building hooks.
 *
 * All fields are optional — a plugin may provide any combination of extensions.
 */
export interface AuthorizationPlugin {
  /** Unique identifier for the plugin. */
  readonly name: string;
  /** Additional action strings beyond the built-in ACTIONS tuple. */
  readonly actions?: readonly string[];
  /** Additional resource type strings beyond the built-in RESOURCE_TYPES tuple. */
  readonly resources?: readonly string[];
  /**
   * Hook called after standard rules are built.
   * Use this to add custom CASL rules or conditions.
   */
  readonly buildHook?: AbilityBuildHook;
  /**
   * Optional partial policy definition contributed by this plugin.
   * Will be merged with the base policy when `mergePluginPolicies` is called.
   */
  readonly policy?: Partial<PolicyDefinition>;
}

/**
 * Registry that manages registered plugins and exposes helpers to apply them.
 */
export interface PluginRegistry {
  /** Register a plugin. Throws if a plugin with the same name is already registered. */
  register(plugin: AuthorizationPlugin): void;
  /** Unregister a plugin by name. No-op if the plugin is not registered. */
  unregister(name: string): void;
  /** Returns a snapshot of all currently registered plugins. */
  getAll(): readonly AuthorizationPlugin[];
  /** Returns a registered plugin by name, or `undefined` if not found. */
  get(name: string): AuthorizationPlugin | undefined;
}

/**
 * Versioned policy definition — wraps a `PolicyDefinition` with a version tag
 * to support policy versioning (requirement 20.9).
 */
export interface VersionedPolicy {
  readonly version: string;
  readonly policy: PolicyDefinition;
  readonly loadedAt: number; // Unix timestamp (ms)
}
