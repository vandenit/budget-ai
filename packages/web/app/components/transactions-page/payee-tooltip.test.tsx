import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PayeeTooltip } from './payee-tooltip';

// Mock window.innerWidth for mobile detection
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('PayeeTooltip', () => {
  beforeEach(() => {
    // Reset to desktop by default
    mockInnerWidth(1024);
  });

  it('should render clean payee name', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  it('should show info icon when full payee name is different', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const infoIcon = screen.getByRole('button');
    expect(infoIcon).toBeInTheDocument();
    expect(infoIcon).toHaveAttribute('aria-label', 'Payee: PayPal. Press Enter to see full name.');
  });

  it('should not show info icon when payee names are the same', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal"
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should not show info icon when no full payee name provided', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should show tooltip on hover (desktop)', async () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const trigger = screen.getByRole('button');
    
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Full payee name:')).toBeInTheDocument();
      expect(screen.getByText('PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL')).toBeInTheDocument();
    });
  });

  it('should hide tooltip on mouse leave (desktop)', async () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const trigger = screen.getByRole('button');
    
    fireEvent.mouseEnter(trigger);
    await waitFor(() => {
      expect(screen.getByText('Full payee name:')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(trigger);
    await waitFor(() => {
      expect(screen.queryByText('Full payee name:')).not.toBeInTheDocument();
    });
  });

  it('should show tooltip on click (mobile)', async () => {
    // Mock mobile environment
    mockInnerWidth(375);
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: true,
    });

    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const trigger = screen.getByRole('button');
    
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Full payee name:')).toBeInTheDocument();
      expect(screen.getByText('PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL')).toBeInTheDocument();
    });
  });

  it('should toggle tooltip on multiple clicks (mobile)', async () => {
    // Mock mobile environment
    mockInnerWidth(375);
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: true,
    });

    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const trigger = screen.getByRole('button');
    
    // First click - show tooltip
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Full payee name:')).toBeInTheDocument();
    });

    // Second click - hide tooltip
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByText('Full payee name:')).not.toBeInTheDocument();
    });
  });

  it('should show tooltip on Enter key press', async () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const trigger = screen.getByRole('button');
    
    fireEvent.keyDown(trigger, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Full payee name:')).toBeInTheDocument();
    });
  });

  it('should hide tooltip on Escape key press', async () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const trigger = screen.getByRole('button');
    
    // Show tooltip first
    fireEvent.keyDown(trigger, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Full payee name:')).toBeInTheDocument();
    });

    // Hide with Escape
    fireEvent.keyDown(trigger, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('Full payee name:')).not.toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const trigger = screen.getByRole('button');
    
    expect(trigger).toHaveAttribute('tabIndex', '0');
    expect(trigger).toHaveAttribute('aria-label', 'Payee: PayPal. Press Enter to see full name.');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
