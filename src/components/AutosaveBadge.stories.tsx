import type { Meta, StoryObj } from '@storybook/react';
import AutosaveBadge from './AutosaveBadge';

const meta: Meta<typeof AutosaveBadge> = {
  title: 'Studio/AutosaveBadge',
  component: AutosaveBadge,
  parameters: {
    a11y: { disable: false },
  },
  args: {
    status: 'idle',
    ts: null,
  },
};

export default meta;

type Story = StoryObj<typeof AutosaveBadge>;

export const Idle: Story = {
  args: { status: 'idle', ts: null },
};

export const Saving: Story = {
  args: { status: 'saving', ts: null },
};

export const Saved: Story = {
  args: { status: 'saved', ts: Date.now() },
};