import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor } from '@storybook/test';
import { cookies } from '@storybook/nextjs/headers.mock';
import { revalidatePath } from '@storybook/nextjs/cache.mock';
import { redirect, getRouter } from '@storybook/nextjs/navigation.mock';

import { accessRoute, login, logout } from './server-actions';

function Component() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <form>
        <button type="submit" formAction={login}>
          Login
        </button>
      </form>
      <form>
        <button type="submit" formAction={logout}>
          Logout
        </button>
      </form>
      <form>
        <button type="submit" formAction={accessRoute}>
          Access protected route
        </button>
      </form>
    </div>
  );
}

export default {
  component: Component,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
    test: {
      // This is needed until Next will update to the React 19 beta: https://github.com/vercel/next.js/pull/65058
      // In the React 19 beta ErrorBoundary errors (such as redirect) are only logged, and not thrown.
      // We will also suspress console.error logs for re the console.error logs for redirect in the next framework.
      // Using the onCaughtError react root option:
      //   react: {
      //     rootOptions: {
      //       onCaughtError(error: unknown) {
      //         if (isNextRouterError(error)) return;
      //         console.error(error);
      //       },
      //     },
      // See: code/frameworks/nextjs/src/preview.tsx
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
} as Meta<typeof Component>;

export const ProtectedWhileLoggedOut: StoryObj<typeof Component> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Access protected route'));

    await expect(cookies().get).toHaveBeenCalledWith('user');
    await expect(redirect).toHaveBeenCalledWith('/');

    await waitFor(() => expect(getRouter().push).toHaveBeenCalled());
  },
};

export const ProtectedWhileLoggedIn: StoryObj<typeof Component> = {
  beforeEach() {
    cookies().set('user', 'storybookjs');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Access protected route'));

    await expect(cookies().get).toHaveBeenLastCalledWith('user');
    await expect(revalidatePath).toHaveBeenLastCalledWith('/');
    await expect(redirect).toHaveBeenLastCalledWith('/protected');

    await waitFor(() => expect(getRouter().push).toHaveBeenCalled());
  },
};

export const Logout: StoryObj<typeof Component> = {
  beforeEach() {
    cookies().set('user', 'storybookjs');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByText('Logout'));
    await expect(cookies().delete).toHaveBeenCalled();
    await expect(revalidatePath).toHaveBeenCalledWith('/');
    await expect(redirect).toHaveBeenCalledWith('/');

    await waitFor(() => expect(getRouter().push).toHaveBeenCalled());
  },
};

export const Login: StoryObj<typeof Component> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Login'));

    await expect(cookies().set).toHaveBeenCalledWith('user', 'storybookjs');
    await expect(revalidatePath).toHaveBeenCalledWith('/');
    await expect(redirect).toHaveBeenCalledWith('/');

    await waitFor(() => expect(getRouter().push).toHaveBeenCalled());
  },
};
