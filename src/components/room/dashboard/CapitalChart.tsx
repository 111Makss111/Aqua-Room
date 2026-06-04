import { buildChartModel } from './chartModel';
import type { DashboardSnapshot } from './types';
import layoutStyles from './DashboardCards.module.css';
import styles from './MarketVisuals.module.css';
import { PeriodTabs } from './PeriodTabs';

type CapitalChartProps = {
  activePeriod: string;
  onPeriodChange: (period: string) => void;
  snapshots: DashboardSnapshot[];
};

export function CapitalChart({
  activePeriod,
  onPeriodChange,
  snapshots,
}: CapitalChartProps) {
  const chart = buildChartModel(snapshots);

  return (
    <section className={layoutStyles.panelCard}>
      <div className={layoutStyles.cardHeader}>
        <div>
          <h2>Історія зростання вартості</h2>
          <p>Жива лінія з оновлень ринкових цін</p>
        </div>
        <PeriodTabs activePeriod={activePeriod} onChange={onPeriodChange} />
      </div>

      <div className={styles.chartBox}>
        <svg viewBox="0 0 640 210" role="img" aria-label="Графік капіталу">
          {chart.labels.map(label => (
            <g key={label.text}>
              <path
                className={styles.grid}
                d={`M${chart.frame.left} ${label.y}H${chart.frame.right}`}
              />
              <text className={styles.axisLabel} x="10" y={label.y + 4}>
                {label.text}
              </text>
            </g>
          ))}
          {chart.linePath ? (
            <>
              <path className={styles.fill} d={chart.areaPath} />
              <path className={styles.line} d={chart.linePath} />
              <circle
                className={styles.endpoint}
                cx={chart.lastPoint?.x ?? chart.frame.right}
                cy={chart.lastPoint?.y ?? chart.frame.top}
                r="4"
              />
            </>
          ) : null}
          {chart.xLabels.map(label => (
            <text className={styles.xLabel} key={`${label.text}-${label.x}`} x={label.x} y="198">
              {label.text}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
