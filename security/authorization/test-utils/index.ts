/**
 * Test utilities for the CASL Authorization System.
 *
 * Provides helper functions to simplify test setup for authorization-related
 * unit and component tests.
 *
 * @module test-utils
 */

import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { Component } from "vue";
import type { MountingOptions, VueWrapper } from "@vue/test-utils";
import { buildAbility } from "../core/ability";
import { POLICY } from "../core/policy";
import { useAuthorizationStore } from "../stores/authorizationStore";
import type {
  AppAbility,
  Role,
  ScopeType,
  SubjectMetadata,
  UserContext,
} from "../types/index";

// ─── ID generation ────────────────────────────────────────────────────────────

let _idCounter = 0;

/** Generates a unique test user id when none is provided. */
function generateTestId(): string {
  return `test-user-${++_idCounter}`;
}

// ─── Factory functions ────────────────────────────────────────────────────────

/**
 * Creates a `UserContext` for use in tests.
 *
 * @param role - The role to assign to the test user.
 * @param id   - Optional user id. Defaults to a generated unique id.
 * @returns A `UserContext` with the given role and id.
 *
 * @example
 * const adminUser = createTestUser('admin');
 * const specificUser = createTestUser('design', 'user-42');
 */
export function createTestUser(role: Role, id?: string): UserContext {
  return {
    id: id ?? generateTestId(),
    role,
  };
}

/**
 * Creates a `SubjectMetadata` for use in scoped permission tests.
 *
 * @param type    - The scope type: `'private'` or `'shared'`.
 * @param ownerId - The id of the subject's owner.
 * @returns A `SubjectMetadata` with the given type and owner id.
 *
 * @example
 * const privateSubject = createTestSubject('private', 'user-1');
 * const sharedSubject  = createTestSubject('shared',  'user-2');
 */
export function createTestSubject(
  type: ScopeType,
  ownerId: string,
): SubjectMetadata {
  return {
    type,
    user_id: ownerId,
  };
}

/**
 * Creates an `AppAbility` instance for use in tests.
 *
 * Internally calls `buildAbility` with the application `POLICY`, so the
 * resulting ability reflects the real permission rules.
 *
 * @param role   - The role to build the ability for.
 * @param userId - Optional user id. Defaults to a generated unique id.
 * @returns A fully configured `AppAbility` instance.
 *
 * @example
 * const ability = createTestAbility('admin');
 * expect(ability.can('create', 'web')).toBe(true);
 *
 * const browseAbility = createTestAbility('browse', 'user-99');
 * expect(browseAbility.can('delete', 'mimics')).toBe(false);
 */
export function createTestAbility(role: Role, userId?: string): AppAbility {
  const user = createTestUser(role, userId);
  return buildAbility(user, POLICY);
}

// ─── Component mounting ───────────────────────────────────────────────────────

/**
 * Options accepted by `mountWithAbility`.
 *
 * Extends `@vue/test-utils` `MountingOptions` with authorization-specific
 * configuration.
 */
export interface MountWithAbilityOptions extends MountingOptions<object> {
  /**
   * The role to initialize the `authorizationStore` with.
   * Defaults to `'browse'` (guest-level access) when omitted.
   */
  role?: Role;
  /**
   * The user id to use when initializing the store.
   * Defaults to a generated unique id when omitted.
   */
  userId?: string;
}

/**
 * Mounts a Vue component with the `authorizationStore` pre-configured.
 *
 * Sets up a fresh Pinia instance, activates it, and initializes the
 * `authorizationStore` with the given `role` and `userId` before mounting
 * the component. This ensures that directives, composables, and components
 * that depend on the authorization store work correctly in tests.
 *
 * @param component - The Vue component to mount.
 * @param options   - Optional mounting options including `role` and `userId`.
 * @returns A `VueWrapper` for the mounted component.
 *
 * @example
 * const wrapper = mountWithAbility(MyComponent, { role: 'admin' });
 * expect(wrapper.find('[data-testid="create-btn"]').exists()).toBe(true);
 *
 * const browseWrapper = mountWithAbility(MyComponent, { role: 'browse' });
 * expect(browseWrapper.find('[data-testid="create-btn"]').exists()).toBe(false);
 */
export function mountWithAbility(
  component: Component,
  options?: MountWithAbilityOptions,
): VueWrapper {
  const { role = "browse", userId, ...mountingOptions } = options ?? {};

  // Create and activate a fresh Pinia instance for each test
  const pinia = createPinia();
  setActivePinia(pinia);

  // Initialize the authorization store with the desired user
  const store = useAuthorizationStore();
  const user = createTestUser(role, userId);
  store.setUser(user);

  // Merge the Pinia plugin into the global plugins list.
  // Cast through unknown to satisfy the strict Plugin union type while keeping
  // the Pinia instance usable as a Vue plugin.
  type PluginEntry = (typeof mountingOptions.global)["plugins"] extends
    | (infer P)[]
    | undefined
    ? P
    : never;
  const existingPlugins: PluginEntry[] =
    (mountingOptions.global?.plugins as PluginEntry[] | undefined) ?? [];

  return mount(component, {
    ...mountingOptions,
    global: {
      ...mountingOptions.global,
      plugins: [...existingPlugins, pinia as unknown as PluginEntry],
    },
  });
}
