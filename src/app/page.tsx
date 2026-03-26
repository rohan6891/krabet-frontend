import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Krabets</h1>
          <p>Landing page for visitors. Sign in to access your dashboard and wallet.</p>
        </div>

        <div className={styles.ctas}>
          <Link href="/auth" className={styles.primary}>
            Sign In
          </Link>
          <Link href="/dashboard" className={styles.secondary}>
            Open Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
