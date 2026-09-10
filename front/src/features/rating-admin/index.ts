/* Правки рейтинга председателем ГСК: неявка, исправление и объединение
   дублей — диалогами по образцу макетов председателя (Э5.4, Э5.9). Утверждение
   протокола — не диалог, а своя страница (`views/rating-tournament`).

   Заведение ✳ (11.09.2026): спортсмен, турнир протоколом вручную, его
   участники и матчи. */

export { NoShowDialog } from './NoShowDialog';
export { CorrectionDialog } from './CorrectionDialog';
export { MergeDialog } from './MergeDialog';
export { AthleteDialog } from './AthleteDialog';
export { TournamentDialog } from './TournamentDialog';
export { ParticipantDialog } from './ParticipantDialog';
export { MatchDialog } from './MatchDialog';
export { LEVELS } from './fields';
export { useRatingActions } from './useRatingActions';
