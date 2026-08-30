/* Справочник HeroUI 3 · группа «Цвет» ✳ (30.08.2026).

   Семь компонентов выбора цвета: от пассивного свотча до пикера с поповером.
   В домене платформы цвет — это данные, а не оформление: клуб выбирает цвет
   формы, и на табло хозяева не должны сливаться с гостями. Значения клубов
   живут в двух видах: строка hsb(…) — там, где нужны оси этой модели
   (ColorArea, ColorSlider), и она же через parseColor(…).toFormat('rgb') —
   для свотчей и палитры: индикатор ColorSwatchPicker считает яркость по
   каналам red/green/blue и на hsb-цвете падает. Токены дизайн-системы
   отвечают за краски интерфейса, не за цвет формы. */

import { Palette, Shirt } from 'lucide-react';
import {
  Avatar,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  Label,
  colorSwatchPickerVariants,
  colorSwatchVariants,
} from '@heroui/react';
/* ColorInputGroup из корня пакета не реэкспортируется (проверено по
   dist/components/index.d.ts) — только сабпутём. */
import { ColorInputGroup, colorInputGroupVariants } from '@heroui/react/color-input-group';
/* parseColor из react-aria реэкспортируется сабпутём rac (dist/components/rac) */
import { parseColor } from '@heroui/react/rac';
import { CITIES, PLAYERS, Row, Section, Shell, TOURNAMENTS, values } from './HeroKit';

export default {
  title: 'UI-кит/HeroUI/08 · Цвет',
  parameters: { layout: 'fullscreen' },
};

/* Фирменные цвета клубов лиги — по одному на город из словаря кита.
   Тона разведены нарочно: первые два клуба встречаются в примерах как
   хозяева и гости, их формы обязаны различаться с первого взгляда. */
const HUES = [214, 48, 145, 350, 28, 268];
/* Один цвет — два представления: hsb-строка для осей плоскости и ползунков,
   rgb-объект для свотчей и палитры (почему — см. шапку файла). */
const CLUBS = CITIES.map((city, i) => ({
  city,
  color: `hsb(${HUES[i]}, 84%, 88%)`,
  rgb: parseColor(`hsb(${HUES[i]}, 84%, 88%)`).toFormat('rgb'),
}));

const HOME = { ...PLAYERS[0], color: CLUBS[0].color, rgb: CLUBS[0].rgb }; // Ким Г., Алматы — синий
const AWAY = { ...PLAYERS[1], color: CLUBS[1].color, rgb: CLUBS[1].rgb }; // Оспанов Р., Астана — золотой
const TRANSLUCENT = 'hsba(214, 84%, 88%, 0.55)'; // для канала alpha нужна прозрачность

/* ── Свотч и палитра ────────────────────────────────────────────── */
export const Swatches = {
  name: 'Свотч и палитра',
  render: () => (
    <Shell>
      <Section
        name="ColorSwatch"
        note="Пассивный образец цвета: 2 формы × 5 размеров. Не интерактивен — выбором занимается ColorSwatchPicker."
      >
        <Row
          prop="shape"
          vals={values(colorSwatchVariants, 'shape')}
          render={(v) => (
            <ColorSwatch aria-label="Цвет формы хозяев" color={HOME.rgb} shape={v as never} />
          )}
        />
        <Row
          prop="size"
          vals={values(colorSwatchVariants, 'size')}
          render={(v) => (
            <ColorSwatch aria-label="Цвет формы хозяев" color={HOME.rgb} size={v as never} />
          )}
        />
        {/* aria-label — имя клуба: без него читалка озвучивает координаты цвета */}
        <Row
          prop="цвета клубов лиги"
          vals={CLUBS.map((c) => c.city)}
          render={(city) => (
            <ColorSwatch
              aria-label={`Клуб: ${city}`}
              color={CLUBS.find((c) => c.city === city)!.rgb}
              shape="square"
            />
          )}
        />
      </Section>

      <Section
        name="ColorSwatchPicker"
        note="Выбор из готовой палитры: 2 формы × 5 размеров × 2 раскладки. Внутри Item обязателен Swatch, Indicator рисует галочку на выбранном. Цвета — только в rgb: галочка считает яркость по каналам red/green/blue и на hsb-цвете падает."
      >
        <Row
          prop="variant"
          vals={values(colorSwatchPickerVariants, 'variant')}
          render={(v) => (
            <ColorSwatchPicker
              aria-label="Палитра клубов"
              defaultValue={CLUBS[0].rgb}
              size="sm"
              variant={v as never}
            >
              {CLUBS.slice(0, 4).map((c) => (
                <ColorSwatchPicker.Item color={c.rgb} key={c.city}>
                  <ColorSwatchPicker.Swatch />
                  <ColorSwatchPicker.Indicator />
                </ColorSwatchPicker.Item>
              ))}
            </ColorSwatchPicker>
          )}
        />
        <Row
          prop="size"
          vals={values(colorSwatchPickerVariants, 'size')}
          render={(v) => (
            <ColorSwatchPicker
              aria-label="Палитра клубов"
              defaultValue={CLUBS[1].rgb}
              size={v as never}
            >
              {CLUBS.slice(0, 3).map((c) => (
                <ColorSwatchPicker.Item color={c.rgb} key={c.city}>
                  <ColorSwatchPicker.Swatch />
                  <ColorSwatchPicker.Indicator />
                </ColorSwatchPicker.Item>
              ))}
            </ColorSwatchPicker>
          )}
        />
        {/* layout меняет только раскладку CSS: клавиатура остаётся сеточной */}
        <Row
          prop="layout"
          vals={values(colorSwatchPickerVariants, 'layout')}
          render={(v) => (
            <ColorSwatchPicker
              aria-label="Палитра клубов"
              defaultValue={CLUBS[2].rgb}
              layout={v as never}
              size="sm"
            >
              {CLUBS.slice(0, 3).map((c) => (
                <ColorSwatchPicker.Item color={c.rgb} key={c.city}>
                  <ColorSwatchPicker.Swatch />
                  <ColorSwatchPicker.Indicator />
                </ColorSwatchPicker.Item>
              ))}
            </ColorSwatchPicker>
          )}
        />
        <Row
          prop="вся лига"
          vals={['шесть клубов, выбран хозяин поля']}
          render={() => (
            <ColorSwatchPicker
              aria-label="Цвета клубов лиги"
              defaultValue={CLUBS[0].rgb}
              size="lg"
              variant="square"
            >
              {CLUBS.map((c) => (
                <ColorSwatchPicker.Item color={c.rgb} key={c.city}>
                  <ColorSwatchPicker.Swatch />
                  <ColorSwatchPicker.Indicator />
                </ColorSwatchPicker.Item>
              ))}
            </ColorSwatchPicker>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Плоскость и ползунки ───────────────────────────────────────── */
export const AreaSliders = {
  name: 'Плоскость и ползунки',
  render: () => (
    <Shell>
      <Section
        name="ColorArea"
        note="Плоскость двух каналов; ручка Thumb обязательна — без неё выбора не видно. Единственный стилевой флаг — showDots."
      >
        {/* по умолчанию плоскость тянется на всю ячейку (w-full) — фиксируем
            размер, иначе ширину диктует подпись под ячейкой */}
        <Row
          prop="вид"
          vals={['обычная', 'с сеткой точек', 'недоступна']}
          render={(v) => (
            <ColorArea
              aria-label="Насыщенность и яркость формы"
              className="size-36"
              defaultValue={HOME.color}
              isDisabled={v === 'недоступна'}
              showDots={v === 'с сеткой точек'}
              xChannel="saturation"
              yChannel="brightness"
            >
              <ColorArea.Thumb />
            </ColorArea>
          )}
        />
      </Section>

      <Section
        name="ColorSlider"
        note="Ползунок одного канала; Track и Thumb обязательны, Output печатает значение. Набор каналов зависит от colorSpace — здесь hsb."
      >
        <Row
          prop="channel (hsb)"
          vals={['hue', 'saturation', 'brightness', 'alpha']}
          render={(v) => (
            <ColorSlider
              aria-label={`Канал: ${v}`}
              channel={v as never}
              className="w-52"
              colorSpace="hsb"
              defaultValue={v === 'alpha' ? TRANSLUCENT : HOME.color}
            >
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
          )}
        />
        <Row
          prop="orientation"
          vals={['horizontal', 'vertical']}
          render={(v) => (
            <ColorSlider
              aria-label="Тон формы"
              channel="hue"
              className={v === 'vertical' ? 'h-40' : 'w-52'}
              colorSpace="hsb"
              defaultValue={HOME.color}
              orientation={v as never}
            >
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
          )}
        />
        <Row
          prop="с Output"
          vals={['значение канала текстом']}
          render={() => (
            <ColorSlider
              aria-label="Тон формы"
              channel="hue"
              className="w-52"
              colorSpace="hsb"
              defaultValue={AWAY.color}
            >
              <ColorSlider.Output />
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Поля цвета ─────────────────────────────────────────────────── */
export const Fields = {
  name: 'Поля цвета',
  render: () => (
    <Shell>
      <Section
        name="ColorField"
        note="Поле с логикой цвета: держит значение и разбирает ввод. Видимая часть — Group с Input. Контекст поля свотчу цвет не передаёт (штатной части-свотча у поля нет) — свотчу в Prefix задаём color тем же значением; сам он подхватывает цвет только внутри ColorPicker."
      >
        {/* Цвет формы на матч: судья сразу видит, что хозяева и гости различимы */}
        <Row
          prop="хозяева / гости"
          vals={['хозяева', 'гости']}
          render={(side) => {
            const p = side === 'хозяева' ? HOME : AWAY;
            return (
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <Avatar.Image alt="" src={p.av} />
                </Avatar>
                <ColorField aria-label={`Цвет формы: ${p.short}`} defaultValue={p.color}>
                  <ColorField.Group>
                    <ColorField.Prefix>
                      <ColorSwatch color={p.rgb} size="xs" />
                    </ColorField.Prefix>
                    <ColorField.Input />
                  </ColorField.Group>
                </ColorField>
              </div>
            );
          }}
        />
        <Row
          prop="с подписью Label"
          vals={['подпись связывается с полем сама']}
          render={() => (
            <ColorField defaultValue={HOME.color}>
              <Label>Цвет формы хозяев</Label>
              <ColorField.Group>
                <ColorField.Prefix>
                  <ColorSwatch color={HOME.rgb} size="xs" />
                </ColorField.Prefix>
                <ColorField.Input />
              </ColorField.Group>
            </ColorField>
          )}
        />
        <Row
          prop="variant (на Group)"
          vals={values(colorInputGroupVariants, 'variant')}
          render={(v) => (
            <ColorField aria-label="Цвет формы" defaultValue={HOME.color}>
              <ColorField.Group variant={v as never}>
                <ColorField.Prefix>
                  <ColorSwatch color={HOME.rgb} size="xs" />
                </ColorField.Prefix>
                <ColorField.Input />
              </ColorField.Group>
            </ColorField>
          )}
        />
        <Row
          prop="состояния"
          vals={['обычное', 'недоступно', 'ошибка', 'только чтение']}
          render={(v) => (
            <ColorField
              aria-label="Цвет формы"
              defaultValue={AWAY.color}
              isDisabled={v === 'недоступно'}
              isInvalid={v === 'ошибка'}
              isReadOnly={v === 'только чтение'}
            >
              <ColorField.Group>
                <ColorField.Prefix>
                  <ColorSwatch color={AWAY.rgb} size="xs" />
                </ColorField.Prefix>
                <ColorField.Input />
              </ColorField.Group>
            </ColorField>
          )}
        />
        {/* channel сужает поле до одного числа — удобно подкрутить только тон */}
        <Row
          prop="channel"
          vals={['весь цвет', 'только тон']}
          render={(v) => (
            <ColorField
              aria-label={v === 'только тон' ? 'Тон формы' : 'Цвет формы'}
              channel={v === 'только тон' ? 'hue' : undefined}
              colorSpace="hsb"
              defaultValue={HOME.color}
            >
              <ColorField.Group>
                <ColorField.Prefix>
                  <ColorSwatch color={HOME.rgb} size="xs" />
                </ColorField.Prefix>
                <ColorField.Input />
              </ColorField.Group>
            </ColorField>
          )}
        />
      </Section>

      <Section
        name="ColorInputGroup"
        note="Оболочка без логики цвета: рамка, Prefix/Suffix и обычный текстовый Input. Те же части внутри ColorField работают как Group/Input/Prefix/Suffix. 2 варианта."
      >
        <Row
          prop="variant"
          vals={values(colorInputGroupVariants, 'variant')}
          render={(v) => (
            <ColorInputGroup variant={v as never}>
              <ColorInputGroup.Prefix>
                <ColorSwatch
                  aria-label={`Клуб: ${CLUBS[2].city}`}
                  color={CLUBS[2].rgb}
                  size="xs"
                />
              </ColorInputGroup.Prefix>
              <ColorInputGroup.Input aria-label="Цвет клуба" defaultValue={CLUBS[2].color} />
              <ColorInputGroup.Suffix>
                <Palette className="text-neutral-400" size={16} />
              </ColorInputGroup.Suffix>
            </ColorInputGroup>
          )}
        />
        <Row
          prop="fullWidth"
          vals={['false', 'true']}
          render={(v) => (
            <div className="w-64">
              <ColorInputGroup fullWidth={v === 'true'}>
                <ColorInputGroup.Input aria-label="Цвет клуба" defaultValue={CLUBS[3].color} />
              </ColorInputGroup>
            </div>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Пикер с поповером ──────────────────────────────────────────── */

/* Содержимое поповера: контролы сами привязываются к значению пикера через
   контекст — value им передавать не нужно. */
const PickerControls = () => (
  <div className="flex w-56 flex-col gap-3">
    <ColorArea
      aria-label="Насыщенность и яркость"
      colorSpace="hsb"
      xChannel="saturation"
      yChannel="brightness"
    >
      <ColorArea.Thumb />
    </ColorArea>
    <ColorSlider aria-label="Тон" channel="hue" colorSpace="hsb">
      <ColorSlider.Track>
        <ColorSlider.Thumb />
      </ColorSlider.Track>
    </ColorSlider>
    <ColorField aria-label="Точное значение">
      <ColorField.Group>
        <ColorField.Prefix>
          <ColorSwatch size="xs" />
        </ColorField.Prefix>
        <ColorField.Input />
      </ColorField.Group>
    </ColorField>
  </div>
);

export const PickerOpen = {
  name: 'ColorPicker (поповер открыт)',
  render: () => (
    <Shell>
      <Section
        name="ColorPicker"
        note={`Триггер-кнопка со свотчем + поповер с любыми цветовыми контролами. Матч «${TOURNAMENTS[0]}»: хозяева выбирают цвет формы — их поповер открыт через defaultOpen, у гостей закрыт.`}
      >
        <div className="flex items-start gap-10">
          <div className="flex items-center gap-2">
            <Shirt className="text-neutral-500" size={16} />
            <span className="text-sm">{HOME.short} — хозяева</span>
            <ColorPicker defaultValue={HOME.color}>
              <ColorPicker.Trigger aria-label="Выбрать цвет формы хозяев">
                <ColorSwatch shape="square" size="sm" />
              </ColorPicker.Trigger>
              {/* defaultOpen — чтобы скриншот истории показал поповер без клика */}
              <ColorPicker.Popover defaultOpen>
                <PickerControls />
              </ColorPicker.Popover>
            </ColorPicker>
          </div>
          <div className="flex items-center gap-2">
            <Shirt className="text-neutral-500" size={16} />
            <span className="text-sm">{AWAY.short} — гости</span>
            <ColorPicker defaultValue={AWAY.color}>
              <ColorPicker.Trigger aria-label="Выбрать цвет формы гостей">
                <ColorSwatch shape="square" size="sm" />
              </ColorPicker.Trigger>
              <ColorPicker.Popover>
                <PickerControls />
              </ColorPicker.Popover>
            </ColorPicker>
          </div>
        </div>
        {/* запас высоты под открытый поповер */}
        <div className="h-96" />
      </Section>
    </Shell>
  ),
};
