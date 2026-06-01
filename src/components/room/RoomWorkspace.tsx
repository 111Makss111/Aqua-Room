'use client';

import { useState } from 'react';

const workspaceSections = [
  {
    id: 'purchased',
    label: 'Придбане',
    title: 'Придбане',
    note: 'Таблиці',
    description:
      'Поки переносимо структуру з Excel як є. Далі окремо вирішимо, що вводити руками, а що рахувати або підтягувати автоматично.',
  },
  {
    id: 'notes',
    label: 'Нотатки',
    title: 'Нотатки',
    note: 'Швидкі записи',
    description:
      'Місце для коротких приватних записів без зайвого шуму на головному екрані кабінету.',
  },
  {
    id: 'access',
    label: 'Доступ',
    title: 'Доступ',
    note: 'Захист',
    description:
      'Тут пізніше буде другий шар перевірки після Google-входу.',
  },
  {
    id: 'archive',
    label: 'Архів',
    title: 'Архів',
    note: 'Пізніше',
    description:
      'Спокійне місце для старих записів і матеріалів, які не мають заважати щоденній роботі.',
  },
];

const purchaseSaleColumns = [
  'Тікер',
  'Країна domicile / company incorporation',
  'Дата купівлі',
  'Кількість',
  'Ціна за 1 шт. $',
  'Ціна за всі в $',
  'НБП -1 день',
  'Ціна за всі в zł',
  'Комісія в zł',
  'Комісія в $',
  'НБП -1 день для комісії',
  'Ціна + комісія в zł',
  'Тікер',
  'Дата продажу',
  'Кількість',
  'Ціна за 1 шт.',
  'Ціна за всі',
];

const dividendColumns = [
  'Тікер',
  'Дата отримання',
  'Дивіденди в $ Brutto',
  'Країна domicile / company incorporation',
  'Інша валюта',
  'Дивіденди в PLN Brutto',
  'НБП -1 день',
  'Податок 19% PLN',
  'Реально % стягнено',
  'Стягнено в США 15% $',
  'Стягнено в США 15% в zł',
  'Різниця яку потрібно доплатити',
  'Нетто США -15%',
  'Розрахунок Trading 212',
  'Дивіденди в $ Brutto',
  'Дивіденди в $ Netto',
];

function ExcelLikeTable({
  columns,
  title,
}: {
  columns: string[];
  title: string;
}) {
  return (
    <section className="room-table-card" aria-label={title}>
      <div className="room-table-header">
        <h3>{title}</h3>
        <span>{columns.length} полів</span>
      </div>

      <div className="room-table-scroll">
        <table className="room-excel-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {columns.map(column => (
                <td key={column}>—</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PurchasedWorkspace() {
  return (
    <div className="room-tables-stack">
      <ExcelLikeTable columns={purchaseSaleColumns} title="Купівля / продаж" />
      <ExcelLikeTable columns={dividendColumns} title="Дивіденди" />
    </div>
  );
}

export function RoomWorkspace() {
  const [activeId, setActiveId] = useState(workspaceSections[0].id);
  const activeSection =
    workspaceSections.find(section => section.id === activeId) ?? workspaceSections[0];

  return (
    <section className="room-workspace" aria-label="Меню кабінету">
      <nav className="room-menu" aria-label="Розділи кабінету">
        {workspaceSections.map(section => (
          <button
            className={`room-menu-button ${section.id === activeId ? 'is-active' : ''}`}
            key={section.id}
            type="button"
            aria-pressed={section.id === activeId}
            onClick={() => setActiveId(section.id)}
          >
            <span>{section.label}</span>
            <small>{section.note}</small>
          </button>
        ))}
      </nav>

      <div className="room-work-panel">
        <p className="room-panel-kicker">{activeSection.note}</p>
        <h2>{activeSection.title}</h2>
        <p>{activeSection.description}</p>

        {activeSection.id === 'purchased' ? (
          <PurchasedWorkspace />
        ) : (
          <div className="room-empty-state">
            <span>Місце під функціонал</span>
            <strong>{activeSection.label}</strong>
            <p>Наступним кроком наповнимо цю секцію реальним інструментом.</p>
          </div>
        )}
      </div>
    </section>
  );
}
