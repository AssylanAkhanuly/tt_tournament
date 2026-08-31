/* Новый слой макетов (HeroUI): одна точка входа для экранов ролей.
   Рамки устройств — frame, оболочки приложения — chrome, доменные
   компоненты — domain. Аватары A/AW — те же, что во всех макетах. */

export { A, AW } from '../../../fedCommon';
export * from './frame';
export * from './chrome';
export * from './domain';
export * from './calendar';
export * from './quiz';
