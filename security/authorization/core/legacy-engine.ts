/**
 * Legacy authorization engine — kept as a migration artifact for comparison tests.
 *
 * This file is a copy of the original `x6/security/authoriztion/engine.ts`
 * (note: the original folder name had a typo — "authoriztion" instead of "authorization").
 *
 * It is used ONLY by `migration.pbt.spec.ts` to verify that the new CASL engine
 * produces identical results to the legacy engine. Do NOT use this in production code.
 *
 * @deprecated Use `buildAbility` from `./ability` instead.
 * @see ./ability.ts
 * @see ../README.md
 */

function normalizePolicy(
  policy: Record<string, unknown>,
  role: string,
): Record<string, unknown> {
  // Convert role-actions arrays -> Sets for fast checks
  const out: Record<string, unknown> = {};

  for (const [resource, def] of Object.entries(policy || {})) {
    const node: Record<string, unknown> = {};
    const defObj = def as Record<string, unknown>;

    if (defObj["scopedBy"]) node["scopedBy"] = defObj["scopedBy"];

    if (defObj["any"]) {
      const anyDef = defObj["any"] as Record<string, string[]>;
      node["any"] = new Set(anyDef?.[role] || []);
    }

    // scoped resources: private/shared => owner/other => {role: actions}
    for (const scope of ["private", "shared"]) {
      if (!defObj[scope]) continue;
      const scopeDef = defObj[scope] as Record<
        string,
        Record<string, string[]>
      >;
      node[scope] = {
        owner: new Set(scopeDef?.["owner"]?.[role] || []),
        other: new Set(scopeDef?.["other"]?.[role] || []),
      };
    }

    out[resource] = node;
  }

  return out;
}

function isOwner(
  subject: Record<string, unknown> | null,
  ownerField: string,
  meId: unknown,
): boolean {
  const ownerValue = subject?.[ownerField];
  if (ownerValue == null) return false;
  return String(ownerValue) === String(meId);
}

/**
 * @deprecated Use `buildAbility` from `./ability` instead.
 *
 * createCan({ me, policy }) -> can(action, resource, subject?)
 * - action: 'view'|'create'|'edit'|'delete'|'export'
 * - resource: key trong policy (vd 'trends', 'trends_export', 'mimics', 'xy_plots')
 * - subject: bắt buộc nếu resource có scopedBy
 */
export function createCan({
  me,
  policy,
}: {
  me: { id: unknown; role: string };
  policy: Record<string, unknown>;
}) {
  const normalized = normalizePolicy(policy, me.role);

  return function can(
    action: string,
    resource: string,
    subject: Record<string, unknown> | null = null,
  ): boolean {
    const node = normalized?.[resource] as Record<string, unknown> | undefined;
    if (!node) return false;

    // 1) any-based resources (web, mimics, reports, *_export)
    if (node["any"]) return (node["any"] as Set<string>).has(action);

    // 2) scoped resources (trends, xy_plots)
    const scopedBy = node["scopedBy"] as
      | { typeField: string; ownerField: string }
      | undefined;
    if (!scopedBy || !subject) return false;

    const { typeField, ownerField } = scopedBy;
    const scope = subject?.[typeField] as string; // 'private' | 'shared'
    if (scope !== "private" && scope !== "shared") return false;

    const ctx = isOwner(subject, ownerField, me.id) ? "owner" : "other";
    const scopeNode = node[scope] as Record<string, Set<string>> | undefined;
    return scopeNode?.[ctx]?.has(action) || false;
  };
}
