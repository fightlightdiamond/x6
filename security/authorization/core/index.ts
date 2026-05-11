// Core authorization layer — ability builder, policy definition, and error classes.
// Implemented in task 2.
export { buildAbility } from "./ability";
export { POLICY } from "./policy";
export {
  PermissionDeniedError,
  InvalidPolicyError,
  InvalidUserContextError,
} from "./errors";
// Extensibility — plugin system and policy merging (task 23).
export {
  createPluginRegistry,
  mergePluginPolicies,
  applyPlugins,
} from "./plugin";
export { mergePolicies } from "./policy-merger";
