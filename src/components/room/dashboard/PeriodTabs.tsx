import styles from './DashboardCards.module.css';

const periods = ['1 місяць', '6 місяців', '1 рік', '5 років', '10 років'];

type PeriodTabsProps = {
  activePeriod: string;
  onChange: (period: string) => void;
};

export function PeriodTabs({ activePeriod, onChange }: PeriodTabsProps) {
  return (
    <div className={styles.periodTabs} aria-label="Період графіка">
      {periods.map(period => (
        <button
          className={period === activePeriod ? styles.active : ''}
          key={period}
          type="button"
          onClick={() => onChange(period)}
        >
          {period}
        </button>
      ))}
    </div>
  );
}
