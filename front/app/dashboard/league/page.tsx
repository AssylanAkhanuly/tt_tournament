/* Прежний адрес раздела «Лига»: дивизионы теперь в календаре администратора. */

import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/dashboard');
}
