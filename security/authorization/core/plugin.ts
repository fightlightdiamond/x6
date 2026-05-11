/**
 * Plugin system for the CASL Authorization System.
 *
 * Provides:
 * - `createPluginRegistry()` — manages registered plugins (requirement 20.6)
 * - `mergePluginPolicies()` — merges plugin-contributed policies with the base policy (20.7)
 * - `applyPlugins()` — applies all plugin build hooks to an AbilityBuilder (20.5, 20.6)
 *
 * The plugin system is additive — existing functionality is never modified.
 * Plugins can contribute:
 * - Custom action strings (20.1)
 * - Custom resource type strings (20.2)
 * - Custom ability-building hooks (20.4, 20.5)
 * - Partial policy definitions that are merged with the base policy (20.7)
 *
 * @module core/plugin
 */

import type { AbilityBuilder } from "@casl/ability";
import type {
  AppAbility,
  AuthorizationPlugin,
  PluginRegistry,
  PolicyDefinition,
  UserContext,
} from "../types/index";
import { mergePolicies } from "./policy-merger";

// ─── Plugin Registry ──────────────────────────────────────────────────────────

/**
 * Creates a new `PluginRegistry` instance.
 *
 * The registry maintains an ordered list of plugins. Plugins are applied in
 * registration order when `applyPlugins` is called.
 *
 * @returns A fresh `PluginRegistry`.
 *
 * @example
 * ```ts
 * const registry = createPluginRegistry();
 * registry.register(myPlugin);
 * applyPlugins(builder, userContext, registry.getAll());
 * ```
 */
export function createPluginRegistry(): PluginRegistry {
  const plugins = new Map<string, AuthorizationPlugin>();

  return {
    register(plugin: AuthorizationPlugin): void {
      if (plugins.has(plugin.name)) {
        throw new Error(
          `[CASL Plugin] A plugin named "${plugin.name}" is already registered. ` +
            `Unregister it first or use a unique name.`,
        );
      }
      plugins.set(plugin.name, plugin);
    },

    unregister(name: string): void {
      plugins.delete(name);
    },

    getAll(): readonly AuthorizationPlugin[] {
      return Array.from(plugins.values());
    },

    get(name: string): AuthorizationPlugin | undefined {
      return plugins.get(name);
    },
  };
}

// ─── Policy merging ───────────────────────────────────────────────────────────

/**
 * Merges the base policy with any partial policies contributed by plugins.
 *
 * Plugin policies are merged in registration order. Later plugins override
 * earlier ones for the same resource key (deep merge of action arrays via
 * `mergePolicies`).
 *
 * Resources that are not present in any plugin policy are left unchanged from
 * the base policy.
 *
 * @param basePolicy - The application's base `PolicyDefinition`.
 * @param plugins    - Array of registered plugins (may be empty).
 * @returns A merged `PolicyDefinition` containing all base + plugin rules.
 *
 * @example
 * ```ts
 * const merged = mergePluginPolicies(POLICY, registry.getAll());
 * const ability = buildAbility(user, merged);
 * ```
 */
export function mergePluginPolicies(
  basePolicy: PolicyDefinition,
  plugins: readonly AuthorizationPlugin[],
): PolicyDefinition {
  // Collect all partial policies from plugins that define one
  const pluginPolicies = plugins
    .filter(
      (p): p is AuthorizationPlugin & { policy: Partial<PolicyDefinition> } =>
        p.policy !== undefined,
    )
    .map((p) => p.policy as Partial<PolicyDefinition>);

  if (pluginPolicies.length === 0) {
    return basePolicy;
  }

  // Cast partial policies to PolicyDefinition for mergePolicies
  // (mergePolicies handles missing keys gracefully)
  return mergePolicies(basePolicy, ...(pluginPolicies as PolicyDefinition[]));
}

// ─── Hook application ─────────────────────────────────────────────────────────

/**
 * Applies all plugin `buildHook` functions to the given `AbilityBuilder`.
 *
 * Hooks are called in plugin registration order. Each hook receives the
 * builder and the current user context, allowing it to add custom CASL rules.
 *
 * This function is a no-op when `plugins` is empty or no plugin defines a hook.
 *
 * @param builder     - The `AbilityBuilder` instance (already populated with standard rules).
 * @param userContext - The current user context.
 * @param plugins     - Array of registered plugins.
 *
 * @example
 * ```ts
 * const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
 * // ... add standard rules ...
 * applyPlugins(builder, userContext, registry.getAll());
 * const ability = builder.build();
 * ```
 */
export function applyPlugins(
  builder: AbilityBuilder<AppAbility>,
  userContext: UserContext,
  plugins: readonly AuthorizationPlugin[],
): void {
  for (const plugin of plugins) {
    if (plugin.buildHook !== undefined) {
      plugin.buildHook(builder, userContext);
    }
  }
}
