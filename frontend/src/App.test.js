import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

test('basic reality check', () => {
    expect(1 + 1).toBe(2);
});

test('basic render sanity check', () => {
    render(<div>Sanity Check</div>);
    expect(screen.getByText(/Sanity Check/i)).toBeInTheDocument();
});
