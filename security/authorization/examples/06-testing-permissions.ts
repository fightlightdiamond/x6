/**
 * Example 06: Testing Permissions
 *
 * Demonstrates how to write unit tests and component tests for authorization
 * using the test-utils module.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import {
  createTestUser,
  createTestSubject,
  createTestAbility,
  mountWithAbility,
} from "../test-utils/index";
import { buildAbility } from "../core/ability";
import { POLICY } from "../core/policy";
import { useAuthorizationStore } from "../stores/authorizationStore";

// ─── Unit tests for buildAbility ─────────────────────────────────────────────

describe("buildAbility — any-based resources", () => {
  it("grants admin view and create on web", () => {
    const ability = createTestAbility("admin");
    expect(ability.can("view", "web")).toBe(true);
    expect(ability.can("create", "web")).toBe(true);
    expect(ability.can("delete", "web")).toBe(false);
  });

  it("grants browse view and create on web", () => {
    const ability = createTestAbility("browse");
    expect(ability.can("view", "web")).toBe(true);
    expect(ability.can("create", "web")).toBe(true);
  });

  it("denies browse all access to mimics", () => {
    const ability = createTestAbility("browse");
    expect(ability.can("view", "mimics")).toBe(false);
    expect(ability.can("create", "mimics")).toBe(false);
  });
});

describe("buildAbility — scoped resources", () => {
  it("grants owner full access to their private trend", () => {
    const userId = "user-1";
    const ability = createTestAbility("browse", userId);
    const subject = createTestSubject("private", userId); // owner

    expect(ability.can("view", "trends", subject)).toBe(true);
    expect(ability.can("edit", "trends", subject)).toBe(true);
    expect(ability.can("delete", "trends", subject)).toBe(true);
  });

  it("denies browse access to others private trend", () => {
    const ability = createTestAbility("browse", "user-1");
    const subject = createTestSubject("private", "user-99"); // other

    expect(ability.can("view", "trends", subject)).toBe(false);
    expect(ability.can("edit", "trends", subject)).toBe(false);
    expect(ability.can("delete", "trends", subject)).toBe(false);
  });

  it("allows admin to delete others private trend", () => {
    const ability = createTestAbility("admin", "user-1");
    const subject = createTestSubject("private", "user-99"); // other

    expect(ability.can("delete", "trends", subject)).toBe(true);
    expect(ability.can("edit", "trends", subject)).toBe(false);
  });

  it("allows browse to view shared trends owned by others", () => {
    const ability = createTestAbility("browse", "user-1");
    const subject = createTestSubject("shared", "user-99"); // other

    expect(ability.can("view", "trends", subject)).toBe(true);
    expect(ability.can("edit", "trends", subject)).toBe(false);
    expect(ability.can("delete", "trends", subject)).toBe(false);
  });
});

// ─── Store tests ──────────────────────────────────────────────────────────────

describe("authorizationStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("rebuilds ability when user changes", () => {
    const store = useAuthorizationStore();

    store.setUser(createTestUser("browse"));
    expect(store.can("create", "mimics")).toBe(false);

    store.setUser(createTestUser("admin"));
    expect(store.can("create", "mimics")).toBe(true);
  });

  it("can and cannot are complementary", () => {
    const store = useAuthorizationStore();
    store.setUser(createTestUser("admin"));

    expect(store.can("view", "web")).toBe(!store.cannot("view", "web"));
    expect(store.can("delete", "web")).toBe(!store.cannot("delete", "web"));
  });
});

// ─── Component tests ──────────────────────────────────────────────────────────

// Assume we have a component that shows a "Create" button for admin
// import CreateButton from '../modules/web/components/CreateButton.vue';

// describe('CreateButton', () => {
//   it('shows button for admin', () => {
//     const wrapper = mountWithAbility(CreateButton, { role: 'admin' });
//     expect(wrapper.find('[data-testid="create-btn"]').exists()).toBe(true);
//   });
//
//   it('hides button for browse', () => {
//     const wrapper = mountWithAbility(CreateButton, { role: 'browse' });
//     expect(wrapper.find('[data-testid="create-btn"]').isVisible()).toBe(false);
//   });
// });
