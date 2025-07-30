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

  it('should show tooltip with DaisyUI classes when full payee name is different', () => {
    const { container } = render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const tooltipElement = container.querySelector('.tooltip');
    expect(tooltipElement).toBeDefined();
    expect(tooltipElement).toHaveAttribute('data-tip', 'PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL');
  });

  it('should not show tooltip when payee names are the same', () => {
    const { container } = render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal"
      />
    );

    const tooltipElement = container.querySelector('.tooltip');
    expect(tooltipElement).toBeNull();
  });

  it('should not show tooltip when no full payee name provided', () => {
    const { container } = render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
      />
    );

    const tooltipElement = container.querySelector('.tooltip');
    expect(tooltipElement).toBeNull();
  });

  it('should have cursor-help styling when tooltip is shown', () => {
    render(
      <PayeeTooltip
        cleanPayeeName="PayPal"
        fullPayeeName="PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL"
      />
    );

    const payeeElement = screen.getByText('PayPal');
    expect(payeeElement).toHaveClass('cursor-help');
  });
});
