const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

// Saves a buffer under uploads/<bucket>/<relativePath> and returns the URL path
// (e.g. /uploads/publications/<staffId>/<file>) for buckets served statically —
// used where the file must be reachable without authentication (e.g. the public
// external assessor portal viewing a candidate's publications).
const savePublicFile = (bucket, relativePath, buffer) => {
  const fullPath = path.join(UPLOADS_ROOT, bucket, relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, buffer);
  // Percent-encode each path segment (filenames often contain spaces) so the
  // returned string is a valid, fetchable URL — the disk path itself stays
  // unencoded since the filesystem doesn't care about spaces.
  const encodedPath = relativePath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/');
  return `/uploads/${bucket}/${encodedPath}`;
};

const deletePublicFile = (bucket, relativePath) => {
  const fullPath = path.join(UPLOADS_ROOT, bucket, relativePath);
  fs.unlink(fullPath, () => {}); // best-effort — ignore errors (e.g. already gone)
};

// Saves a buffer under a private (non-statically-served) bucket. Retrieval must
// go through an authenticated route that streams the file after a role check.
const savePrivateFile = (bucket, relativePath, buffer) => {
  const fullPath = path.join(UPLOADS_ROOT, bucket, relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, buffer);
  return relativePath;
};

const getPrivateFilePath = (bucket, relativePath) => path.join(UPLOADS_ROOT, bucket, relativePath);

module.exports = { UPLOADS_ROOT, savePublicFile, deletePublicFile, savePrivateFile, getPrivateFilePath };
