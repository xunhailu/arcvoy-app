export default function BrandMark({ size = 18 }) {
  return (
    <span className="brand-mark" style={{ marginRight: 8, display: 'inline-flex', alignItems: 'center' }}>
      {/* 8-pointed star — sharp spiky emblem */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L13.34 8.77L19.07 4.93L15.23 10.66L22 12L15.23 13.34L19.07 19.07L13.34 15.23L12 22L10.66 15.23L4.93 19.07L8.77 13.34L2 12L8.77 10.66L4.93 4.93L10.66 8.77Z"/>
      </svg>
    </span>
  )
}
