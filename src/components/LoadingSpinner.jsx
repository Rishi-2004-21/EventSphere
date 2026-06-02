export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeMap = { sm: 20, md: 36, lg: 56 };
  const px = sizeMap[size] || 36;
  return (
    <div className="spinner-wrap">
      <div
        className="spinner"
        style={{ width: px, height: px, borderWidth: size === 'sm' ? 2 : 3 }}
      />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}
