export default function Loader({ label }) {
  return (
    <div className="loader-wrap">
      <span className="loader" />
      {label && <p className="loader-label">{label}</p>}
    </div>
  );
}
