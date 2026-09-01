/* Библиотека примитивов дизайн-системы ФНТ РК — единая точка входа.

   Разделы:
   • `brand`    — Brand: знак ФНТ РК со словесной частью, шапка любой роли.
   • `base`     — стекло и статусы: Button, Card, Panel, Pill, Badge, Stat,
                  Avatar, IconButton, SectionTitle, Segmented, Field.
   • `forms`    — Input, SearchField, Textarea, Select, Checkbox, Radio,
                  RadioGroup, Switch, Stepper.
   • `nav`      — Tabs, Nav/NavItem, Breadcrumbs, Pagination, Steps.
   • `data`     — Table, RowItem, KeyValue, EmptyState, Progress, Skeleton,
                  Spinner, Divider, Timeline, Tooltip.
   • `feedback` — Notice, Toast, Modal.
   • `domain`   — турнирные: MatchRow, TableTile, RatingDelta, SeedBadge,
                  ScoreInput, RankRow.

   Правила те же: цвет и форма — только токены (`src/theme/tokens.css`), поэтому
   всё перекрашивается переключателем «Тема» в тулбаре. Витрины — истории
   «Дизайн-система → Компоненты». */

export * from '@/shared/kit/brand';
export * from './base';
export * from './forms';
export * from './nav';
export * from './data';
export * from './feedback';
export * from './domain';
