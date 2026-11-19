/* Прежний адрес раздела «Лига»: Лига теперь вид календаря администратора. */

import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/dashboard?view=league');
}
