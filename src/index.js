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

export default function replacement(
  options = { entries: [], customResolver: null }
) {
  // No replacements?
  if (!options.entries || options.entries.length === 0) {
    return {
      resolveId: noop
    };
  }

  return {
    resolveId(importee, importer) {
      const importeeId = normalizeId(importee);
      const importerId = normalizeId(importer);

      // First match is supposed to be the correct one
      const matchedEntry = options.entries.find(entry =>
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

      let customResolver = null;
      if (typeof matchedEntry.customResolver === "function") {
        customResolver = matchedEntry.customResolver;
      } else if (
        typeof matchedEntry.customResolver === "object" &&
        typeof matchedEntry.customResolver.resolveId === "function"
      ) {
        customResolver = options.customResolver.resolveId;
      } else if (typeof options.customResolver === "function") {
        customResolver = options.customResolver;
      } else if (
        typeof options.customResolver === "object" &&
        typeof options.customResolver.resolveId === "function"
      ) {
        customResolver = options.customResolver.resolveId;
      }

      if (customResolver) {
        return customResolver(updatedId, importerId);
      }

      return updatedId;
    }
  };
}
