/**
 * Example 01: Basic Permission Checks
 *
 * Demonstrates how to check permissions using the core `buildAbility` function
 * and the `authorizationStore`.
 */

import { buildAbility } from "../core/ability";
import { POLICY } from "../core/policy";
import type { UserContext, SubjectMetadata } from "../types/index";

// ─── Using buildAbility directly ─────────────────────────────────────────────

const adminUser: UserContext = { id: "user-1", role: "admin" };
const ability = buildAbility(adminUser, POLICY);

// Any-based resource checks
console.log(ability.can("view", "web")); // true
console.log(ability.can("create", "web")); // true
console.log(ability.can("delete", "web")); // false (not in policy)

// Scoped resource checks require subject metadata
import { subject as caslSubject } from "@casl/ability";

const privateOwnedTrend: SubjectMetadata = {
  type: "private",
  user_id: "user-1", // Same as adminUser.id → owner
};

console.log(ability.can("edit", caslSubject("trends", privateOwnedTrend))); // true
console.log(ability.can("delete", caslSubject("trends", privateOwnedTrend))); // true

const privateOtherTrend: SubjectMetadata = {
  type: "private",
  user_id: "user-99", // Different user → other
};

console.log(ability.can("edit", caslSubject("trends", privateOtherTrend))); // false
console.log(ability.can("delete", caslSubject("trends", privateOtherTrend))); // true (admin can delete others' private)

// ─── Using the store (recommended in Vue components) ─────────────────────────

import { useAuthorizationStore } from "../stores/authorizationStore";

// In a Vue component or composable:
const store = useAuthorizationStore();
store.setUser({ id: "user-1", role: "admin" });

// The store handles caslSubject tagging automatically
console.log(store.can("edit", "trends", privateOwnedTrend)); // true
console.log(store.can("delete", "trends", privateOtherTrend)); // true
