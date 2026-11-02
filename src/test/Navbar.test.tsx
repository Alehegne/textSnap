import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/Navbar';

describe('Navbar', () => {
  it('renders TextSnap brand name and privacy badge', () => {
    render(<Navbar />);

    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Snap')).toBeInTheDocument();
    expect(screen.getByText(/100% Client-Side/i)).toBeInTheDocument();
  });

  it('triggers onOpenHistory when history button is clicked', () => {
    const handleOpenHistory = vi.fn();
    render(<Navbar onOpenHistory={handleOpenHistory} historyCount={3} />);

    const historyButton = screen.getByRole('button', { name: /history/i });
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(historyButton);
    expect(handleOpenHistory).toHaveBeenCalledTimes(1);
  });
});
