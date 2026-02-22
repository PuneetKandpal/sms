/**
 * Utility functions for the diff engine
 */

/**
 * Deep comparison of two objects to find differences
 */
export function deepCompare(oldObj, newObj, path = "") {
  const differences = {};
  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {}),
  ]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const oldValue = oldObj?.[key];
    const newValue = newObj?.[key];

    if (oldValue === undefined && newValue !== undefined) {
      // New field added
      differences[key] = {
        type: "added",
        oldValue: undefined,
        newValue,
        path: currentPath,
      };
    } else if (oldValue !== undefined && newValue === undefined) {
      // Field removed
      differences[key] = {
        type: "removed",
        oldValue,
        newValue: undefined,
        path: currentPath,
      };
    } else if (
      typeof oldValue === "object" &&
      typeof newValue === "object" &&
      oldValue !== null &&
      newValue !== null &&
      !Array.isArray(oldValue) &&
      !Array.isArray(newValue)
    ) {
      // Nested objects - recurse
      const nestedDiff = deepCompare(oldValue, newValue, currentPath);
      if (Object.keys(nestedDiff).length > 0) {
        differences[key] = {
          type: "nested",
          oldValue,
          newValue,
          path: currentPath,
          nested: nestedDiff,
        };
      }
    } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      // Arrays - compare as strings for simplicity (can be enhanced)
      const oldStr = JSON.stringify(oldValue.sort());
      const newStr = JSON.stringify(newValue.sort());
      if (oldStr !== newStr) {
        differences[key] = {
          type: "changed",
          oldValue,
          newValue,
          path: currentPath,
        };
      }
    } else if (oldValue !== newValue) {
      // Simple value change
      differences[key] = {
        type: "changed",
        oldValue,
        newValue,
        path: currentPath,
      };
    } else {
      // No change - mark as same
      differences[key] = {
        type: "same",
        oldValue,
        newValue,
        path: currentPath,
      };
    }
  }

  return differences;
}

/**
 * Apply accepted changes to create merged object
 */
export function applyChanges(baseObj, changes, acceptedChanges) {
  const result = JSON.parse(JSON.stringify(baseObj || {}));

  function applyNested(obj, changesObj, acceptedObj, currentPath = "") {
    for (const [key, change] of Object.entries(changesObj)) {
      const changePath = currentPath ? `${currentPath}.${key}` : key;
      const isAccepted = acceptedObj[changePath];

      if (change.type === "added" && isAccepted === true) {
        obj[key] = change.newValue;
      } else if (change.type === "removed" && isAccepted === false) {
        // Keep the old value (reject removal)
        obj[key] = change.oldValue;
      } else if (change.type === "changed" && isAccepted === true) {
        obj[key] = change.newValue;
      } else if (change.type === "changed" && isAccepted === false) {
        obj[key] = change.oldValue;
      } else if (change.type === "nested") {
        if (!obj[key]) obj[key] = {};
        applyNested(obj[key], change.nested, acceptedObj, changePath);
      } else if (change.type === "same") {
        obj[key] = change.newValue;
      }
    }
  }

  applyNested(result, changes, acceptedChanges);
  return result;
}

/**
 * Get color class based on change type
 */
export function getChangeTypeClass(type) {
  switch (type) {
    case "added":
      return "bg-green-50 border-l-4 border-l-green-500";
    case "removed":
      return "bg-red-50 border-l-4 border-l-red-500";
    case "changed":
      return "bg-yellow-50 border-l-4 border-l-yellow-500";
    case "same":
      return "bg-gray-50 border-l-4 border-l-gray-300";
    case "nested":
      return "bg-blue-50 border-l-4 border-l-blue-500";
    default:
      return "bg-white";
  }
}

/**
 * Format value for display
 */
export function formatValue(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.length === 0 ? "[]" : JSON.stringify(value, null, 2);
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

/**
 * Check if a value should be displayed as expandable
 */
export function isExpandable(value) {
  return (
    value &&
    typeof value === "object" &&
    ((Array.isArray(value) && value.length > 0) ||
      (!Array.isArray(value) && Object.keys(value).length > 0))
  );
}
