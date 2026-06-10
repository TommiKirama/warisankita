import { useNavigate } from "react-router-dom";

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  bell?: boolean;
  /** 0–100 progress bar shown under the bar (drafter steps). */
  progress?: number;
}

export function AppBar({ title, subtitle, back, bell, progress }: Props) {
  const navigate = useNavigate();
  return (
    <header className="appbar col" style={{ alignItems: "stretch" }}>
      <div className="row gap12">
        {back && (
          <button className="back" aria-label="Back" onClick={() => navigate(-1)}>
            ‹
          </button>
        )}
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="sub">{subtitle}</div>}
        </div>
        {bell && <span className="bell">🔔</span>}
      </div>
      {typeof progress === "number" && (
        <div className="progressbar mt8">
          <i style={{ width: `${progress}%` }} />
        </div>
      )}
    </header>
  );
}
