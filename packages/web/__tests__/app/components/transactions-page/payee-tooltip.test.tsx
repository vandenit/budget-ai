import { render, screen } from '@testing-library/react';
import { PayeeTooltip } from '../../../../app/components/transactions-page/payee-tooltip';

describe('PayeeTooltip', () => {

  it('should render clean payee name', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    expect(screen.getByText('PayPal')).toBeDefined();
  });

  it('should show info icon when full payee name is different', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const infoIcon = screen.getByRole('button');
    expect(infoIcon).toBeDefined();
    expect(infoIcon).toHaveAttribute('aria-label', 'Payee: PayPal. Press Enter to see full name.');
  });

  it('should not show info icon when payee names are the same', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal"
      />
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('should not show info icon when no full payee name provided', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
      />
    );

    expect(screen.queryByRole('button')).toBeNull();
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
