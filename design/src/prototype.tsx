import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import type { DeskVariant } from './deskShell';
import { Desk } from './deskShell';
import { EmptyState } from './ui';
import { JUDGE, ORG_NAV } from './orgCommon';
import { FED, FED_NAV } from './fedCommon';
import { RefereeDesktop } from './DesktopReferee';
import { RefereeMobile } from './RefereeResponsive';
import { BracketMobile, BracketScreen } from './OrgBracket';
import { PlayersMobile, PlayersScreen } from './OrgPlayers';
import { TablesMobile, TablesScreen } from './OrgTables';
import { CalendarScreen } from './FederationFlow';
import { TournamentScreen } from './FedTournament';
import { JudgesScreen } from './FedJudges';
import { RatingScreen } from './FedRating';
import { FeesScreen } from './FedFees';

/* Живой прототип роли: одна оболочка, разделы переключаются кликом по сайдбару
   (на телефоне — по таб-бару). Экраны те же самые, что и в статичных
   флоу-бордах, — просто показываем по одному и даём по ним походить.

   Почему отдельные истории «Прототип», а не переделка бордов: борд показывает
   весь сценарий разом (это его смысл, см. README), а прототип — как продукт
   ощущается в руках. Одно другое не заменяет. */

type ScreenProps = { variant?: DeskVariant; onNavigate?: (item: string) => void };
type Section = { screen: (p: ScreenProps) => JSX.Element; note?: string };

/** раздел, который ещё не нарисован: показываем честную заглушку, а не пустоту */
function stub(title: string, text: string, nav: [React.ReactNode, string][], active: string, role: typeof JUDGE) {
  return function Stub({ variant, onNavigate }: ScreenProps) {
    return (
      <Desk variant={variant} title={title} sub="Раздел в проектировании" nav={nav} activeNav={active} onNavigate={onNavigate} role={role}>
        <EmptyState
          icon={<Settings2 size={22} />}
          title="Экран ещё не нарисован"
          text={text}
        />
      </Desk>
    );
  };
}

/* ── Главный судья ──────────────────────────────────────────── */

const ORG: Record<string, Section> = {
  'Обзор': { screen: RefereeDesktop },
  'Сетка': { screen: BracketScreen },
  'Игроки': { screen: PlayersScreen },
  'Столы': { screen: TablesScreen },
  'Настройки': {
    screen: stub('Настройки турнира', 'Здесь будут формат, расписание и правила пересчёта рейтинга.', ORG_NAV, 'Настройки', JUDGE),
  },
};

export function OrgPrototype({ variant = 'desktop' }: { variant?: DeskVariant }) {
  const [active, setActive] = useState('Обзор');
  const Screen = (ORG[active] ?? ORG['Обзор']).screen;
  return <Screen variant={variant} onNavigate={setActive} />;
}

const ORG_PHONE: Record<string, (p: { onNavigate?: (item: string) => void }) => JSX.Element> = {
  'Обзор': RefereeMobile,
  'Сводка': RefereeMobile,
  'Сетка': BracketMobile,
  'Игроки': PlayersMobile,
  'Столы': TablesMobile,
};

export function OrgPhonePrototype() {
  const [active, setActive] = useState('Обзор');
  const Screen = ORG_PHONE[active] ?? RefereeMobile;
  return <Screen onNavigate={setActive} />;
}

/* ── Федерация ──────────────────────────────────────────────── */

const FEDERATION: Record<string, Section> = {
  'Календарь': { screen: CalendarScreen },
  'Турниры': { screen: TournamentScreen },
  'Судьи': { screen: JudgesScreen },
  'Игроки': { screen: RatingScreen },
  'Взносы': { screen: FeesScreen },
};

export function FedPrototype({ variant = 'desktop' }: { variant?: DeskVariant }) {
  const [active, setActive] = useState('Календарь');
  const Screen = (FEDERATION[active] ?? FEDERATION['Календарь']).screen;
  return <Screen variant={variant} onNavigate={setActive} />;
}
