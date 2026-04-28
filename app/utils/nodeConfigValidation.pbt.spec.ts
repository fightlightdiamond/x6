import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import {
  validateLabel,
  validateThreshold,
  validateOpenPercent,
  canAddThreshold,
  canRemoveThreshold,
  buildFormData,
  applyFormDataToNode,
  type NodeFormData,
} from "./nodeConfigValidation";

describe("Property-Based Tests: nodeConfigValidation", () => {
  /**
   * Property 1: Label validation rejects invalid inputs
   * Validates: Requirements 2.3, 2.4
   */
  it("Property 1 — Label validation rejects invalid inputs", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const trimmed = s.trim();
        const result = validateLabel(s);
        if (trimmed.length === 0 || trimmed.length > 32) {
          expect(result).not.toBeNull();
        } else {
          expect(result).toBeNull();
        }
      }),
    );
  });

  /**
   * Property 2: Threshold min < max invariant
   * Validates: Requirements 3.4, 3.5
   */
  it("Property 2 — Threshold min < max invariant", () => {
    fc.assert(
      fc.property(fc.float(), fc.float(), (min, max) => {
        const result = validateThreshold({
          min,
          max,
          color: "#fff",
          label: "x",
        });
        if (min >= max) expect(result).not.toBeNull();
        else expect(result).toBeNull();
      }),
    );
  });

  /**
   * Property 3: Threshold count bounds
   * Validates: Requirements 3.6, 3.7
   */
  it("Property 3 — Threshold count bounds", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (count) => {
        expect(canAddThreshold(count)).toBe(count < 5);
        expect(canRemoveThreshold(count)).toBe(count > 1);
      }),
    );
  });

  /**
   * Property 4: openPercent range invariant
   * Validates: Requirements 4.2
   */
  it("Property 4 — openPercent range invariant", () => {
    fc.assert(
      fc.property(fc.float({ min: -200, max: 200 }), (v) => {
        const result = validateOpenPercent(v);
        if (v < 0 || v > 100) expect(result).not.toBeNull();
        else expect(result).toBeNull();
      }),
    );
  });

  /**
   * Property 5: Form data round-trip (data-tag)
   * Validates: Requirements 1.5, 5.3
   */
  it("Property 5 — Form data round-trip (data-tag)", () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc
            .string({ minLength: 1, maxLength: 32 })
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
          value: fc.float(),
          unit: fc.string(),
          status: fc.constantFrom("normal", "warning", "alarm"),
        }),
        (nodeData) => {
          const form = buildFormData("data-tag", nodeData);
          expect(form.label).toBe(nodeData.label);
          expect(form.value).toBe(nodeData.value);
          expect(form.unit).toBe(nodeData.unit);
        },
      ),
    );
  });

  /**
   * Property 6: setData reflects in node
   * Validates: Requirements 5.1
   */
  it("Property 6 — setData reflects in node", () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 32 }),
          value: fc.float(),
        }),
        (formData: NodeFormData) => {
          let storedData: any = {};
          const mockNode = {
            setData: (data: any) => {
              storedData = data;
            },
            getData: () => storedData,
          };
          applyFormDataToNode(mockNode, formData);
          expect(mockNode.getData()).toMatchObject(formData);
        },
      ),
    );
  });
});
