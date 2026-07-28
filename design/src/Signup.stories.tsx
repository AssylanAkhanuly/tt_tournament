import type { Meta, StoryObj } from '@storybook/react';
import { TournamentScreen, ApplicationForm, Submitted } from './Signup';

// Экраны флоу «Заявка на турнир» как stories. Появятся в дереве слева
// и переиспользуются в MDX-странице флоу (Signup.mdx).
const meta: Meta = {
  title: 'Мобильное приложение/Игрок/Заявка на турнир',
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj;

export const Open: Story = {
  name: 'Открыть',
  render: () => (
    <TournamentScreen name="Кубок Астаны 2026" dates="12–14 сентября" city="Астана" fee={5000} />
  ),
};

export const Form: Story = {
  name: 'Форма',
  render: () => <ApplicationForm rank="КМС" fee={5000} />,
};

export const Done: Story = {
  name: 'Подано',
  render: () => <Submitted />,
};
