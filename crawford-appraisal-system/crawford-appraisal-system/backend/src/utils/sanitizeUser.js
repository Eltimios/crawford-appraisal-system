// Strips password_hash before a user row is ever sent to the client.
const stripPasswordHash = (user) => {
  if (!user) return user;
  const { password_hash, ...safe } = user;
  return safe;
};

const stripPasswordHashMany = (users) => (users || []).map(stripPasswordHash);

module.exports = { stripPasswordHash, stripPasswordHashMany };
