import "./loading.css";

export default function Loading() {
  return (
    <div className="krabet-preloader" role="status" aria-live="polite" aria-label="Loading">
      <div className="krabet-preloader-inner">
        <img src="/KRABETS-LOGO.png" alt="Krabets logo" className="krabet-preloader-logo" draggable="false" />

        <div className="krabet-preloader-text-wrap">
          <span className="krabet-preloader-text">Loading</span>
          <span className="krabet-preloader-dots" aria-hidden="true">
            <span className="krabet-dot">.</span>
            <span className="krabet-dot">.</span>
            <span className="krabet-dot">.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
