import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Bell, Check, Copy, Dices, Play, RotateCcw } from 'lucide-react';
import { EDITABLE, EDITABLE_GROUPS, THEMES, applyTheme } from './themes';
import { CUSTOM_ID, clearCustom, loadCustom, resolveColor, saveCustom, type Seeds } from './custom';
import { Avatar, Badge, Button, Card, Pill, Stat, Stats } from '../ui';
import './builder.css';

/* Конструктор темы: 33 цвета системы, каждый — своей пипеткой и полем hex.
   Правка сразу видна на образце справа; «Применить» сохраняет палитру как тему
   «Свой цвет» — после этого её можно выбрать в тулбаре и походить с ней по
   любым экранам Storybook. Палитра лежит в localStorage, поэтому переживает
   перезагрузку.

   Значения читаются из живого браузера (`resolveColor`), поэтому конструктор
   всегда стартует с того, что реально нарисовано, — с базовой темы или с той,
   что выбрана в тулбаре. */

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);
const rnd = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

function Sample() {
  return (
    <div className="ui-canvas" style={{ display: 'grid', gap: 11 }}>
      <Stats>
        <Stat value="128" label="Участников" />
        <Stat value="12" label="Идут" tone="b" />
        <Stat value="8" label="Ждут" tone="g" />
        <Stat value="2" label="Отказ" tone="r" />
      </Stats>
      <Card live>
        <div className="pcard">
          <Avatar src="https://randomuser.me/api/portraits/men/32.jpg" />
          <span className="who">
            <div className="nm">Смагулов А.</div>
            <div className="mt">Стол 3 · 2 : 1</div>
          </span>
          <span className="rt">
            <div className="k">Рейтинг</div>
            <div className="v">2 148</div>
          </span>
        </div>
      </Card>
      <div className="ui-row">
        <Pill tone="live" dot>ИДЁТ</Pill>
        <Pill tone="reg">ЗАЯВКА</Pill>
        <Pill tone="wait">ЖДЁТ</Pill>
        <Pill tone="bad">ОТКАЗ</Pill>
        <Badge tone="win" />
        <Badge tone="loss" />
      </div>
      <div className="ui-row">
        <Button size="sm">Вызвать</Button>
        <Button variant="success" size="sm">Подтвердить</Button>
        <Button variant="broadcast" size="sm" icon={<Play size={13} />}>Эфир</Button>
        <Button variant="ghost" size="sm" icon={<Bell size={13} />}>Напомнить</Button>
      </div>
    </div>
  );
}

const page: CSSProperties = { background: 'var(--c-bg)', color: 'var(--c-text)', padding: 32, display: 'grid', gap: 22 };

export function ThemeBuilder() {
  const boxRef = useRef<HTMLDivElement>(null);
  /** что накрутили: только изменённые поля (пустое — берём из активной темы) */
  const [seeds, setSeeds] = useState<Seeds>(() => loadCustom());
  /** значения «как есть» для полей, которые не трогали */
  const [base, setBase] = useState<Seeds>({});
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState('');

  // стартуем с того, что реально нарисовано сейчас (базовая тема или выбранная в тулбаре)
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const next: Seeds = {};
    for (const f of EDITABLE) next[f.key] = resolveColor(f.key, el);
    setBase(next);
  }, []);

  // живой предпросмотр: накрученное кладём прямо на коробку с образцом
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    for (const f of EDITABLE) {
      if (seeds[f.key]) el.style.setProperty(f.key, seeds[f.key]);
      else el.style.removeProperty(f.key);
    }
  }, [seeds]);

  const value = (key: string) => seeds[key] ?? base[key] ?? '#000000';
  const set = (key: string, v: string) => {
    setApplied(false);
    setSeeds((s) => ({ ...s, [key]: v }));
  };

  const full: Seeds = useMemo(() => {
    const out: Seeds = {};
    for (const f of EDITABLE) out[f.key] = value(f.key);
    return out;
  }, [seeds, base]);

  const apply = () => {
    saveCustom(seeds);
    applyTheme(CUSTOM_ID);
    setApplied(true);
  };
  const reset = () => {
    setSeeds({});
    clearCustom();
    setApplied(false);
  };
  const randomize = () => {
    const accent = rnd();
    setSeeds((s) => ({ ...s, '--seed-accent': accent, '--seed-accent-2': rnd(), '--seed-accent-3': rnd() }));
    setApplied(false);
  };

  const copy = async (what: 'ts' | 'css') => {
    const changed = Object.entries(seeds);
    const body = (changed.length ? changed : Object.entries(full))
      .map(([k, v]) => (what === 'ts' ? `    '${k}': '${v}',` : `  ${k}: ${v};`))
      .join('\n');
    const text =
      what === 'ts'
        ? `{ id: 'my-theme', label: 'Моя тема', group: 'Тёмные', note: '…',\n  seeds: {\n${body}\n  } },`
        : `:root,\n.ui-theme {\n${body}\n}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(''), 1600);
    } catch {
      // буфер недоступен (нет https / прав) — показываем текст, чтобы скопировать руками
      // eslint-disable-next-line no-alert
      window.prompt('Скопируйте вручную:', text);
    }
  };

  const changedCount = Object.keys(seeds).length;

  return (
    <div style={page}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>Конструктор темы</h1>
        <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.55, maxWidth: 820 }}>
          Каждый цвет системы — отдельным полем: пипетка или hex вручную. Правка сразу видна на образце справа.
          «Применить» сохраняет палитру как тему <b>«Свой цвет»</b> — после этого выберите её в тулбаре «Тема» и
          ходите с ней по любым экранам: макетам, прототипу, витринам компонентов. Палитра живёт в браузере, так
          что переживает перезагрузку; «Сбросить» возвращает всё к активной теме.
        </p>
        <div className="ui-row">
          <Button size="sm" onClick={apply} icon={applied ? <Check size={14} /> : undefined}>
            {applied ? 'Применено' : 'Применить ко всему Storybook'}
          </Button>
          <Button size="sm" variant="ghost" onClick={randomize} icon={<Dices size={14} />}>
            Случайные акценты
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy('ts')} icon={<Copy size={14} />}>
            {copied === 'ts' ? 'Скопировано' : 'Скопировать для themes.ts'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy('css')} icon={<Copy size={14} />}>
            {copied === 'css' ? 'Скопировано' : 'Скопировать как CSS'}
          </Button>
          <Button size="sm" variant="quiet" onClick={reset} icon={<RotateCcw size={14} />}>
            Сбросить
          </Button>
          <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>
            изменено полей: <b>{changedCount}</b> из {EDITABLE.length}
          </span>
        </div>
      </header>

      <div className="tb-layout">
        <div className="tb-fields">
          {EDITABLE_GROUPS.map((group) => (
            <section key={group} className="tb-group">
              <h2>{group}</h2>
              <div className="tb-grid">
                {EDITABLE.filter((f) => f.group === group).map((f) => (
                  <label key={f.key} className={'tb-field' + (seeds[f.key] ? ' changed' : '')}>
                    <input
                      type="color"
                      value={isHex(value(f.key)) ? value(f.key) : '#000000'}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                    <span className="tb-meta">
                      <span className="tb-label">{f.label}</span>
                      <input
                        className="tb-hex"
                        value={value(f.key)}
                        spellCheck={false}
                        onChange={(e) => set(f.key, e.target.value.trim())}
                      />
                      <span className="tb-key">{f.key}</span>
                      {f.hint && <span className="tb-hint">{f.hint}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="tb-preview">
          <div className="tb-sticky">
            <div className="ui-label" style={{ color: 'var(--c-text-3)', marginBottom: 8 }}>Образец</div>
            <div ref={boxRef} className="ui-theme">
              <Sample />
            </div>
            <div className="tb-note">
              Здесь показан кусок интерфейса с накрученными цветами. Чтобы увидеть палитру на настоящих экранах,
              нажмите «Применить» и выберите тему «Свой цвет» в тулбаре.
            </div>
            <div className="tb-note">
              Готовые темы для сравнения: {THEMES.filter((t) => t.group !== 'Свои').length} штук в истории
              «Дизайн-система → Цвета».
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
