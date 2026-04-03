import type { MinesHistoryEntry } from "@/features/mines/types/mines.types";
import { formatMoney, formatMultiplier } from "@/features/mines/utils/mines.utils";

type MinesHistoryProps = {
  history: MinesHistoryEntry[];
};

export function MinesHistory({ history }: MinesHistoryProps) {
  return (
    <section className="history-panel">
      <div className="section-intro">
        <h2>Recent Rounds</h2>
        <p>Latest win/loss/cashout results.</p>
      </div>

      {history.length === 0 ? (
        <div className="empty-panel">
          <i className="fa-regular fa-folder-open"></i>
          <span>No rounds yet.</span>
        </div>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Result</th>
                <th>Bet</th>
                <th>Multiplier</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span
                      className={`history-result ${
                        item.result === "Loss" ? "loss" : item.result === "Cashout" ? "cashout" : "win"
                      }`}
                    >
                      {item.result}
                    </span>
                  </td>
                  <td>${formatMoney(item.bet)}</td>
                  <td>{formatMultiplier(item.multiplier)}</td>
                  <td>${formatMoney(item.payout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
