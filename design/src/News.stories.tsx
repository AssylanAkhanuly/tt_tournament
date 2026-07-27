import type { Meta, StoryObj } from '@storybook/react';
import { NewsFeed, Article } from './News';

const meta: Meta = {
  title: 'Экраны/Новости и анонсы',
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj;

export const Feed: Story = { name: 'Лента', render: () => <NewsFeed /> };
export const Post: Story = { name: 'Статья / анонс', render: () => <Article /> };
