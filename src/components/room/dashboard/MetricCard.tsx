import styles from './DashboardCards.module.css';

type MetricCardProps = {
  label: string;
  value: string;
  tone?: 'green' | 'orange';
  hint: string;
};

export function MetricCard({ label, value, tone = 'green', hint }: MetricCardProps) {
  return (
    <article className={styles.metricCard}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={styles[tone]}>{hint}</small>
    </article>
  );
}
