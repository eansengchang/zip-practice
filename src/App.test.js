import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the game title', () => {
  render(<App />);
  expect(screen.getByText(/LinkedIn Zip Practice/i)).toBeInTheDocument();
});
