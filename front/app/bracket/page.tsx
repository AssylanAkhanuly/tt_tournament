import type { Metadata } from 'next';

import { sampleBracket } from '@/entities/bracket/sample';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';

export const metadata: Metadata = {
  title: 'Сетка турнира · ФНТ РК',
};

export default function SetkaPage() {
  return <BracketFlow bracket={sampleBracket} />;
}
