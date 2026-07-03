const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const WelcomeBanner = ({ name, subtitle, children }) => (
  <div style={{
    background: 'var(--role-banner-bg)',
    borderRadius: 'var(--radius)',
    padding: '2rem',
    marginBottom: '2rem',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
  }}>
    {/* Decorative glows */}
    <div style={{
      position: 'absolute', right: -60, top: -60,
      width: 240, height: 240, borderRadius: '50%',
      background: 'var(--role-accent)', opacity: 0.14, filter: 'blur(60px)',
      pointerEvents: 'none',
    }} />
    <div style={{
      position: 'absolute', right: 100, bottom: -80,
      width: 180, height: 180, borderRadius: '50%',
      background: 'var(--role-accent)', opacity: 0.08, filter: 'blur(40px)',
      pointerEvents: 'none',
    }} />

    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '1rem',
      position: 'relative',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: 'var(--role-accent)', fontSize: '0.875rem',
          fontWeight: 600, marginBottom: '0.375rem', letterSpacing: '0.02em',
        }}>
          {getGreeting()} 👋
        </p>
        <h1 style={{
          fontSize: 'clamp(1.375rem, 3vw, 1.875rem)', fontWeight: 800,
          color: '#ffffff', lineHeight: 1.2, marginBottom: '0.5rem',
        }}>
          {name}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9375rem' }}>
          {subtitle}
        </p>
        {children && <div style={{ marginTop: '1.25rem' }}>{children}</div>}
      </div>

      <div style={{
        width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
        background: 'var(--role-gradient)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', fontWeight: 800, color: '#fff',
        border: '3px solid rgba(255,255,255,0.18)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}>
        {getInitials(name)}
      </div>
    </div>
  </div>
);

export default WelcomeBanner;
