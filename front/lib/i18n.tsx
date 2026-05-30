"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "ru" | "en" | "kz";
const LANG_KEY = "tt_lang";

function detectLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const stored = localStorage.getItem(LANG_KEY) as Lang | null;
  if (stored && ["ru", "en", "kz"].includes(stored)) return stored;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("en")) return "en";
  if (browser.startsWith("kk") || browser.startsWith("kz")) return "kz";
  return "ru";
}

export const T = {
  ru: {
    // Auth — login
    welcome_back: "С возвращением!",
    enter_phone_hint: "Введите номер телефона для входа.",
    phone_number: "Номер телефона",
    continue: "Продолжить",
    no_account: "Нет аккаунта?",
    register_link: "Зарегистрироваться",
    enter_pin_title: "Введите PIN-код",
    pin_subtitle: "6-значный PIN-код вашего аккаунта.",
    login_btn: "Войти",
    logging_in: "Вход...",
    step: "Шаг",
    step_of: "/",
    full_phone_required: "Введите полный номер телефона.",
    pin_6_required: "Введите 6-значный PIN-код.",
    wrong_credentials: "Неверный номер или PIN-код.",
    // Auth — register
    your_phone_q: "Ваш номер телефона?",
    create_account_hint: "Создайте аккаунт, чтобы участвовать в турнирах.",
    already_account: "Уже есть аккаунт?",
    sign_in_link: "Войти",
    phone_taken: "Этот номер уже зарегистрирован. Войдите в аккаунт.",
    server_error: "Сервер недоступен. Попробуйте позже.",
    checking: "Проверяем...",
    your_name_q: "Как вас зовут?",
    name_subtitle: "Имя увидят другие участники.",
    your_name_label: "Ваше имя",
    name_placeholder: "Алан Смагулов",
    name_min: "Имя должно содержать минимум 2 символа.",
    create_pin_title: "Придумайте PIN-код",
    create_pin_hint: "6 цифр — запомните для входа.",
    confirm_pin_title: "Подтвердите PIN-код",
    confirm_pin_hint: "Введите PIN-код ещё раз.",
    pins_mismatch: "PIN-коды не совпадают.",
    creating: "Создание аккаунта...",
    reg_error: "Ошибка регистрации.",
    // Dashboard nav
    home: "Главная",
    my_tournaments: "Мои турниры",
    profile: "Профиль",
    administrator: "Администратор",
    // Club nav
    tournaments: "Турниры",
    tables: "Столы",
    admins: "Админы",
    settings: "Настройки",
    list_view: "Список",
    calendar_view: "Календарь",
    // Settings page
    club_photo: "Фото клуба",
    club_logo: "Логотип клуба",
    hover_camera_hint: "Наведите на фото и нажмите камеру",
    club_info: "Информация о клубе",
    club_name_placeholder: "Название",
    club_desc_placeholder: "Описание",
    save: "Сохранить",
    saving: "Сохранение...",
    cancel: "Отмена",
    statistics: "Статистика",
    stat_tournaments: "Турниров",
    stat_tables: "Столов",
    stat_admins: "Админов",
    danger_zone: "Опасная зона",
    delete_club: "Удалить клуб",
    delete_club_desc: "Удалит все турниры и данные клуба навсегда.",
    delete_btn: "Удалить",
    language: "Язык",
    language_desc: "Язык интерфейса приложения.",
    logout: "Выйти",
    logout_desc: "Завершить сеанс и выйти из аккаунта.",
    logout_btn: "Выйти из аккаунта",
    // Toasts
    photo_updated: "Фото клуба обновлено",
    photo_error: "Ошибка загрузки фото",
    club_updated: "Клуб обновлён",
    error_generic: "Ошибка.",
    // Misc
    club_admin_badge: "Club Admin",
    dark_theme: "Светлая тема",
    light_theme: "Тёмная тема",
  },
  en: {
    welcome_back: "Welcome back!",
    enter_phone_hint: "Enter your phone number to sign in.",
    phone_number: "Phone number",
    continue: "Continue",
    no_account: "No account?",
    register_link: "Register",
    enter_pin_title: "Enter PIN code",
    pin_subtitle: "Your 6-digit PIN code.",
    login_btn: "Sign in",
    logging_in: "Signing in...",
    step: "Step",
    step_of: "/",
    full_phone_required: "Enter a complete phone number.",
    pin_6_required: "Enter a 6-digit PIN code.",
    wrong_credentials: "Invalid phone or PIN code.",
    your_phone_q: "Your phone number?",
    create_account_hint: "Create an account to join tournaments.",
    already_account: "Already have an account?",
    sign_in_link: "Sign in",
    phone_taken: "This number is already registered. Sign in instead.",
    server_error: "Server unavailable. Try again later.",
    checking: "Checking...",
    your_name_q: "What's your name?",
    name_subtitle: "Other participants will see your name.",
    your_name_label: "Your name",
    name_placeholder: "Alan Smagul",
    name_min: "Name must be at least 2 characters.",
    create_pin_title: "Create a PIN code",
    create_pin_hint: "6 digits — remember it to sign in.",
    confirm_pin_title: "Confirm PIN code",
    confirm_pin_hint: "Enter your PIN code again.",
    pins_mismatch: "PIN codes don't match.",
    creating: "Creating account...",
    reg_error: "Registration error.",
    home: "Home",
    my_tournaments: "My tournaments",
    profile: "Profile",
    administrator: "Administrator",
    tournaments: "Tournaments",
    tables: "Tables",
    admins: "Admins",
    settings: "Settings",
    list_view: "List",
    calendar_view: "Calendar",
    club_photo: "Club photo",
    club_logo: "Club logo",
    hover_camera_hint: "Hover over the photo and click the camera",
    club_info: "Club information",
    club_name_placeholder: "Name",
    club_desc_placeholder: "Description",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    statistics: "Statistics",
    stat_tournaments: "Tournaments",
    stat_tables: "Tables",
    stat_admins: "Admins",
    danger_zone: "Danger zone",
    delete_club: "Delete club",
    delete_club_desc: "Permanently deletes all tournaments and club data.",
    delete_btn: "Delete",
    language: "Language",
    language_desc: "App interface language.",
    logout: "Sign out",
    logout_desc: "End your session and sign out of your account.",
    logout_btn: "Sign out of account",
    photo_updated: "Club photo updated",
    photo_error: "Photo upload error",
    club_updated: "Club updated",
    error_generic: "Error.",
    club_admin_badge: "Club Admin",
    dark_theme: "Light theme",
    light_theme: "Dark theme",
  },
  kz: {
    welcome_back: "Қайта келдіңіз!",
    enter_phone_hint: "Кіру үшін телефон нөміріңізді енгізіңіз.",
    phone_number: "Телефон нөмірі",
    continue: "Жалғастыру",
    no_account: "Аккаунт жоқ па?",
    register_link: "Тіркелу",
    enter_pin_title: "PIN-кодты енгізіңіз",
    pin_subtitle: "Аккаунтыңыздың 6 таңбалы PIN-коды.",
    login_btn: "Кіру",
    logging_in: "Кіру...",
    step: "Қадам",
    step_of: "/",
    full_phone_required: "Толық телефон нөмірін енгізіңіз.",
    pin_6_required: "6 таңбалы PIN-кодты енгізіңіз.",
    wrong_credentials: "Телефон нөмірі немесе PIN-код қате.",
    your_phone_q: "Телефон нөміріңіз?",
    create_account_hint: "Турнирларға қатысу үшін аккаунт жасаңыз.",
    already_account: "Аккаунт бар ма?",
    sign_in_link: "Кіру",
    phone_taken: "Бұл нөмір тіркелген. Аккаунтқа кіріңіз.",
    server_error: "Сервер қолжетімсіз. Кейінірек қайталаңыз.",
    checking: "Тексерілуде...",
    your_name_q: "Атыңыз кім?",
    name_subtitle: "Атыңызды басқа қатысушылар көреді.",
    your_name_label: "Атыңыз",
    name_placeholder: "Алан Смагулов",
    name_min: "Ат кемінде 2 таңбадан тұруы керек.",
    create_pin_title: "PIN-код ойлап табыңыз",
    create_pin_hint: "6 цифр — кіру үшін есте сақтаңыз.",
    confirm_pin_title: "PIN-кодты растаңыз",
    confirm_pin_hint: "PIN-кодты қайта енгізіңіз.",
    pins_mismatch: "PIN-кодтар сәйкес келмейді.",
    creating: "Аккаунт жасалуда...",
    reg_error: "Тіркелу қатесі.",
    home: "Басты бет",
    my_tournaments: "Менің турнирларым",
    profile: "Профиль",
    administrator: "Әкімші",
    tournaments: "Турнирлар",
    tables: "Үстелдер",
    admins: "Әкімшілер",
    settings: "Баптаулар",
    list_view: "Тізім",
    calendar_view: "Күнтізбе",
    club_photo: "Клуб суреті",
    club_logo: "Клуб логотипі",
    hover_camera_hint: "Суретке апарып, камераны басыңыз",
    club_info: "Клуб туралы ақпарат",
    club_name_placeholder: "Атауы",
    club_desc_placeholder: "Сипаттама",
    save: "Сақтау",
    saving: "Сақталуда...",
    cancel: "Бас тарту",
    statistics: "Статистика",
    stat_tournaments: "Турнирлар",
    stat_tables: "Үстелдер",
    stat_admins: "Әкімшілер",
    danger_zone: "Қауіпті аймақ",
    delete_club: "Клубты жою",
    delete_club_desc: "Барлық турнирлар мен клуб деректерін мәңгілік жояды.",
    delete_btn: "Жою",
    language: "Тіл",
    language_desc: "Қолданба интерфейсінің тілі.",
    logout: "Шығу",
    logout_desc: "Сеансты аяқтап, аккаунтан шығу.",
    logout_btn: "Аккаунтан шығу",
    photo_updated: "Клуб суреті жаңартылды",
    photo_error: "Суретті жүктеу қатесі",
    club_updated: "Клуб жаңартылды",
    error_generic: "Қате.",
    club_admin_badge: "Клуб Әкімшісі",
    dark_theme: "Жарық тақырып",
    light_theme: "Күңгірт тақырып",
  },
} as const;

export type TranslationKey = keyof typeof T.ru;
export type Translations = Record<TranslationKey, string>;

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LangCtx = createContext<LangContextType>({
  lang: "ru",
  setLang: () => {},
  t: T.ru as Translations,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }

  return (
    <LangCtx.Provider value={{ lang, setLang, t: T[lang] as Translations }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}
