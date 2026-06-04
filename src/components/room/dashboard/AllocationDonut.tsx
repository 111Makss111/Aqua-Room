import type { CSSProperties } from 'react';
import layoutStyles from './DashboardCards.module.css';
import styles from './MarketVisuals.module.css';

type AllocationItem = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type AllocationDonutProps = {
  items: AllocationItem[];
};

export function AllocationDonut({ items }: AllocationDonutProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const gradient = items
    .reduce(
      (state, item) => {
        const start = state.cursor;
        const end = start + (item.value / Math.max(total, 1)) * 100;

        return {
          cursor: end,
          parts: [...state.parts, `${item.color} ${start}% ${end}%`],
        };
      },
      { cursor: 0, parts: [] as string[] }
    )
    .parts.join(', ');

  return (
    <section className={layoutStyles.panelCard}>
      <div className={layoutStyles.cardHeader}>
        <div>
          <h2>Розподіл за класами активів</h2>
          <p>Поточна диверсифікація</p>
        </div>
      </div>

      <div className={styles.allocationGrid}>
        <div
          className={styles.donut}
          style={{ '--allocation': `conic-gradient(${gradient})` } as CSSProperties}
          aria-hidden="true"
        />
        <div className={styles.legend}>
          {items.map(item => (
            <div key={item.id}>
              <span style={{ background: item.color }} />
              <strong>{item.label}</strong>
              <small>{((item.value / Math.max(total, 1)) * 100).toFixed(0)}%</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
