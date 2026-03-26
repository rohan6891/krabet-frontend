import type { DashboardWin } from "@/features/dashboard/types/dashboard.types";

type RecentWinsStripProps = {
  wins: DashboardWin[];
};

export function RecentWinsStrip({ wins }: RecentWinsStripProps) {
  if (!wins.length) {
    return null;
  }

  return (
    <section className="wins-strip">
      <div className="wins-strip-label">RECENT BIG WINS</div>

      <div className="wins-strip-track">
        {wins.map((item) => (
          <div className="wins-strip-item" key={item.id}>
            <a href="#" className="wins-inline-group">
              <span className="wins-amount">+{item.payout} {item.currency}</span>
              <span className="wins-inline-icon">
                <i className="fa-solid fa-coins" aria-hidden="true"></i>
              </span>
              <span className="wins-user-icon">
                <i className="fa-solid fa-user" aria-hidden="true"></i>
              </span>
              <span className="wins-user">{item.username}</span>
            </a>

            <a href="#" className="wins-inline-group">
              <span className="wins-prize">{item.game_name}</span>
              <span className="wins-inline-icon">
                <i className="fa-solid fa-gamepad" aria-hidden="true"></i>
              </span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
