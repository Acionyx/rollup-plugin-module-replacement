import { platform } from "os";

import slash from "slash";

const VOLUME = /^([A-Z]:)/i;
const IS_WINDOWS = platform() === "win32";

// Helper functions
const noop = () => null;
const matches = (pattern, importee) => {
  if (pattern instanceof RegExp) {
    return pattern.test(importee);
  }
  if (importee.length < pattern.length) {
    return false;
  }
  if (importee === pattern) {
    return true;
  }

  return importee.indexOf(pattern) === 0;
};

const normalizeId = id => {
  if ((IS_WINDOWS && typeof id === "string") || VOLUME.test(id)) {
    return slash(id.replace(VOLUME, ""));
  }
  return id;
};

export default function alias(options = {}) {
  const entries = options.entries ? options.entries : [];

  // No replacements?
  if (!entries || entries.length === 0) {
    return {
      resolveId: noop
    };
  }

  return {
    resolveId(importee, importer) {
      const importeeId = normalizeId(importee);
      const importerId = normalizeId(importer);

      // First match is supposed to be the correct one
      const matchedEntry = entries.find(entry =>
        matches(entry.find, importeeId)
      );
      if (!matchedEntry || !importerId) {
        return null;
      }

      let updatedId = null;

      if (typeof matchedEntry.replacement === "string") {
        updatedId = normalizeId(
          importeeId.replace(matchedEntry.find, matchedEntry.replacement)
        );
      } else if (typeof matchedEntry.replacement === "function") {
        updatedId = normalizeId(
          matchedEntry.replacement(importeeId, importerId)
        );
      }

      return updatedId;
    }
  };
}
