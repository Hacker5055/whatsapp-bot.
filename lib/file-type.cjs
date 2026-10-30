// CommonJS compatibility wrapper for the ESM-only, current file-type release.
module.exports = {
  fromBuffer: async (...args) => (await import('file-type')).fileTypeFromBuffer(...args),
  fileTypeFromBuffer: async (...args) => (await import('file-type')).fileTypeFromBuffer(...args)
};
