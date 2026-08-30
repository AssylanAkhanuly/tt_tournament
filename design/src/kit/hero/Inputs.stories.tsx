/* Группа «Ввод» справочника HeroUI 3: текстовые поля, группы с префиксами,
   поиск, числовое поле, код из SMS и служебные части — подпись, описание,
   ошибки, форма. Всё, что спортсмен и судья вводят руками: заявка на турнир,
   поиск игрока, взнос, код подтверждения. Структура частей — из типов пакета. */

import {
  Button,
  Description,
  ErrorMessage,
  FieldError,
  Fieldset,
  Form,
  Input,
  InputGroup,
  InputOTP,
  Label,
  NumberField,
  REGEXP_ONLY_DIGITS,
  SearchField,
  TextArea,
  TextField,
  inputGroupVariants,
  inputOTPVariants,
  inputVariants,
  numberFieldVariants,
  searchFieldVariants,
  textAreaVariants,
} from '@heroui/react';
import { Mail, Phone, Send } from 'lucide-react';
import { CITIES, PLAYERS, Row, Section, Shell, TOURNAMENTS, values } from './HeroKit';

export default {
  title: 'UI-кит/HeroUI/02 · Ввод',
  parameters: { layout: 'fullscreen' },
};

/* Поиск по фамилии — берём её из словаря игроков, а не из головы. */
const SURNAME = PLAYERS[1].nm.split(' ')[0];

/* ── Текстовое поле ─────────────────────────────────────────────── */
export const TextFields = {
  name: 'Текстовое поле',
  render: () => (
    <Shell>
      <Section
        name="TextField"
        note="Обёртка поля: сама не рисует ничего, всё видимое — дети Label, Input, Description, FieldError. Значение и флаги живут на обёртке, вниз идут контекстом."
      >
        {/* Полная анатомия: так поле выглядит в форме заявки спортсмена. */}
        <Row
          prop="анатомия"
          vals={['Label + Input + Description']}
          render={() => (
            <TextField name="fio" defaultValue={PLAYERS[0].nm} isRequired className="w-64">
              <Label>ФИО</Label>
              <Input placeholder="Фамилия Имя" />
              <Description>Как в удостоверении личности</Description>
            </TextField>
          )}
        />
        {/* В textFieldVariants из styles только булев fullWidth — сам variant
            обёртка передаёт контекстом вложенному Input, поэтому перечень
            значений читаем из inputVariants. */}
        <Row
          prop="variant (наследуется полем ввода)"
          vals={values(inputVariants, 'variant')}
          render={(v) => (
            <TextField variant={v as never} className="w-52" aria-label={`Город (${v})`}>
              <Label>Город</Label>
              <Input placeholder={CITIES[0]} />
            </TextField>
          )}
        />
        <Row
          prop="состояния"
          vals={['обычное', 'обязательное', 'недоступно', 'только чтение', 'с ошибкой']}
          render={(v) => (
            <TextField
              className="w-52"
              defaultValue={v === 'только чтение' ? PLAYERS[0].city : undefined}
              isRequired={v === 'обязательное'}
              isDisabled={v === 'недоступно'}
              isReadOnly={v === 'только чтение'}
              isInvalid={v === 'с ошибкой'}
            >
              <Label>Клуб</Label>
              <Input placeholder="Название клуба" />
              {/* ErrorMessage, а не FieldError: он виден без настоящей валидации. */}
              {v === 'с ошибкой' && <ErrorMessage>Укажите клуб</ErrorMessage>}
            </TextField>
          )}
        />
      </Section>

      <Section
        name="Input"
        note="Сам «input»: два вида. Вне TextField обязателен aria-label — подписи-то нет; флаги состояний свои не носит, их даёт родительское поле."
      >
        <Row
          prop="variant"
          vals={values(inputVariants, 'variant')}
          render={(v) => (
            <Input aria-label="Номер участника" placeholder="Номер участника" variant={v as never} />
          )}
        />
        <Row
          prop="fullWidth"
          vals={['false', 'true']}
          render={(v) => (
            <div className="w-64">
              <Input aria-label="Клуб" placeholder="Название клуба" fullWidth={v === 'true'} />
            </div>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Группа ввода и многострочное поле ──────────────────────────── */
export const GroupsAndArea = {
  name: 'Группа ввода и многострочное',
  render: () => (
    <Shell>
      <Section
        name="InputGroup"
        note="Рамка с довесками: Prefix и Suffix — контейнеры до и после поля, внутри обязателен InputGroup.Input (или .TextArea), не обычный Input. Клик по рамке фокусирует поле."
      >
        <Row
          prop="Prefix и Suffix — взнос"
          vals={['валюта с двух сторон']}
          render={() => (
            /* fullWidth растягивает рамку на обёртку, а min-w-0 снимает
               нативную ширину input — иначе он не ужимается, и Suffix
               выталкивается за рамку группы. */
            <TextField aria-label="Сумма взноса" className="w-56">
              <InputGroup fullWidth>
                <InputGroup.Prefix>₸</InputGroup.Prefix>
                <InputGroup.Input placeholder="5000" className="min-w-0" />
                <InputGroup.Suffix>KZT</InputGroup.Suffix>
              </InputGroup>
            </TextField>
          )}
        />
        <Row
          prop="иконка в Prefix"
          vals={['телефон']}
          render={() => (
            <TextField aria-label="Телефон" className="w-56">
              <InputGroup>
                <InputGroup.Prefix>
                  <Phone size={16} />
                </InputGroup.Prefix>
                <InputGroup.Input placeholder="+7 700 000 00 00" />
              </InputGroup>
            </TextField>
          )}
        />
        <Row
          prop="variant"
          vals={values(inputGroupVariants, 'variant')}
          render={(v) => (
            <TextField aria-label={`Сумма взноса (${v})`} className="w-48">
              <InputGroup variant={v as never}>
                <InputGroup.Prefix>₸</InputGroup.Prefix>
                <InputGroup.Input placeholder="5000" />
              </InputGroup>
            </TextField>
          )}
        />
        <Row
          prop="InputGroup.TextArea"
          vals={['многострочное в рамке']}
          render={() => (
            <TextField aria-label="Комментарий врачу" className="w-72">
              <InputGroup>
                <InputGroup.TextArea rows={2} placeholder="Замечания для врача турнира" />
              </InputGroup>
            </TextField>
          )}
        />
      </Section>

      <Section
        name="TextArea"
        note="Многострочный «textarea», два вида. Как и Input — ребёнок TextField: подпись, значение и валидация живут на обёртке; rows работает по-нативному."
      >
        <Row
          prop="анатомия"
          vals={['комментарий врачу из заявки']}
          render={() => (
            <TextField
              defaultValue="Аллергия на пластырь, справка приложена к заявке."
              className="w-80"
            >
              <Label>Комментарий врачу</Label>
              <TextArea rows={3} placeholder="Противопоказания, травмы" />
              <Description>Виден только врачу и главному судье</Description>
            </TextField>
          )}
        />
        <Row
          prop="variant"
          vals={values(textAreaVariants, 'variant')}
          render={(v) => (
            <TextField aria-label={`Комментарий (${v})`} className="w-64">
              <TextArea rows={2} variant={v as never} placeholder="Комментарий" />
            </TextField>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Поиск и число ──────────────────────────────────────────────── */
export const SearchAndNumber = {
  name: 'Поиск и число',
  render: () => (
    <Shell>
      <Section
        name="SearchField"
        note="Поле поиска из частей: Group — рамка, SearchIcon — лупа (встроенная, если без children), Input и ClearButton — крестик. Enter — onSubmit, Esc и крестик — onClear."
      >
        {/* defaultValue не для красоты: при пустом поле ClearButton скрыт CSS-ом
            (data-empty), в статике крестик виден только у заполненного поля. */}
        <Row
          prop="поиск игрока по фамилии"
          vals={[SURNAME]}
          render={() => (
            <SearchField defaultValue={SURNAME} aria-label="Поиск игрока" className="w-64">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Фамилия игрока" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          )}
        />
        <Row
          prop="пустое поле"
          vals={['крестик скрыт']}
          render={() => (
            <SearchField aria-label="Поиск турнира" className="w-64">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Турнир, город, игрок" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          )}
        />
        <Row
          prop="variant"
          vals={values(searchFieldVariants, 'variant')}
          render={(v) => (
            <SearchField
              variant={v as never}
              defaultValue={CITIES[2]}
              aria-label={`Поиск по городу (${v})`}
              className="w-52"
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Город" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          )}
        />
        <Row
          prop="состояния"
          vals={['обычное', 'недоступно']}
          render={(v) => (
            <SearchField
              isDisabled={v === 'недоступно'}
              aria-label={`Поиск игрока (${v})`}
              className="w-52"
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Фамилия игрока" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          )}
        />
      </Section>

      <Section
        name="NumberField"
        note="Число со степперами: Group — рамка, внутри DecrementButton, Input, IncrementButton (минус и плюс встроены). Значение — number, формат — Intl.NumberFormat."
      >
        {/* Взнос в тенге: шаг 500, ниже нуля не уйти, формат валюты из ru-RU. */}
        <Row
          prop="взнос за участие"
          vals={['шаг 500 ₸']}
          render={() => (
            <NumberField
              defaultValue={5000}
              minValue={0}
              step={500}
              formatOptions={{ style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }}
              className="w-56"
            >
              <Label>Взнос за участие</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
              <Description>{TOURNAMENTS[0]}</Description>
            </NumberField>
          )}
        />
        <Row
          prop="variant"
          vals={values(numberFieldVariants, 'variant')}
          render={(v) => (
            <NumberField
              variant={v as never}
              defaultValue={11}
              minValue={0}
              step={1}
              aria-label={`Очки в партии (${v})`}
              className="w-40"
            >
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
          )}
        />
        <Row
          prop="состояния"
          vals={['обычное', 'недоступно', 'с ошибкой']}
          render={(v) => (
            <NumberField
              defaultValue={3}
              minValue={0}
              isDisabled={v === 'недоступно'}
              isInvalid={v === 'с ошибкой'}
              aria-label={`Столов в зале (${v})`}
              className="w-40"
            >
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
              {v === 'с ошибкой' && <ErrorMessage>Мало столов для сетки</ErrorMessage>}
            </NumberField>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Код из SMS ─────────────────────────────────────────────────── */
export const Otp = {
  name: 'Код из SMS',
  render: () => (
    <Shell>
      <Section
        name="InputOTP"
        note="Код подтверждения: настоящий input скрыт, видимые ячейки — Slot с обязательным index. maxLength обязателен; Separator — тире между группами. Один вид на два варианта."
      >
        <Row
          prop="шесть цифр с разделителем"
          vals={['код при входе']}
          render={() => (
            <InputOTP
              maxLength={6}
              defaultValue="482913"
              pattern={REGEXP_ONLY_DIGITS}
              aria-label="Код подтверждения из SMS"
            >
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
              </InputOTP.Group>
              <InputOTP.Separator />
              <InputOTP.Group>
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
          )}
        />
        <Row
          prop="variant"
          vals={values(inputOTPVariants, 'variant')}
          render={(v) => (
            <InputOTP
              variant={v as never}
              maxLength={4}
              defaultValue="4821"
              pattern={REGEXP_ONLY_DIGITS}
              aria-label={`Код подтверждения (${v})`}
            >
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
                <InputOTP.Slot index={3} />
              </InputOTP.Group>
            </InputOTP>
          )}
        />
        <Row
          prop="состояния"
          vals={['пустой', 'недоступен', 'с ошибкой']}
          render={(v) => (
            <InputOTP
              maxLength={4}
              defaultValue={v === 'пустой' ? undefined : '4821'}
              isDisabled={v === 'недоступен'}
              isInvalid={v === 'с ошибкой'}
              pattern={REGEXP_ONLY_DIGITS}
              aria-label={`Код подтверждения (${v})`}
            >
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
                <InputOTP.Slot index={3} />
              </InputOTP.Group>
            </InputOTP>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Подписи и ошибки ───────────────────────────────────────────── */
export const FieldParts = {
  name: 'Подписи и ошибки',
  render: () => (
    <Shell>
      <Section
        name="Label"
        note="Подпись поля; варианты только булевы. Здесь показана отдельно, в бою — всегда ребёнком поля, там она сама связывается с инпутом."
      >
        <Row
          prop="состояния"
          vals={['обычная', 'isRequired', 'isInvalid', 'isDisabled']}
          render={(v) => (
            <Label
              isRequired={v === 'isRequired'}
              isInvalid={v === 'isInvalid'}
              isDisabled={v === 'isDisabled'}
            >
              Фамилия
            </Label>
          )}
        />
      </Section>

      <Section
        name="Description"
        note="Пояснение под полем: кладётся после инпута и связывается с ним через aria-describedby. Вариантов нет."
      >
        <Row
          prop="в поле города"
          vals={['подсказка']}
          render={() => (
            <TextField aria-label="Город" className="w-72">
              <Input placeholder="Город" />
              <Description>Например: {CITIES.slice(0, 3).join(', ')}</Description>
            </TextField>
          )}
        />
      </Section>

      <Section
        name="FieldError"
        note="Ошибка валидации: последним ребёнком поля, в DOM появляется только при invalid. Для статики нужны isInvalid на поле И текст в children — без children при простом isInvalid будет пусто."
      >
        <Row
          prop="isInvalid + children"
          vals={['ошибка видна']}
          render={() => (
            <TextField isInvalid isRequired className="w-72">
              <Label>Год рождения</Label>
              <Input placeholder="ГГГГ" />
              <FieldError>Укажите год рождения</FieldError>
            </TextField>
          )}
        />
      </Section>

      <Section
        name="ErrorMessage"
        note="В отличие от FieldError рендерится всегда — invalid-состояния не ждёт, показ контролируем сами. Удобен для статических макетов ошибок."
      >
        <Row
          prop="рядом с FieldError"
          vals={['текст без настоящей валидации']}
          render={() => (
            <TextField isInvalid className="w-72" aria-label="Дата рождения">
              <Input placeholder="ДД.ММ.ГГГГ" />
              <ErrorMessage>Неверный формат даты</ErrorMessage>
            </TextField>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Форма и группа полей ───────────────────────────────────────── */
export const FormAndFieldset = {
  name: 'Форма и группа полей',
  render: () => (
    <Shell>
      <Section
        name="Fieldset"
        note="Нативный fieldset: Legend — заголовок, Group — контейнер полей (даёт отступы), Actions — кнопки внизу. Нативный disabled на корне гасит все вложенные поля разом."
      >
        <Row
          prop="группа «Контакты» из заявки"
          vals={['Legend + Group + Actions']}
          render={() => (
            <Fieldset className="w-80">
              <Fieldset.Legend>Контакты</Fieldset.Legend>
              <Fieldset.Group>
                <TextField name="phone">
                  <Label>Телефон</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <Phone size={16} />
                    </InputGroup.Prefix>
                    <InputGroup.Input placeholder="+7 700 000 00 00" />
                  </InputGroup>
                </TextField>
                <TextField name="email" type="email">
                  <Label>Электронная почта</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <Mail size={16} />
                    </InputGroup.Prefix>
                    <InputGroup.Input placeholder="you@club.kz" />
                  </InputGroup>
                  <Description>Сюда придёт решение по заявке</Description>
                </TextField>
              </Fieldset.Group>
              <Fieldset.Actions>
                <Button>Сохранить</Button>
              </Fieldset.Actions>
            </Fieldset>
          )}
        />
        <Row
          prop="disabled на корне"
          vals={['вся группа недоступна']}
          render={() => (
            <Fieldset disabled className="w-72">
              <Fieldset.Legend>Контакты</Fieldset.Legend>
              <Fieldset.Group>
                <TextField defaultValue={PLAYERS[2].city}>
                  <Label>Город</Label>
                  <Input />
                </TextField>
              </Fieldset.Group>
              <Fieldset.Actions>
                <Button>Сохранить</Button>
              </Fieldset.Actions>
            </Fieldset>
          )}
        />
      </Section>

      <Section
        name="Form"
        note="Обёртка формы без своих стилей: раздаёт валидацию вложенным полям. Трюк для макетов — validationErrors={{ имяПоля: 'текст' }} помечает поле невалидным, и его пустой FieldError показывает этот текст."
      >
        <Row
          prop="заявка спортсмена с ошибкой"
          vals={['validationErrors']}
          render={() => (
            <Form
              validationErrors={{ birthYear: 'Укажите год рождения' }}
              onSubmit={(e) => e.preventDefault()}
              className="flex w-80 flex-col gap-4"
            >
              <TextField name="fio" defaultValue={PLAYERS[0].nm} isRequired>
                <Label>ФИО</Label>
                <Input placeholder="Фамилия Имя" />
                <FieldError />
              </TextField>
              <TextField name="birthYear" isRequired>
                <Label>Год рождения</Label>
                <Input placeholder="ГГГГ" />
                {/* Пустой FieldError сам выведет текст из validationErrors формы. */}
                <FieldError />
              </TextField>
              <div>
                <Button type="submit">
                  <Send size={16} /> Отправить заявку
                </Button>
              </div>
            </Form>
          )}
        />
      </Section>
    </Shell>
  ),
};
