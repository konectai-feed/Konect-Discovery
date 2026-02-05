'use client';
import type { Result } from "@/app/types/results";
export default function ResultCard({ result }: { result: Result }) {
  const {
    name,
    category,
    city,
    rating,
    reviews,
    status,
    imageUrl,
    website,
    bookingUrl,
    phone,
    konect_rank,
    trust_score,
    reason_codes,
  } = result;

  return (
    <div style={styles.card}>
      <img
        src={imageUrl || `/images/categories/${category.toLowerCase()}.jpg`}
        alt={name}
        style={styles.image}
      />

      <div style={styles.body}>
        <div style={styles.header}>
          <h3 style={styles.title}>{name}</h3>
          {konect_rank !== undefined && (
            <div style={styles.rankBadge}>
              <span style={styles.rankLabel}>Rank</span>
              <span style={styles.rankValue}>{konect_rank.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p style={styles.meta}>
          {category} · {city}
        </p>

        <div style={styles.scores}>
          <p style={styles.rating}>
            ⭐ {rating} ({reviews})
          </p>
          {trust_score !== undefined && (
            <span style={styles.trustScore}>
              Trust: {trust_score.toFixed(1)}
            </span>
          )}
        </div>

        {reason_codes && reason_codes.length > 0 && (
          <div style={styles.reasons}>
            {reason_codes.slice(0, 3).map((code, idx) => (
              <span key={idx} style={styles.reasonBadge}>
                {code}
              </span>
            ))}
          </div>
        )}

        {status && (
          <span style={status === 'active' ? styles.active : styles.preview}>
            {status.toUpperCase()}
          </span>
        )}

        <div style={styles.actions}>
          {bookingUrl && (
            <a href={bookingUrl} target="_blank" style={styles.primary}>
              Book Now
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} style={styles.secondary}>
              Call
            </a>
          )}
          {website && (
            <a href={website} target="_blank" style={styles.link}>
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    gap: 16,
    padding: 16,
    background: '#111',
    borderRadius: 10,
    marginBottom: 14,
  },
  image: {
    width: 120,
    height: 120,
    objectFit: 'cover',
    borderRadius: 8,
  },
  body: { flex: 1 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: { margin: 0, fontSize: 18 },
  rankBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#7c3aed',
    borderRadius: 6,
    padding: '4px 8px',
    minWidth: 50,
  },
  rankLabel: {
    fontSize: 10,
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  rankValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  meta: { opacity: 0.7, margin: '4px 0' },
  scores: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '6px 0',
  },
  rating: { margin: 0 },
  trustScore: {
    fontSize: 12,
    color: '#00e676',
    background: 'rgba(0, 230, 118, 0.15)',
    padding: '2px 8px',
    borderRadius: 4,
  },
  reasons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    margin: '8px 0',
  },
  reasonBadge: {
    fontSize: 11,
    background: '#222',
    color: '#aaa',
    padding: '3px 8px',
    borderRadius: 4,
    border: '1px solid #333',
  },
  active: { color: '#00e676', fontSize: 12 },
  preview: { color: '#ffca28', fontSize: 12 },
  actions: { display: 'flex', gap: 10, marginTop: 10 },
  primary: {
    background: '#7c3aed',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 6,
    textDecoration: 'none',
  },
  secondary: {
    background: '#222',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 6,
    textDecoration: 'none',
  },
  link: {
    color: '#aaa',
    fontSize: 14,
    alignSelf: 'center',
  },
};
