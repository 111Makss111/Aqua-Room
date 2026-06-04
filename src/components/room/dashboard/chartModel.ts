import type { DashboardSnapshot } from './types';

type ChartPoint = {
  createdAt: string;
  x: number;
  y: number;
  value: number;
};

const frame = {
  bottom: 166,
  left: 66,
  right: 620,
  top: 26,
};

function formatAxisMoney(value: number) {
  return new Intl.NumberFormat('uk-UA', {
    compactDisplay: 'short',
    maximumFractionDigits: 1,
    notation: 'compact',
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatChartDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
}

function getRange(values: number[]) {
  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    const padding = Math.max(Math.abs(max) * 0.08, 5);

    min -= padding;
    max += padding;
  }

  const padding = (max - min) * 0.08;

  return {
    max: max + padding,
    min: Math.max(0, min - padding),
  };
}

function buildPoints(snapshots: DashboardSnapshot[]) {
  const values = snapshots.map(snapshot => snapshot.value);
  const range = getRange(values);
  const valueRange = Math.max(range.max - range.min, 1);

  return snapshots.map((snapshot, index) => {
    const progress = snapshots.length === 1 ? 1 : index / (snapshots.length - 1);
    const x = frame.left + progress * (frame.right - frame.left);
    const y =
      frame.bottom -
      ((snapshot.value - range.min) / valueRange) * (frame.bottom - frame.top);

    return { createdAt: snapshot.createdAt, x, y, value: snapshot.value };
  });
}

function buildSmoothPath(points: ChartPoint[]) {
  if (points.length < 2) {
    return '';
  }

  return points.slice(1).reduce<string>((path, point, index) => {
    const current = points[index];
    const previous = points[index - 1] ?? current;
    const next = points[index + 2] ?? point;
    const smoothing = 0.16;
    const cp1x = current.x + (point.x - previous.x) * smoothing;
    const cp1y = current.y + (point.y - previous.y) * smoothing;
    const cp2x = point.x - (next.x - current.x) * smoothing;
    const cp2y = point.y - (next.y - current.y) * smoothing;

    return `${path} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

export function buildChartModel(snapshots: DashboardSnapshot[]) {
  const points = buildPoints(snapshots);
  const values = snapshots.map(snapshot => snapshot.value);
  const range = getRange(values);
  const labels = [range.max, (range.max + range.min) / 2, range.min].map(value => ({
    text: formatAxisMoney(value),
    y:
      frame.bottom -
      ((value - range.min) / Math.max(range.max - range.min, 1)) *
        (frame.bottom - frame.top),
  }));
  const linePath = buildSmoothPath(points);
  const areaPath = linePath
    ? `${linePath} L ${frame.right} ${frame.bottom} L ${frame.left} ${frame.bottom} Z`
    : '';
  const middlePoint = points[Math.floor(points.length / 2)];
  const xLabels = [points[0], middlePoint, points[points.length - 1]]
    .filter(Boolean)
    .map(point => ({
      text: formatChartDate(point.createdAt),
      x: point.x,
    }))
    .filter(label => label.text);

  return {
    areaPath,
    frame,
    labels,
    lastPoint: points[points.length - 1],
    linePath,
    xLabels,
  };
}
