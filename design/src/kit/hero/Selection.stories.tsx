/* Группа «Выбор» справочника HeroUI 3: флажки, радио, переключатели, ползунок,
   выпадающие списки (Select, ComboBox, Autocomplete), список ListBox и теги.
   Всё составное: у каждого контрола обязательные части (Content, Control,
   Indicator…) — без них рендерится пустота, так и сломался старый справочник.
   Структура частей — из типов пакета, наборы значений — из объектов вариантов. */

import {
  Autocomplete,
  Checkbox,
  CheckboxGroup,
  ComboBox,
  Description,
  ErrorMessage,
  Header,
  Input,
  Label,
  ListBox,
  Radio,
  RadioGroup,
  SearchField,
  Select,
  Slider,
  Switch,
  SwitchGroup,
  Tag,
  TagGroup,
  autocompleteVariants,
  checkboxGroupVariants,
  checkboxVariants,
  listboxItemVariants,
  listboxVariants,
  radioGroupVariants,
  selectVariants,
  switchGroupVariants,
  switchVariants,
  tagVariants,
} from '@heroui/react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { CITIES, PLAYERS, Row, Section, Shell, TOURNAMENTS, values } from './HeroKit';

export default {
  title: 'UI-кит/HeroUI/03 · Выбор',
  parameters: { layout: 'fullscreen' },
};

/* Разряды и клубы выводим из словаря кита: своих сущностей истории не заводят. */
const RANKS = PLAYERS.map((p) => p.rank).filter((r, i, a) => a.indexOf(r) === i);
const CLUBS = CITIES.slice(0, 4).map((c) => `ТТК «${c}»`);

/* ── Флажки ─────────────────────────────────────────────────────── */
export const Checkboxes = {
  name: 'Флажки',
  render: () => (
    <Shell>
      <Section
        name="Checkbox"
        note="Флажок из четырёх частей: Content — кликабельный label, Control — квадратик, Indicator — галочка (SVG рисует сам), Label — подпись. Два вида: primary и secondary."
      >
        {/* Полная анатомия — согласие с регламентом из заявки спортсмена. */}
        <Row
          prop="анатомия"
          vals={['Content → Control → Indicator + Label']}
          render={() => (
            <Checkbox defaultSelected>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>Согласен с регламентом турнира</Label>
              </Checkbox.Content>
            </Checkbox>
          )}
        />
        <Row
          prop="variant"
          vals={values(checkboxVariants, 'variant')}
          render={(v) => (
            <Checkbox defaultSelected variant={v as never}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>Согласен</Label>
              </Checkbox.Content>
            </Checkbox>
          )}
        />
        {/* «Частично» — isIndeterminate: Indicator сам меняет галочку на чёрточку. */}
        <Row
          prop="состояния"
          vals={['выключен', 'включён', 'частично', 'недоступен', 'с ошибкой']}
          render={(v) => (
            <Checkbox
              defaultSelected={v === 'включён' || v === 'недоступен'}
              isIndeterminate={v === 'частично'}
              isDisabled={v === 'недоступен'}
              isInvalid={v === 'с ошибкой'}
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>Регламент</Label>
              </Checkbox.Content>
            </Checkbox>
          )}
        />
      </Section>

      <Section
        name="CheckboxGroup"
        note="Группа флажков без своих саб-компонентов: Label и флажки — прямые дети. Внутри группы у каждого флажка ОБЯЗАТЕЛЕН value, а defaultSelected не работает — отбор идёт через value группы."
      >
        <Row
          prop="категории спортсмена"
          vals={['defaultValue = ["single", "double"]']}
          render={() => (
            <CheckboxGroup defaultValue={['single', 'double']}>
              <Label>Категории</Label>
              {[
                ['single', 'Одиночная'],
                ['double', 'Парная'],
                ['team', 'Командная'],
              ].map(([id, label]) => (
                <Checkbox value={id} key={id}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label>{label}</Label>
                  </Checkbox.Content>
                </Checkbox>
              ))}
              <Description>Можно заявиться в несколько категорий</Description>
            </CheckboxGroup>
          )}
        />
        {/* variant группы уходит каждому флажку через контекст. */}
        <Row
          prop="variant"
          vals={values(checkboxGroupVariants, 'variant')}
          render={(v) => (
            <CheckboxGroup
              variant={v as never}
              defaultValue={['single']}
              aria-label={`Категории (${v})`}
            >
              {[
                ['single', 'Одиночная'],
                ['double', 'Парная'],
              ].map(([id, label]) => (
                <Checkbox value={id} key={id}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label>{label}</Label>
                  </Checkbox.Content>
                </Checkbox>
              ))}
            </CheckboxGroup>
          )}
        />
        <Row
          prop="с ошибкой"
          vals={['isInvalid + ErrorMessage']}
          render={() => (
            <CheckboxGroup isInvalid aria-label="Категории с ошибкой">
              <Checkbox value="team">
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Label>Командная</Label>
                </Checkbox.Content>
              </Checkbox>
              <ErrorMessage>Выберите хотя бы одну категорию</ErrorMessage>
            </CheckboxGroup>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Радио-кнопки ───────────────────────────────────────────────── */
export const Radios = {
  name: 'Радио-кнопки',
  render: () => (
    <Shell>
      <Section
        name="RadioGroup"
        note="Единственный владелец выбора: value группы — это value отмеченной кнопки. Два вида (primary, secondary), раскладка — RAC-пропом orientation."
      >
        <Row
          prop="пол в заявке"
          vals={['orientation = horizontal']}
          render={() => (
            <RadioGroup defaultValue="m" orientation="horizontal">
              <Label>Пол</Label>
              {[
                ['m', 'Мужской'],
                ['f', 'Женский'],
              ].map(([id, label]) => (
                <Radio value={id} key={id}>
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    <Label>{label}</Label>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
          )}
        />
        <Row
          prop="язык уведомлений"
          vals={['orientation = vertical']}
          render={() => (
            <RadioGroup defaultValue="ru" orientation="vertical">
              <Label>Язык уведомлений</Label>
              {[
                ['ru', 'Русский'],
                ['kk', 'Қазақша'],
              ].map(([id, label]) => (
                <Radio value={id} key={id}>
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    <Label>{label}</Label>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
          )}
        />
        <Row
          prop="variant"
          vals={values(radioGroupVariants, 'variant')}
          render={(v) => (
            <RadioGroup
              variant={v as never}
              defaultValue={RANKS[1]}
              aria-label={`Разряд (${v})`}
            >
              {RANKS.map((r) => (
                <Radio value={r} key={r}>
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    <Label>{r}</Label>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
          )}
        />
        <Row
          prop="состояния группы"
          vals={['недоступна', 'с ошибкой']}
          render={(v) => (
            <RadioGroup
              isDisabled={v === 'недоступна'}
              isInvalid={v === 'с ошибкой'}
              defaultValue={v === 'недоступна' ? 'ru' : undefined}
              aria-label={`Язык (${v})`}
            >
              <Radio value="ru">
                <Radio.Content>
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  <Label>Русский</Label>
                </Radio.Content>
              </Radio>
              {v === 'с ошибкой' && <ErrorMessage>Выберите язык</ErrorMessage>}
            </RadioGroup>
          )}
        />
      </Section>

      <Section
        name="Radio"
        note="Кнопка живёт только внутри RadioGroup. Точку рисует CSS на ПУСТОМ Indicator (:empty::before) — children её гасят. Своих вариантов нет, вид наследует от группы."
      >
        <Row
          prop="недоступная кнопка"
          vals={['isDisabled на одной из кнопок']}
          render={() => (
            <RadioGroup defaultValue={RANKS[1]} aria-label="Разряд">
              {RANKS.map((r) => (
                /* МС недоступен: разряд подтверждает федерация, не спортсмен. */
                <Radio value={r} key={r} isDisabled={r === 'МС'}>
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    <Label>{r}</Label>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Переключатели ──────────────────────────────────────────────── */
export const Switches = {
  name: 'Переключатели',
  render: () => (
    <Shell>
      <Section
        name="Switch"
        note="Тумблер: Content — кликабельный label, Control — жёлоб, Thumb — бегунок (без него переключателя не видно). Три размера."
      >
        <Row
          prop="анатомия"
          vals={['Content → Control → Thumb + Label']}
          render={() => (
            <Switch defaultSelected>
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label>Онлайн-табло матча</Label>
              </Switch.Content>
            </Switch>
          )}
        />
        <Row
          prop="size"
          vals={values(switchVariants, 'size')}
          render={(v) => (
            <Switch defaultSelected size={v as never}>
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label>Табло</Label>
              </Switch.Content>
            </Switch>
          )}
        />
        {/* Switch.Icon — необязательный слот; в бегунке иконка мельче базовых
            16 px, иначе вылезет за круг. */}
        <Row
          prop="Switch.Icon в бегунке"
          vals={['галочка при включении']}
          render={() => (
            <Switch defaultSelected size="lg">
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb>
                    <Switch.Icon>
                      <Check size={12} />
                    </Switch.Icon>
                  </Switch.Thumb>
                </Switch.Control>
                <Label>Результаты сразу в рейтинг</Label>
              </Switch.Content>
            </Switch>
          )}
        />
        <Row
          prop="состояния"
          vals={['выключен', 'включён', 'недоступен', 'только чтение']}
          render={(v) => (
            <Switch
              defaultSelected={v !== 'выключен'}
              isDisabled={v === 'недоступен'}
              isReadOnly={v === 'только чтение'}
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label>Уведомления</Label>
              </Switch.Content>
            </Switch>
          )}
        />
      </Section>

      <Section
        name="SwitchGroup"
        note="Чисто раскладочный контейнер — НЕ поле: value и onChange у него нет, каждый тумблер живёт сам по себе. Общий заголовок добавляем сами."
      >
        <Row
          prop="orientation"
          vals={values(switchGroupVariants, 'orientation')}
          render={(v) => (
            <div className="flex flex-col gap-2">
              <Label>Уведомления ({v})</Label>
              <SwitchGroup orientation={v as never}>
                {(
                  [
                    ['push', 'Push-уведомления', true],
                    ['mail', 'Письма на почту', false],
                    ['draw', 'SMS о жеребьёвке', false],
                  ] as const
                ).map(([id, label, on]) => (
                  <Switch defaultSelected={on} key={id}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label>{label}</Label>
                    </Switch.Content>
                  </Switch>
                ))}
              </SwitchGroup>
            </div>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Ползунок ───────────────────────────────────────────────────── */
export const Sliders = {
  name: 'Ползунок',
  render: () => (
    <Shell>
      <Section
        name="Slider"
        note="Track обязателен, внутри Fill (закрашенный отрезок) и Thumb. Output сам печатает значение. Marks в пакете — заглушка с TODO, делений не рисует. Вариантов нет — только слоты."
      >
        <Row
          prop="одно значение"
          vals={['Label + Output + Track']}
          render={() => (
            <Slider
              defaultValue={PLAYERS[1].rating}
              minValue={1000}
              maxValue={3000}
              step={5}
              className="w-72"
            >
              <div className="flex w-full items-center justify-between">
                <Label>Рейтинг</Label>
                <Slider.Output />
              </div>
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
          )}
        />
        {/* Диапазон: два Thumb с index, Fill сам закрашивает отрезок между ними;
            Output без children выводит «1500 – 2400». */}
        <Row
          prop="диапазон допуска по рейтингу"
          vals={['value = [1500, 2400]']}
          render={() => (
            <Slider
              defaultValue={[1500, 2400]}
              minValue={1000}
              maxValue={3000}
              step={50}
              aria-label="Диапазон рейтинга"
              className="w-72"
            >
              <Slider.Output />
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb index={0} aria-label="От" />
                <Slider.Thumb index={1} aria-label="До" />
              </Slider.Track>
            </Slider>
          )}
        />
        <Row
          prop="недоступен"
          vals={['isDisabled']}
          render={() => (
            <Slider
              isDisabled
              defaultValue={2000}
              minValue={1000}
              maxValue={3000}
              aria-label="Рейтинг (недоступен)"
              className="w-72"
            >
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Список ─────────────────────────────────────────────────────── */
export const Lists = {
  name: 'Список',
  render: () => (
    <Shell>
      <Section
        name="ListBox"
        note="Список с выбором: работает сам по себе и внутри попапов Select/ComboBox/Autocomplete (там selection-пропсы не задаём — рулит родитель). Два вида: default и danger. Объект вариантов — listboxVariants, с маленькой b."
      >
        <Row
          prop="город проведения"
          vals={['selectionMode = single']}
          render={() => (
            <ListBox
              aria-label="Город проведения"
              selectionMode="single"
              defaultSelectedKeys={[CITIES[0]]}
              className="w-56"
            >
              {CITIES.slice(0, 4).map((c) => (
                <ListBox.Item id={c} key={c} textValue={c}>
                  {c}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          )}
        />
        <Row
          prop="variant"
          vals={values(listboxVariants, 'variant')}
          render={(v) => (
            <ListBox aria-label={`Список (${v})`} variant={v as never} className="w-48">
              <ListBox.Item id="open" textValue="Открыть заявку">
                Открыть заявку
              </ListBox.Item>
              <ListBox.Item id="del" textValue="Удалить заявку">
                Удалить заявку
              </ListBox.Item>
            </ListBox>
          )}
        />
        <Row
          prop="множественный выбор"
          vals={['selectionMode = multiple']}
          render={() => (
            <ListBox
              aria-label="Города рассылки"
              selectionMode="multiple"
              defaultSelectedKeys={[CITIES[0], CITIES[1]]}
              className="w-56"
            >
              {CITIES.slice(0, 4).map((c) => (
                <ListBox.Item id={c} key={c} textValue={c}>
                  {c}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          )}
        />
      </Section>

      <Section
        name="ListBoxItem"
        note="Пункт списка: id — значение выбора, textValue обязателен при нестроковых children, вид danger — для разрушающих действий. Живёт только внутри ListBox."
      >
        <Row
          prop="variant"
          vals={values(listboxItemVariants, 'variant')}
          render={(v) => (
            <ListBox aria-label={`Действия с заявкой (${v})`} className="w-56">
              <ListBox.Item
                id="act"
                variant={v as never}
                textValue={v === 'danger' ? 'Удалить заявку' : 'Изменить заявку'}
              >
                {v === 'danger' ? <Trash2 size={16} /> : <Pencil size={16} />}
                {v === 'danger' ? 'Удалить заявку' : 'Изменить заявку'}
              </ListBox.Item>
            </ListBox>
          )}
        />
        <Row
          prop="недоступный пункт"
          vals={['isDisabled']}
          render={() => (
            <ListBox aria-label="Города" className="w-56">
              <ListBox.Item id="a" textValue={CITIES[0]}>
                {CITIES[0]}
              </ListBox.Item>
              {/* Город недоступен: там нет сертифицированного зала. */}
              <ListBox.Item id="b" isDisabled textValue={CITIES[4]}>
                {CITIES[4]}
              </ListBox.Item>
            </ListBox>
          )}
        />
      </Section>

      <Section
        name="ListBoxSection"
        note="Группа пунктов внутри ListBox: заголовок — компонент Header первым ребёнком. Вариантов нет."
      >
        <Row
          prop="города по регионам"
          vals={['Header + пункты']}
          render={() => (
            <ListBox aria-label="Города по регионам" className="w-56">
              <ListBox.Section>
                <Header>Юг</Header>
                {[CITIES[0], CITIES[2], CITIES[5]].map((c) => (
                  <ListBox.Item id={c} key={c} textValue={c}>
                    {c}
                  </ListBox.Item>
                ))}
              </ListBox.Section>
              <ListBox.Section>
                <Header>Север и центр</Header>
                {[CITIES[1], CITIES[3], CITIES[4]].map((c) => (
                  <ListBox.Item id={c} key={c} textValue={c}>
                    {c}
                  </ListBox.Item>
                ))}
              </ListBox.Section>
            </ListBox>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Селект, комбобокс, автодополнение (закрытые) ───────────────── */
export const Pickers = {
  name: 'Селект и комбобокс',
  render: () => (
    <Shell>
      <Section
        name="Select"
        note="Выпадающий список. API форка value-центричное: value/defaultValue вместо selectedKey из старого RAC. Trigger → Value + Indicator, список — ListBox в Popover-портале. Открытый вид — отдельная история."
      >
        <Row
          prop="город"
          vals={['Label + Trigger + Popover']}
          render={() => (
            <Select defaultValue={CITIES[0]} className="w-56">
              <Label>Город</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {CITIES.map((c) => (
                    <ListBox.Item id={c} key={c}>
                      {c}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
        />
        {/* placeholder — проп корня: его показывает Select.Value, пока пусто. */}
        <Row
          prop="placeholder"
          vals={['разряд не выбран']}
          render={() => (
            <Select placeholder="Выберите разряд" className="w-56">
              <Label>Разряд</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {RANKS.map((r) => (
                    <ListBox.Item id={r} key={r}>
                      {r}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
        />
        <Row
          prop="variant"
          vals={values(selectVariants, 'variant')}
          render={(v) => (
            <Select
              variant={v as never}
              defaultValue={RANKS[1]}
              aria-label={`Разряд (${v})`}
              className="w-44"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {RANKS.map((r) => (
                    <ListBox.Item id={r} key={r}>
                      {r}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
        />
        <Row
          prop="состояния"
          vals={['недоступен', 'с ошибкой']}
          render={(v) => (
            <Select
              isDisabled={v === 'недоступен'}
              isInvalid={v === 'с ошибкой'}
              defaultValue={CITIES[1]}
              aria-label={`Город (${v})`}
              className="w-44"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {CITIES.slice(0, 3).map((c) => (
                    <ListBox.Item id={c} key={c}>
                      {c}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
        />
      </Section>

      <Section
        name="ComboBox"
        note="Поле с вводом и списком: InputGroup → Input + Trigger (шеврон, строго ПОСЛЕДНИМ ребёнком — реализация берёт последнего), Popover-портал с ListBox. Текст выбранного в поле задаёт defaultInputValue; isOpen/defaultOpen у корня НЕТ — открытый вид в отдельной истории (фокус на Input после монтирования)."
      >
        {/* Текст в поле — только через defaultInputValue: один defaultValue его
            не выставит, потому что пункты живут в несмонтированном поповере и
            react-stately не из чего взять текст выбранного. */}
        <Row
          prop="поиск клуба"
          vals={['InputGroup + Popover + defaultInputValue']}
          render={() => (
            <ComboBox
              defaultValue={CLUBS[0]}
              defaultInputValue={CLUBS[0]}
              aria-label="Клуб"
              className="w-64"
            >
              <ComboBox.InputGroup>
                <Input placeholder="Начните вводить название" />
                <ComboBox.Trigger />
              </ComboBox.InputGroup>
              <ComboBox.Popover>
                <ListBox>
                  {CLUBS.map((c) => (
                    <ListBox.Item id={c} key={c}>
                      {c}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </ComboBox.Popover>
            </ComboBox>
          )}
        />
        {/* В tv-объекте comboBoxVariants вариантов нет: variant живёт на корне
            (типы ComboBoxRootProps) и уходит в Input через контекст. */}
        <Row
          prop="variant (с корня, контекстом)"
          vals={['primary', 'secondary']}
          render={(v) => (
            <ComboBox variant={v as never} aria-label={`Клуб (${v})`} className="w-56">
              <ComboBox.InputGroup>
                <Input placeholder="Название клуба" />
                <ComboBox.Trigger />
              </ComboBox.InputGroup>
              <ComboBox.Popover>
                <ListBox>
                  {CLUBS.map((c) => (
                    <ListBox.Item id={c} key={c}>
                      {c}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </ComboBox.Popover>
            </ComboBox>
          )}
        />
      </Section>

      <Section
        name="Autocomplete"
        note="Селект с фильтром: внутри это RAC Select, а не ComboBox — поиск живёт В ПОПАПЕ (Filter → SearchField + ListBox), не в триггере. Открывается defaultOpen — отдельная история."
      >
        <Row
          prop="город"
          vals={['Trigger + ClearButton + Popover']}
          render={() => (
            <Autocomplete defaultValue={CITIES[1]} aria-label="Город" className="w-56">
              <Autocomplete.Trigger>
                <Autocomplete.Value />
                <Autocomplete.ClearButton />
                <Autocomplete.Indicator />
              </Autocomplete.Trigger>
              <Autocomplete.Popover>
                <Autocomplete.Filter>
                  <SearchField aria-label="Поиск города">
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder="Поиск города" />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>
                  <ListBox>
                    {CITIES.map((c) => (
                      <ListBox.Item id={c} key={c}>
                        {c}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Autocomplete.Filter>
              </Autocomplete.Popover>
            </Autocomplete>
          )}
        />
        <Row
          prop="variant"
          vals={values(autocompleteVariants, 'variant')}
          render={(v) => (
            <Autocomplete
              variant={v as never}
              defaultValue={CITIES[0]}
              aria-label={`Город (${v})`}
              className="w-48"
            >
              <Autocomplete.Trigger>
                <Autocomplete.Value />
                <Autocomplete.Indicator />
              </Autocomplete.Trigger>
              <Autocomplete.Popover>
                <Autocomplete.Filter>
                  <SearchField aria-label="Поиск">
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder="Поиск" />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>
                  <ListBox>
                    {CITIES.slice(0, 3).map((c) => (
                      <ListBox.Item id={c} key={c}>
                        {c}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Autocomplete.Filter>
              </Autocomplete.Popover>
            </Autocomplete>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Открытые попапы: по одному порталу на историю, без кликов ──── */
export const SelectOpen = {
  name: 'Select · открытый',
  render: () => (
    <Shell>
      <Section
        name="Select"
        note="Открыт пропом defaultOpen на корне (форк — RAC Select это умеет). Галочка выбранного — ListBox.ItemIndicator внутри пункта. Кольцо фокуса пункта — ring-inset, иначе его режет край поповера."
      >
        <Select defaultOpen defaultValue={CITIES[0]} className="w-56">
          <Label>Город проведения</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {CITIES.map((c) => (
                /* ring-inset: кольцо фокуса внутрь пункта — край поповера
                   (overflow + скругление) внешнее кольцо обрезает. */
                <ListBox.Item id={c} key={c} textValue={c} className="ring-inset">
                  {c}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        {/* Запас высоты, чтобы попапу было куда раскрыться на скриншоте. */}
        <div className="h-80" />
      </Section>
    </Shell>
  ),
};

/* isOpen/defaultOpen у ComboBox нет (react-stately их вырезает из состояния),
   а autoFocus список не открывает: в момент монтирования коллекция пунктов ещё
   пуста — она собирается из несмонтированного поповера тактом позже, и open()
   при пустом списке тихо отменяется. Поэтому фокусируем Input ref-ом после
   монтирования: menuTrigger по умолчанию focus, и фокус по уже заполненной
   коллекции открывает список. */
function ComboBoxOpened() {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <ComboBox aria-label="Клуб" className="w-64">
      <ComboBox.InputGroup>
        <Input ref={inputRef} placeholder="Начните вводить название" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          {CLUBS.map((c) => (
            /* ring-inset: кольцо фокуса пункта рисуем внутрь, чтобы его не
               резал край поповера (у того overflow и скруглённые углы). */
            <ListBox.Item id={c} key={c} className="ring-inset">
              {c}
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

export const ComboBoxOpen = {
  name: 'ComboBox · открытый',
  render: () => (
    <Shell>
      <Section
        name="ComboBox"
        note="isOpen/defaultOpen у корня нет (react-stately их вырезает). menuTrigger по умолчанию — focus, но autoFocus не срабатывает: при монтировании коллекция пунктов ещё пуста и open() тихо отменяется. Поэтому Input фокусируем ref-ом после монтирования — этот фокус и открывает список."
      >
        <ComboBoxOpened />
        <div className="h-80" />
      </Section>
    </Shell>
  ),
};

export const AutocompleteOpen = {
  name: 'Autocomplete · открытый',
  render: () => (
    <Shell>
      <Section
        name="Autocomplete"
        note="Открыт через defaultOpen (корень — RAC Select). Поле поиска — в попапе: набранный текст фильтрует список через Autocomplete.Filter. Кольцо фокуса пункта — ring-inset, иначе его режет край поповера."
      >
        <Autocomplete defaultOpen defaultValue={CITIES[0]} aria-label="Город проведения" className="w-64">
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.Indicator />
          </Autocomplete.Trigger>
          <Autocomplete.Popover>
            <Autocomplete.Filter>
              <SearchField autoFocus aria-label="Поиск города">
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Поиск города" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
              <ListBox>
                {CITIES.map((c) => (
                  /* ring-inset: кольцо фокуса внутрь пункта — край поповера
                     (overflow + скругление) внешнее кольцо обрезает. */
                  <ListBox.Item id={c} key={c} textValue={c} className="ring-inset">
                    {c}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Autocomplete.Filter>
          </Autocomplete.Popover>
        </Autocomplete>
        <div className="h-96" />
      </Section>
    </Shell>
  ),
};

/* ── Теги ───────────────────────────────────────────────────────── */
export const Tags = {
  name: 'Теги',
  render: () => (
    <Shell>
      <Section
        name="TagGroup"
        note="Группа тегов: TagGroup.List обязателен — без него теги не рендерятся. size и variant задаются на группе и уходят тегам контекстом; onRemove включает крестики у всех."
      >
        <Row
          prop="категории турнира"
          vals={['Label + List']}
          render={() => (
            <TagGroup>
              <Label>Категории турнира</Label>
              <TagGroup.List>
                <Tag id="juniors">Юниоры</Tag>
                <Tag id="cadets">Кадеты</Tag>
                <Tag id="adults">Взрослые</Tag>
                <Tag id="veterans">Ветераны</Tag>
              </TagGroup.List>
            </TagGroup>
          )}
        />
        <Row
          prop="выбор нескольких"
          vals={['selectionMode = multiple']}
          render={() => (
            <TagGroup
              selectionMode="multiple"
              defaultSelectedKeys={['juniors', 'adults']}
              aria-label="Категории для заявки"
            >
              <TagGroup.List>
                <Tag id="juniors">Юниоры</Tag>
                <Tag id="cadets">Кадеты</Tag>
                <Tag id="adults">Взрослые</Tag>
              </TagGroup.List>
            </TagGroup>
          )}
        />
        {/* Крестики появляются сами, когда у группы есть onRemove. */}
        <Row
          prop="удаление"
          vals={['onRemove включает крестики']}
          render={() => (
            <TagGroup onRemove={() => {}} aria-label="Выбранные категории">
              <TagGroup.List>
                <Tag id="juniors">Юниоры</Tag>
                <Tag id="adults">Взрослые</Tag>
              </TagGroup.List>
            </TagGroup>
          )}
        />
        <Row
          prop="size"
          vals={values(tagVariants, 'size')}
          render={(v) => (
            <TagGroup size={v as never} aria-label={`Категории (${v})`}>
              <TagGroup.List>
                <Tag id="juniors">Юниоры</Tag>
                <Tag id="adults">Взрослые</Tag>
              </TagGroup.List>
            </TagGroup>
          )}
        />
        <Row
          prop="variant"
          vals={values(tagVariants, 'variant')}
          render={(v) => (
            <TagGroup variant={v as never} aria-label={`Категории (${v})`}>
              <TagGroup.List>
                <Tag id="juniors">Юниоры</Tag>
                <Tag id="adults">Взрослые</Tag>
              </TagGroup.List>
            </TagGroup>
          )}
        />
      </Section>

      <Section
        name="Tag"
        note="Один тег — только внутри TagGroup.List. Пропсы: id, textValue (для нестроковых children), isDisabled, href — тег-ссылка."
      >
        <Row
          prop="недоступный тег"
          vals={['isDisabled']}
          render={() => (
            <TagGroup aria-label="Категории">
              <TagGroup.List>
                <Tag id="adults">Взрослые</Tag>
                {/* Приём заявок в категорию закрыт. */}
                <Tag id="veterans" isDisabled>
                  Ветераны
                </Tag>
              </TagGroup.List>
            </TagGroup>
          )}
        />
        <Row
          prop="тег-ссылка"
          vals={['href']}
          render={() => (
            <TagGroup aria-label="Турниры">
              <TagGroup.List>
                <Tag id="cup" href="#">
                  {TOURNAMENTS[0]}
                </Tag>
                <Tag id="champ" href="#">
                  {TOURNAMENTS[1]}
                </Tag>
              </TagGroup.List>
            </TagGroup>
          )}
        />
      </Section>
    </Shell>
  ),
};
