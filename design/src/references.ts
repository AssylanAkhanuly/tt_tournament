/* Референсы к локапу ФНТ РК — единый источник для страницы Storybook
   («Дизайн-система → Референсы») и для `design/REFERENCES.md`.

   Собрано 12.08.2026: 12 запросов в Mobbin, 82 экрана. Смотрели один вопрос —
   как продукты показывают чужой подробный герб там, где на него отведено 30 px.
   Ровно наш случай: знак федерации вертикальный, с лентой орнамента и мелкой
   надписью TTFRK.

   Счётчики на странице считаются из этих данных, а не проставлены руками, —
   иначе «82 экрана» разъедется с фактическим списком при первой же правке. */

import fedTtfrk from './assets/refs/fed-ttfrk.jpg';
import fedEttu from './assets/refs/fed-ettu.jpg';
import fedAttu from './assets/refs/fed-attu.jpg';
import fedOlympicKz from './assets/refs/fed-olympic-kz.jpg';
import fedWorldAthletics from './assets/refs/fed-worldathletics.jpg';
import fedUefa from './assets/refs/fed-uefa.jpg';
import fedWorldAquatics from './assets/refs/fed-worldaquatics.jpg';
import fedFie from './assets/refs/fed-fie.jpg';
import wttTicker from './assets/refs/wtt-ticker.jpg';
import myTischtennis from './assets/refs/mytischtennis.jpg';

const S = (id: string) => `https://mobbin.com/screens/${id}`;
const SEC = (id: string) => `https://mobbin.com/sites/sections/${id}`;

/* Сайты федераций — второй источник, уже не Mobbin.

   В Mobbin сайтов настоящих спортивных федераций нет вовсе, и первый заход это
   пропустил: все 82 экрана были оттуда, то есть из мира продуктовых интерфейсов,
   а не из мира федераций. Здесь снято прямо с живых сайтов — картинки наши
   собственные, шапка каждого сайта на 1440 px.

   Снято 12.08.2026. Сайты меняются, поэтому это снимок на дату, а не вечная
   истина; ссылка ведёт на оригинал. */
export type SiteRef = {
  name: string;
  url: string;
  img: string;
  /** Что именно взяли с этого сайта */
  note: string;
};

export const SITE_REFS: SiteRef[] = [
  {
    name: 'ФНТ РК — сама федерация',
    url: 'https://ttfrk.kz/',
    img: fedTtfrk,
    note:
      'Главная находка. Федерация уже показывает свой знак БЕЛОЙ ВЫВОРОТКОЙ на тёмном — ровно тем ' +
      'вариантом, которого у нас в комплекте нет. Рядом название в узком тяжёлом прописном в ' +
      'четыре строки. То есть выворотка не наша выдумка «по референсам», а то, чем федерация ' +
      'пользуется прямо сейчас.',
  },
  {
    name: 'World Athletics',
    url: 'https://worldathletics.org/',
    img: fedWorldAthletics,
    note:
      'Образцовая верхняя панель: знак ~28 px слева, рядом словесная часть тяжёлым узким ' +
      'прописным в две строки, дальше сразу разделы. Ровно та однострочная тихая подача, к ' +
      'которой мы пришли в шапке продукта.',
  },
  {
    name: 'ETTU — европейская федерация',
    url: 'https://www.ettu.org/',
    img: fedEttu,
    note: 'Континентальная федерация: герб слева в шапке, плотное меню разделов справа.',
  },
  {
    name: 'ATTU — азиатская федерация',
    url: 'https://asia.ittf.com/',
    img: fedAttu,
    note: 'Наш континент. Герб и название вместе, поверх широкого баннера соревнования.',
  },
  {
    name: 'НОК Казахстана',
    url: 'https://olympic.kz/',
    img: fedOlympicKz,
    note:
      'Соседняя по смыслу организация в той же стране: как выглядит государственная спортивная ' +
      'символика в вебе на кириллице.',
  },
  {
    name: 'UEFA',
    url: 'https://www.uefa.com/',
    img: fedUefa,
    note: 'Крупная федерация с большим продуктом: знак в шапке минимальный, всё место отдано контенту.',
  },
  {
    name: 'World Aquatics',
    url: 'https://www.worldaquatics.com/',
    img: fedWorldAquatics,
    note: 'Свежий ребрендинг федерации: знак и словесная часть собраны в один компактный локап.',
  },
  {
    name: 'FIE — фехтование',
    url: 'https://fie.org/',
    img: fedFie,
    note: 'Федерация сопоставимого с нами размера — видно, как подаётся герб без большого бюджета.',
  },
];

/* Сняли двенадцать сайтов, в набор попали восемь. Выпали не по вкусу, а
   технически: ITTF и BWF закрыты защитой от ботов и вместо страницы отдают
   «Performing security verification» и «Sorry, you have been blocked», FIBA
   вернула пустую страницу. Обидно, что среди них ITTF — головная федерация
   нашего вида спорта; открыть её глазами можно, автоматически снять нельзя. */
export const BLOCKED_SITES = [
  { name: 'ITTF', url: 'https://www.ittf.com/', why: 'проверка Cloudflare вместо страницы' },
  { name: 'BWF', url: 'https://bwfbadminton.com/', why: '«Sorry, you have been blocked»' },
  { name: 'FIBA', url: 'https://www.fiba.basketball/', why: 'пустая страница' },
];

/* ── Второй заход, 22.08.2026: как показывают МАТЧ ──────────────────
   Вопрос другой, чем в августовском заходе по шапкам: не «как подают знак», а
   «как устроен блок про мой ближайший матч» — тот самый герой Э14.1 у варианта
   А. Смотрели там, где этот блок есть по-настоящему: мировой тур настольного
   тенниса, порталы вида спорта, системы проведения турниров. */
export const MATCH_REFS: SiteRef[] = [
  {
    name: 'WTT — бегущая строка матчей',
    url: 'https://www.worldtabletennis.com/',
    img: wttTicker,
    note:
      'Главная находка и единственный референс ровно про наш блок из мира настольного тенниса. ' +
      'Карточка матча ~410×130 px держит больше, чем наш герой на всю ширину: строка круга ' +
      '(«Women\'s Singles - Group 8»), под ней МЕСТО И СТОЛ ОДНОЙ СТРОКОЙ через вертикаль ' +
      '(«TT DOME HEYSE25 | Table 2»), дальше две строки игроков в общей колонке — флаг, фамилия, ' +
      'крупный счёт по партиям и рядом мелкий ряд по геймам (11 11 9 12 11). Победитель помечен ' +
      'ГАЛОЧКОЙ, а не только цветом. Снято живьём 22.08.2026.',
  },
  {
    name: 'myTischtennis.de — портал вида спорта',
    url: 'https://www.mytischtennis.de/',
    img: myTischtennis,
    note:
      'Ближайший аналог по задаче: личный кабинет игрока с рейтингом TTR, статистикой и личными ' +
      'встречами. Про матч-блок взять нечего — главная у них новостная, а не «что у меня сейчас»; ' +
      'это само по себе ответ: даже крупный портал вида спорта не решает нашу задачу.',
  },
];

/* Снимать пробовали шире; половина не отдалась. Записываем честно — иначе через
   месяц будет казаться, что смотрели только два сайта по невнимательности. */
export const MATCH_BLOCKED = [
  { name: 'ATP Tour (порядок игры)', url: 'https://www.atptour.com/en/scores/current', why: 'проверка Cloudflare' },
  { name: 'Sofascore', url: 'https://www.sofascore.com/table-tennis', why: 'капча Cloudflare, и матчей в этот день нет' },
  { name: 'Tournamentsoftware', url: 'https://www.tournamentsoftware.com/', why: 'модальное окно согласия поверх страницы' },
  { name: 'Flashscore', url: 'https://www.flashscore.com/table-tennis/', why: 'в этот день матчей нет — показывать нечего' },
  { name: 'Rankedin', url: 'https://www.rankedin.com/', why: 'на главной только промо, матчи за логином' },
];

export type Ref = { app: string; url: string };
export type RefGroup = {
  /** О чём спрашивали Mobbin */
  query: string;
  platform: 'iOS' | 'Веб' | 'Веб · секции';
  /** Набор слабый и выводов на нём не строили */
  weak?: boolean;
  refs: Ref[];
};

export const GROUPS: RefGroup[] = [
  {
    query: 'Шапка спортивного продукта с гербом лиги',
    platform: 'Веб',
    refs: [
      { app: 'Perplexity', url: S('60b3a024-93e2-4e7d-8871-5b552179aebb') },
      { app: 'X — хаб NBA', url: S('dfe579d5-08a1-44e5-b92c-fb7bf8de6cf7') },
      { app: 'X — таблица', url: S('9b1f3ea8-e1f6-4a7c-993d-b0162020ec56') },
      { app: 'Threads', url: S('3bb59739-8f7f-44bb-b83e-09e595a35df0') },
      { app: 'Stitch', url: S('0cd40828-ad37-4fa5-b905-a53874ba9a01') },
    ],
  },
  {
    query: 'Квадратная плитка знака и двухстрочный заголовок',
    platform: 'iOS',
    refs: [
      { app: 'Linktree', url: S('6480818a-d9bf-4abf-a59c-33847c008bc2') },
      { app: 'Instagram', url: S('696693c8-a3be-4a99-bb57-d43cb8c53dce') },
      { app: 'Tolan', url: S('1cd768d8-8abc-4a56-8909-2c6e978bc7c2') },
      { app: 'Clubhouse', url: S('86d4272f-77b9-48ee-a773-833a7e9567f4') },
      { app: 'Splitwise', url: S('6817a5f7-e222-4568-afc4-1487fb2d1670') },
      { app: 'Afterpay', url: S('e534f812-8bcb-4c7b-a3dc-fdd0853c12c7') },
      { app: 'Apple News', url: S('dcf7884c-7bfa-4bb1-a3fe-d9dd27701353') },
      { app: 'Apple Notes', url: S('d78e943f-82fc-4d14-9125-29011acf12a0') },
    ],
  },
  {
    query: 'Тёмная админка, логотип в боковой панели',
    platform: 'Веб',
    refs: [
      { app: 'Uxcel', url: S('44031fc5-3796-4d67-a39a-0fdbc2896470') },
      { app: 'Base44', url: S('a1fff3e9-c0e4-4ea1-a63c-d6fa7df272fe') },
      { app: 'Vercel', url: S('5bb75d66-7572-4f2e-a229-ebc54627343b') },
      { app: 'Posh', url: S('295a2a67-3635-41fd-8de0-a8ccc9c2fa83') },
      { app: 'Lovable', url: S('ad361de1-19e5-4115-b654-876e0d8c06a8') },
      { app: 'Gorgias', url: S('d201baf7-979c-4b6c-a849-fc35269ab6bb') },
    ],
  },
  {
    query: 'Герб клуба в шапке экрана',
    platform: 'iOS',
    refs: [
      { app: 'Spotify', url: S('e605d6df-89db-4774-911a-674d06d99667') },
      { app: 'MLS', url: S('e843d07b-cacd-4841-a1a8-9e5d32b3eddd') },
      { app: 'NFL', url: S('d1ff5f27-354e-426a-9374-7f0c4603fab0') },
      { app: 'Locals', url: S('db88b9b9-6c37-49d4-beb2-f83e54e6357d') },
      { app: 'DAZN', url: S('11f65168-3213-4490-baae-7739476c9897') },
      { app: 'adidas', url: S('e38a6554-4ffa-4932-88ff-ce541c228c86') },
    ],
  },
  {
    query: 'Турнирная сетка плей-офф',
    platform: 'Веб',
    weak: true,
    refs: [{ app: 'HubSpot', url: S('f0b56e4b-6fcb-4ad9-8627-e53bbcc172bf') }],
  },
  {
    query: 'Табло матча с гербами обеих команд',
    platform: 'iOS',
    refs: [
      { app: 'FotMob', url: S('7dc77398-839f-48b2-8b12-29ac90b2b9c1') },
      { app: 'Apple Sports', url: S('886ae66f-8615-4cb0-988f-81dec70b030e') },
      { app: 'Fixtured', url: S('f38fb580-c136-492b-9f76-141acbcd67fb') },
      { app: 'MLS', url: S('4b100fbb-973d-41a3-b542-7fea394fccf4') },
      { app: 'Premier League', url: S('23dce6cf-7ec9-4bd5-b8a2-6adc573f8eb4') },
      { app: 'theScore', url: S('d81ed8cb-a7fe-4990-89af-4515bb04dfef') },
      { app: 'NFL', url: S('14744a95-8fe1-4b21-b8b7-fb3203244281') },
      { app: 'X', url: S('73256e33-aa77-4caa-b2db-1697e0790a0f') },
    ],
  },
  {
    query: 'Турнирная таблица с гербом в каждой строке',
    platform: 'iOS',
    refs: [
      { app: 'theScore', url: S('1d4bf7ee-e00f-4360-8986-646663f5605f') },
      { app: 'NFL', url: S('1325a7cd-dac6-4e78-bb11-fa6816b761b4') },
      { app: 'Apple Sports', url: S('04b91d44-700e-43d8-a464-eb98a1a5733c') },
      { app: 'Formula 1', url: S('6fa8d76f-a91d-4f50-ba12-747155be7ba7') },
      { app: 'FotMob', url: S('9cdca008-941d-4127-95b6-d50bb4119828') },
      { app: 'MLS', url: S('19d86590-35b2-47f7-bac8-1d4ef4febab2') },
      { app: 'NBA', url: S('d3bcc086-3549-4bab-a78c-8201bccd8300') },
      { app: 'Fixtured', url: S('6725f8dd-6ffa-4207-8f57-d8bf19c5c1ec') },
    ],
  },
  {
    query: 'Верхняя панель: логотип и переключатель пространства',
    platform: 'Веб',
    refs: [
      { app: 'Fibery', url: S('e470f040-82a2-44ec-8954-c70e56ce695b') },
      { app: 'Microsoft Loop', url: S('7bda4249-5988-44d3-af7d-73f745a321e2') },
      { app: 'Clerk', url: S('78973eed-10da-43d5-9adc-56c444bc82c5') },
      { app: 'Air', url: S('fa59dedd-7f78-48a1-b5bc-a628f154af8e') },
      { app: 'Amplitude', url: S('56f5ff3c-cf4c-47e0-b3cd-7040097105e5') },
      { app: 'Slite', url: S('389dd682-62d2-4aac-810c-2a02bf428f1c') },
      { app: 'Zoom', url: S('311f7c75-e5d9-4016-9112-21994dfb13fa') },
      { app: 'ClickUp', url: S('2eb08959-de33-42e3-8873-69508b9d89b3') },
    ],
  },
  {
    query: 'Профиль спортсмена: флаг страны и эмблема',
    platform: 'iOS',
    refs: [
      { app: 'FotMob', url: S('74f4694b-05f4-464d-bb26-45f8d7a13795') },
      { app: 'Premier League', url: S('33e22781-c790-446d-a58e-fb61493f0aea') },
      { app: 'Under Armour', url: S('6d0dd17d-3bcb-4b84-8970-4de2834b4875') },
      { app: 'Formula 1', url: S('86839b4e-01e6-4b3b-99da-9c78aa6a75ab') },
      { app: 'Paramount+', url: S('5601479a-f19a-4374-a756-b73b88c1efa2') },
      { app: 'Azar', url: S('9d77eb88-a8ec-46b1-9339-1aa8aff5327b') },
      { app: 'Tonal', url: S('c648e34b-15c8-44d1-abb8-1a957d7d5150') },
      { app: 'Pangea', url: S('3ba261f7-3c2f-4ec2-8307-c661a56c255d') },
    ],
  },
  {
    query: 'Членская карта с эмблемой и статусом',
    platform: 'iOS',
    refs: [
      { app: 'Shangri-La Circle', url: S('1c46893c-c975-4b9a-854d-3839e3dc7d7f') },
      { app: 'Nike Run Club', url: S('fc470692-d84c-40fe-bef1-a924cb6f5bbc') },
      { app: 'Ulta Beauty', url: S('53145832-e84f-48b1-b235-93f367535459') },
      { app: 'IKEA', url: S('59e57179-c37b-4203-875a-4201922217ba') },
      { app: 'Marriott Bonvoy', url: S('626ceb57-4d93-47e5-9825-98e28dd2c7d4') },
      { app: 'pushr', url: S('7c8e5492-4497-4a9f-a106-d7911c9b34a7') },
      { app: 'Chipotle', url: S('19542763-ad60-453a-9813-18b8ef9d67aa') },
      { app: 'adidas adiclub', url: S('ca2219bc-ced3-4b5e-b9c8-d9fda98e044b') },
    ],
  },
  {
    query: 'Витрина сайта спортивной организации',
    platform: 'Веб · секции',
    weak: true,
    refs: [
      { app: 'Uniswap Cup', url: SEC('761673b9-83df-468c-8868-b303b730cb00') },
      { app: 'Webflow', url: SEC('7d48bf03-9f8a-4bfa-ad21-239e0dc0adb0') },
      { app: 'Runway', url: SEC('10d39ce5-31db-4556-8169-96098e3e8ede') },
      { app: 'Ploy', url: SEC('c61d8e3e-1730-447a-8913-5a1841250554') },
      { app: 'Patreon', url: SEC('2c0f332c-ee72-4766-bb86-a92d8c21b535') },
      { app: 'Airtable', url: SEC('de1d1994-e910-42da-9f07-1076412af3d7') },
      { app: 'Qatalog', url: SEC('6e6571a3-8bd7-4e94-b642-02d0cce0b71a') },
      { app: 'Vercel', url: SEC('f875072a-1073-4dd1-b798-dbef0af45339') },
    ],
  },
  {
    query: 'Стартовый экран со знаком на фирменном цвете',
    platform: 'iOS',
    refs: [
      { app: 'MLS', url: S('9d6fba4f-0a08-4102-ac7e-117e15ac6b3e') },
      { app: 'Strava', url: S('17bda029-9fd8-4dee-aebe-95c08e0f3e62') },
      { app: 'Formula 1', url: S('ad0f6071-ea62-45ef-a799-64ab20c77eeb') },
      { app: 'theScore', url: S('85c01f98-aeef-419d-8297-de2f5d081324') },
      { app: 'DAZN', url: S('5d63f539-087f-4550-a84c-60f951acf79d') },
      { app: 'FotMob', url: S('9b66624a-db8d-49c3-bde0-df9b9b4b96ce') },
      { app: 'NBA', url: S('56528b01-9027-4fc3-a83c-ba138bd6f3dd') },
      { app: 'DICK’S Sporting Goods', url: S('60595806-2440-4e2a-bcb3-3c0b772d069c') },
    ],
  },
];

export type Finding = {
  title: string;
  /** Что увидели в референсах */
  seen: string;
  /** Что из этого сделали у себя. `done: false` — вывод есть, работа не сделана. */
  did: string;
  done?: boolean;
  /** Экраны, на которых вывод держится */
  refs: Ref[];
};

export const FINDINGS: Finding[] = [
  {
    title: 'Подробный крест не живёт мелким — рядом всегда упрощённый знак',
    seen:
      'Самое частое решение — два ассета. Крупно настоящий герб со всеми деталями, ' +
      'мелко упрощённый значок с сильным силуэтом и одним доминирующим цветом. У MLS ' +
      'это видно на одном экране: герб «Интер Майами» крупно в центре и он же крошечным ' +
      'значком в таб-баре. В таблицах и на табло крест ужат до 20–24 px и всегда подпёрт ' +
      'коротким кодом или названием — сам по себе на этом размере он не опознаётся.',
    did:
      'Завели второй ассет — brand/fnt/fnt-mark.svg: квадратная марка из «тройки», солнца ' +
      'и беркута, без ленты орнамента и без надписи TTFRK. Полный щит остаётся для крупных ' +
      'подач. Лестница размеров ниже — щит ниже 30 px превращается в кашу, марка держится до 16.',
    done: true,
    refs: [
      { app: 'MLS', url: S('e843d07b-cacd-4841-a1a8-9e5d32b3eddd') },
      { app: 'DAZN', url: S('11f65168-3213-4490-baae-7739476c9897') },
      { app: 'theScore', url: S('1d4bf7ee-e00f-4360-8986-646663f5605f') },
      { app: 'NFL', url: S('1325a7cd-dac6-4e78-bb11-fa6816b761b4') },
      { app: 'Apple Sports', url: S('04b91d44-700e-43d8-a464-eb98a1a5733c') },
      { app: 'FotMob', url: S('9cdca008-941d-4127-95b6-d50bb4119828') },
      { app: 'NBA', url: S('d3bcc086-3549-4bab-a78c-8201bccd8300') },
      { app: 'Fixtured', url: S('6725f8dd-6ffa-4207-8f57-d8bf19c5c1ec') },
    ],
  },
  {
    title: 'В шапке продукта локап однострочный и тихий',
    seen:
      'Ни один рабочий интерфейс не делает из своего логотипа в верхней панели двухъярусную ' +
      'композицию. Знак 18–24 px, рядом название, одна строка, дальше сразу рабочий контекст.',
    did:
      'Это отменило мой первый вариант: на десктопе стоял двухъярусный локап «ФНТ РК / ' +
      'Настольный теннис», и после разбора подпись убрана. Рядом в шапке идёт название ' +
      'турнира — вторая строка бренда с ним конкурирует. Теперь там <Brand /> без sub.',
    done: true,
    refs: [
      { app: 'Uxcel', url: S('44031fc5-3796-4d67-a39a-0fdbc2896470') },
      { app: 'Lovable', url: S('ad361de1-19e5-4115-b654-876e0d8c06a8') },
      { app: 'Vercel', url: S('5bb75d66-7572-4f2e-a229-ebc54627343b') },
      { app: 'Posh', url: S('295a2a67-3635-41fd-8de0-a8ccc9c2fa83') },
      { app: 'Gorgias', url: S('d201baf7-979c-4b6c-a849-fc35269ab6bb') },
      { app: 'Fibery', url: S('e470f040-82a2-44ec-8954-c70e56ce695b') },
      { app: 'Microsoft Loop', url: S('7bda4249-5988-44d3-af7d-73f745a321e2') },
      { app: 'Slite', url: S('389dd682-62d2-4aac-810c-2a02bf428f1c') },
      { app: 'ClickUp', url: S('2eb08959-de33-42e3-8873-69508b9d89b3') },
      { app: 'Air', url: S('fa59dedd-7f78-48a1-b5bc-a628f154af8e') },
    ],
  },
  {
    title: 'Две строки — язык карточки сущности, а не шапки',
    seen:
      'Пара «название + уточнение под ним» встречается там, где блок описывает сущность, ' +
      'а не владельца интерфейса: карточки лиг, профили, сообщества, карточка игрока.',
    did:
      'Вторую строку оставили только на телефонных шапках, где локап и есть всё содержимое ' +
      'шапки. Туда же уехала роль: раньше в телефоне стояло «знак + Судья», то есть бренд ' +
      'из шапки пропадал совсем. Теперь «ФНТ РК» сверху, роль — подписью.',
    done: true,
    refs: [
      { app: 'Perplexity', url: S('60b3a024-93e2-4e7d-8871-5b552179aebb') },
      { app: 'Threads', url: S('3bb59739-8f7f-44bb-b83e-09e595a35df0') },
      { app: 'Instagram', url: S('696693c8-a3be-4a99-bb57-d43cb8c53dce') },
      { app: 'Clubhouse', url: S('86d4272f-77b9-48ee-a773-833a7e9567f4') },
      { app: 'Pangea', url: S('3ba261f7-3c2f-4ec2-8307-c661a56c255d') },
      { app: 'Premier League', url: S('33e22781-c790-446d-a58e-fb61493f0aea') },
      { app: 'FotMob', url: S('74f4694b-05f4-464d-bb26-45f8d7a13795') },
    ],
  },
  {
    title: 'Плитка фирменного цвета — стандартный контейнер мелкого знака',
    seen:
      'Скруглённый квадрат, залитый фирменным цветом, со знаком внутри — самый устойчивый ' +
      'способ дать логотипу опору на чужом фоне. У adidas так собрана целая сетка клубных ' +
      'гербов, у Formula 1 — круглые цветные плитки под конструкторов, у Fixtured — круглые ' +
      'подставки под гербами. Двойной оправы «подставка под уже цветной плиткой» нет ни разу.',
    did:
      'Марка сама и есть плитка: синий цвет щита, скругление 12.36 % стороны — та же доля, ' +
      'что у настоящего щита. Подставку-плинт пробовали и отказались: два контура подряд ' +
      'читаются как артефакт.',
    done: true,
    refs: [
      { app: 'adidas', url: S('e38a6554-4ffa-4932-88ff-ce541c228c86') },
      { app: 'Afterpay', url: S('e534f812-8bcb-4c7b-a3dc-fdd0853c12c7') },
      { app: 'Clubhouse', url: S('86d4272f-77b9-48ee-a773-833a7e9567f4') },
      { app: 'Splitwise', url: S('6817a5f7-e222-4568-afc4-1487fb2d1670') },
      { app: 'Apple News', url: S('dcf7884c-7bfa-4bb1-a3fe-d9dd27701353') },
      { app: 'Linktree', url: S('6480818a-d9bf-4abf-a59c-33847c008bc2') },
      { app: 'Formula 1', url: S('6fa8d76f-a91d-4f50-ba12-747155be7ba7') },
      { app: 'Fixtured', url: S('f38fb580-c136-492b-9f76-141acbcd67fb') },
    ],
  },
  {
    title: 'Спортивный нейминг — узкий тяжёлый прописной',
    seen:
      'Названия команд и разделов набраны узким тяжёлым гротеском в верхнем регистре, часто ' +
      'с наклоном: «PHILADELPHIA EAGLES» у NFL, коды команд в таблице, «2025 TEAMS’ STANDINGS» ' +
      'у Formula 1.',
    did:
      'Подтвердило прежний отбор шрифтов: словесная часть сидит на --font-brand = Fira Sans ' +
      'Extra Condensed 800, прописные, с разрядкой. Токен отдельный от --font намеренно — ' +
      'подпись бренда не должна ездить за переключателем «Шрифт» в тулбаре.',
    done: true,
    refs: [
      { app: 'NFL', url: S('d1ff5f27-354e-426a-9374-7f0c4603fab0') },
      { app: 'NFL — коды', url: S('1325a7cd-dac6-4e78-bb11-fa6816b761b4') },
      { app: 'Formula 1', url: S('6fa8d76f-a91d-4f50-ba12-747155be7ba7') },
      { app: 'NBA', url: S('d3bcc086-3549-4bab-a78c-8201bccd8300') },
      { app: 'MLS', url: S('19d86590-35b2-47f7-bac8-1d4ef4febab2') },
      { app: 'Locals', url: S('db88b9b9-6c37-49d4-beb2-f83e54e6357d') },
      { app: 'DICK’S', url: S('60595806-2440-4e2a-bcb3-3c0b772d069c') },
      { app: 'Strava', url: S('17bda029-9fd8-4dee-aebe-95c08e0f3e62') },
    ],
  },
  {
    title: 'На титульном экране знак идёт вывороткой на фирменном цвете',
    seen:
      'Стартовые экраны почти все устроены одинаково: одноцветный знак по центру залитого ' +
      'фирменным цветом поля, без плитки и без подложки.',
    did:
      'Не сделано — но после второго захода это уже не «рекомендация по референсам», а прямой ' +
      'пробел: на живом сайте ФНТ РК (ttfrk.kz) знак стоит именно белой вывороткой на тёмном. ' +
      'Федерация этим вариантом пользуется прямо сейчас, а в присланном .cdr его нет, и в наших ' +
      'сборках тоже. Собирается из тех же кривых эмблемы — жду отмашки, потому что это правка ' +
      'брендового комплекта, а не макета.',
    done: false,
    refs: [
      { app: 'MLS', url: S('9d6fba4f-0a08-4102-ac7e-117e15ac6b3e') },
      { app: 'theScore', url: S('85c01f98-aeef-419d-8297-de2f5d081324') },
      { app: 'Strava', url: S('17bda029-9fd8-4dee-aebe-95c08e0f3e62') },
      { app: 'DICK’S', url: S('60595806-2440-4e2a-bcb3-3c0b772d069c') },
      { app: 'FotMob', url: S('9b66624a-db8d-49c3-bde0-df9b9b4b96ce') },
      { app: 'Formula 1', url: S('ad0f6071-ea62-45ef-a799-64ab20c77eeb') },
      { app: 'NBA', url: S('56528b01-9027-4fc3-a83c-ba138bd6f3dd') },
      { app: 'DAZN', url: S('5d63f539-087f-4550-a84c-60f951acf79d') },
    ],
  },
];

export const TOTAL_REFS = GROUPS.reduce((n, g) => n + g.refs.length, 0);
export const TOTAL_QUERIES = GROUPS.length;
