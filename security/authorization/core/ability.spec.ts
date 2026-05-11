/**
 * Unit tests for `buildAbility` and error classes.
 *
 * Validates: Requirements 17.1, 17.2
 */

import { describe, it, expect } from "vitest";
import { buildAbility } from "./ability";
import {
  PermissionDeniedError,
  InvalidPolicyError,
  InvalidUserContextError,
} from "./errors";
import { POLICY } from "./policy";
import type { UserContext, SubjectMetadata } from "../types/index";
import { subject as caslSubject } from "@casl/ability";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(
  role: "admin" | "design" | "browse",
  id = "user-1",
): UserContext {
  return { id, role };
}

function ownedPrivate(userId: string): SubjectMetadata {
  return { type: "private", user_id: userId };
}

function otherPrivate(userId: string): SubjectMetadata {
  return { type: "private", user_id: `other-${userId}` };
}

function ownedShared(userId: string): SubjectMetadata {
  return { type: "shared", user_id: userId };
}

function otherShared(userId: string): SubjectMetadata {
  return { type: "shared", user_id: `other-${userId}` };
}

// ─── Error classes ────────────────────────────────────────────────────────────

describe("Error classes", () => {
  it("PermissionDeniedError has correct name and message", () => {
    const err = new PermissionDeniedError("edit", "web", "user-1");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PermissionDeniedError);
    expect(err.name).toBe("PermissionDeniedError");
    expect(err.message).toBe("Permission denied: cannot edit web");
    expect(err.action).toBe("edit");
    expect(err.resource).toBe("web");
    expect(err.userId).toBe("user-1");
    expect(err.subject).toBeUndefined();
  });

  it("PermissionDeniedError stores subject when provided", () => {
    const subject: SubjectMetadata = { type: "private", user_id: "owner-1" };
    const err = new PermissionDeniedError("delete", "trends", 42, subject);
    expect(err.subject).toEqual(subject);
    expect(err.userId).toBe(42);
  });

  it("InvalidPolicyError has correct name and message", () => {
    const err = new InvalidPolicyError("missing field", "web.any");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(InvalidPolicyError);
    expect(err.name).toBe("InvalidPolicyError");
    expect(err.message).toBe("Invalid policy definition: missing field");
    expect(err.field).toBe("web.any");
  });

  it("InvalidPolicyError works without field", () => {
    const err = new InvalidPolicyError("bad policy");
    expect(err.field).toBeUndefined();
  });

  it("InvalidUserContextError has correct name and message", () => {
    const err = new InvalidUserContextError("id is required", "id");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(InvalidUserContextError);
    expect(err.name).toBe("InvalidUserContextError");
    expect(err.message).toBe("Invalid user context: id is required");
    expect(err.field).toBe("id");
  });

  it("InvalidUserContextError works without field", () => {
    const err = new InvalidUserContextError("bad context");
    expect(err.field).toBeUndefined();
  });
});

// ─── buildAbility — UserContext validation ────────────────────────────────────

describe("buildAbility — UserContext validation", () => {
  it("throws InvalidUserContextError when userContext is null", () => {
    expect(() => buildAbility(null as unknown as UserContext, POLICY)).toThrow(
      InvalidUserContextError,
    );
  });

  it("throws InvalidUserContextError when id is missing", () => {
    expect(() =>
      buildAbility({ role: "admin" } as unknown as UserContext, POLICY),
    ).toThrow(InvalidUserContextError);
  });

  it("throws InvalidUserContextError when id is empty string", () => {
    expect(() => buildAbility({ id: "", role: "admin" }, POLICY)).toThrow(
      InvalidUserContextError,
    );
  });

  it("throws InvalidUserContextError when id is null", () => {
    expect(() =>
      buildAbility({ id: null as unknown as string, role: "admin" }, POLICY),
    ).toThrow(InvalidUserContextError);
  });

  it("throws InvalidUserContextError when role is invalid", () => {
    expect(() =>
      buildAbility({ id: "user-1", role: "superadmin" as "admin" }, POLICY),
    ).toThrow(InvalidUserContextError);
  });

  it("throws InvalidUserContextError when role is missing", () => {
    expect(() =>
      buildAbility({ id: "user-1" } as unknown as UserContext, POLICY),
    ).toThrow(InvalidUserContextError);
  });
});

// ─── buildAbility — Policy validation ────────────────────────────────────────

describe("buildAbility — Policy validation", () => {
  it("throws InvalidPolicyError when policy is null", () => {
    expect(() =>
      buildAbility(makeUser("admin"), null as unknown as typeof POLICY),
    ).toThrow(InvalidPolicyError);
  });

  it("throws InvalidPolicyError when policy has unknown resource key", () => {
    const badPolicy = {
      unknown_resource: { any: { admin: [], design: [], browse: [] } },
    };
    expect(() =>
      buildAbility(makeUser("admin"), badPolicy as unknown as typeof POLICY),
    ).toThrow(InvalidPolicyError);
  });

  it("throws InvalidPolicyError when any-based resource has null any property", () => {
    const badPolicy = { web: { any: null } };
    expect(() =>
      buildAbility(makeUser("admin"), badPolicy as unknown as typeof POLICY),
    ).toThrow(InvalidPolicyError);
  });

  it("throws InvalidPolicyError when any-based resource role is not an array", () => {
    const badPolicy = {
      web: { any: { admin: "view", design: [], browse: [] } },
    };
    expect(() =>
      buildAbility(makeUser("admin"), badPolicy as unknown as typeof POLICY),
    ).toThrow(InvalidPolicyError);
  });

  it("throws InvalidPolicyError when resource has neither any nor scopedBy", () => {
    const badPolicy = { web: { something: {} } };
    expect(() =>
      buildAbility(makeUser("admin"), badPolicy as unknown as typeof POLICY),
    ).toThrow(InvalidPolicyError);
  });

  it("throws InvalidPolicyError when resource definition is not an object", () => {
    const badPolicy = { web: "invalid" };
    expect(() =>
      buildAbility(makeUser("admin"), badPolicy as unknown as typeof POLICY),
    ).toThrow(InvalidPolicyError);
  });
});

// ─── buildAbility — Any-based resources ──────────────────────────────────────

describe("buildAbility — any-based resources (web)", () => {
  it("admin can view and create web", () => {
    const ability = buildAbility(makeUser("admin"), POLICY);
    expect(ability.can("view", "web")).toBe(true);
    expect(ability.can("create", "web")).toBe(true);
  });

  it("admin cannot edit or delete web", () => {
    const ability = buildAbility(makeUser("admin"), POLICY);
    expect(ability.can("edit", "web")).toBe(false);
    expect(ability.can("delete", "web")).toBe(false);
  });

  it("browse can view and create web", () => {
    const ability = buildAbility(makeUser("browse"), POLICY);
    expect(ability.can("view", "web")).toBe(true);
    expect(ability.can("create", "web")).toBe(true);
  });

  it("browse cannot edit or delete web", () => {
    const ability = buildAbility(makeUser("browse"), POLICY);
    expect(ability.can("edit", "web")).toBe(false);
    expect(ability.can("delete", "web")).toBe(false);
  });
});

// ─── buildAbility — Any-based resources (mimics) ─────────────────────────────

describe("buildAbility — any-based resources (mimics)", () => {
  it("admin can create, view, edit, delete mimics", () => {
    const ability = buildAbility(makeUser("admin"), POLICY);
    expect(ability.can("create", "mimics")).toBe(true);
    expect(ability.can("view", "mimics")).toBe(true);
    expect(ability.can("edit", "mimics")).toBe(true);
    expect(ability.can("delete", "mimics")).toBe(true);
  });

  it("browse cannot access mimics at all", () => {
    const ability = buildAbility(makeUser("browse"), POLICY);
    expect(ability.can("view", "mimics")).toBe(false);
    expect(ability.can("create", "mimics")).toBe(false);
    expect(ability.can("edit", "mimics")).toBe(false);
    expect(ability.can("delete", "mimics")).toBe(false);
  });
});

// ─── buildAbility — Scoped resources (trends) ────────────────────────────────

describe("buildAbility — scoped resources (trends)", () => {
  const userId = "user-42";

  it("admin can do full CRUD on private trend they own", () => {
    const ability = buildAbility(makeUser("admin", userId), POLICY);
    const subject = caslSubject("trends", ownedPrivate(userId));
    expect(ability.can("view", subject)).toBe(true);
    expect(ability.can("create", subject)).toBe(true);
    expect(ability.can("edit", subject)).toBe(true);
    expect(ability.can("delete", subject)).toBe(true);
  });

  it("admin can only delete private trend owned by another user", () => {
    const ability = buildAbility(makeUser("admin", userId), POLICY);
    const subject = caslSubject("trends", otherPrivate(userId));
    expect(ability.can("view", subject)).toBe(false);
    expect(ability.can("create", subject)).toBe(false);
    expect(ability.can("edit", subject)).toBe(false);
    expect(ability.can("delete", subject)).toBe(true);
  });

  it("design cannot delete private trend owned by another user", () => {
    const ability = buildAbility(makeUser("design", userId), POLICY);
    const subject = caslSubject("trends", otherPrivate(userId));
    expect(ability.can("delete", subject)).toBe(false);
    expect(ability.can("view", subject)).toBe(false);
  });

  it("browse cannot delete private trend owned by another user", () => {
    const ability = buildAbility(makeUser("browse", userId), POLICY);
    const subject = caslSubject("trends", otherPrivate(userId));
    expect(ability.can("delete", subject)).toBe(false);
  });

  it("admin can view and delete shared trend owned by another user", () => {
    const ability = buildAbility(makeUser("admin", userId), POLICY);
    const subject = caslSubject("trends", otherShared(userId));
    expect(ability.can("view", subject)).toBe(true);
    expect(ability.can("delete", subject)).toBe(true);
    expect(ability.can("edit", subject)).toBe(false);
  });

  it("browse can only view shared trend owned by another user", () => {
    const ability = buildAbility(makeUser("browse", userId), POLICY);
    const subject = caslSubject("trends", otherShared(userId));
    expect(ability.can("view", subject)).toBe(true);
    expect(ability.can("delete", subject)).toBe(false);
    expect(ability.can("edit", subject)).toBe(false);
  });

  it("browse cannot access shared trend they own (browse has no shared owner permissions)", () => {
    const ability = buildAbility(makeUser("browse", userId), POLICY);
    const subject = caslSubject("trends", ownedShared(userId));
    expect(ability.can("view", subject)).toBe(false);
    expect(ability.can("create", subject)).toBe(false);
  });
});

// ─── buildAbility — Export resources ─────────────────────────────────────────

describe("buildAbility — export resources", () => {
  it("all roles can export trends", () => {
    for (const role of ["admin", "design", "browse"] as const) {
      const ability = buildAbility(makeUser(role), POLICY);
      expect(ability.can("export", "trends_export")).toBe(true);
    }
  });

  it("all roles can export xy_plots", () => {
    for (const role of ["admin", "design", "browse"] as const) {
      const ability = buildAbility(makeUser(role), POLICY);
      expect(ability.can("export", "xy_plots_export")).toBe(true);
    }
  });
});

// ─── buildAbility — Numeric user IDs ─────────────────────────────────────────

describe("buildAbility — numeric user IDs", () => {
  it("works with numeric user id", () => {
    const ability = buildAbility({ id: 42, role: "admin" }, POLICY);
    expect(ability.can("view", "web")).toBe(true);
  });
});
