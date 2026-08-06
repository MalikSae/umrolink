import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import React from 'react';

test('renders button without crashing', () => {
  render(<Button>Click me</Button>);
  const button = screen.getByText('Click me');
  expect(button).not.toBeNull();
});
