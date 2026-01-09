'use client';

type Result = {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  reviews: number;
  status?: 'active' | 'preview';
  imageUrl?: string;
  website?: string;
  bookingUrl?: string;
  phone?: string;
};

export default function ResultresultCard({ result }: { result: Result }) {
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
  } = result;

  return (
    <div style={styles.card}>
      <img
        src={imageUrl || `/images/categories/${category.toLowerCase()}.jpg`}
        alt={name}
        style={styles.image}
      />

      <div style={styles.body}>
        <h3 style={styles.title}>{name}</h3>
        <p style={styles.meta}>
          {category} · {city}
        </p>

        <p style={styles.rating}>
          ⭐ {rating} ({reviews})
        </p>

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
  title: { margin: 0, fontSize: 18 },
  meta: { opacity: 0.7, margin: '4px 0' },
  rating: { margin: '6px 0' },
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
