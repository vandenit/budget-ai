import Loading from './Loading';

interface SmartLoadingProps {
  pageType?: 'overview' | 'transactions' | 'predictions' | 'uncategorised';
  budgetUuid?: string;
}

export default function SmartLoading({ pageType = 'overview', budgetUuid }: SmartLoadingProps) {
  // Determine the page info from pageType prop
  const getPageInfo = () => {
    switch (pageType) {
      case 'predictions':
        return {
          title: 'Predictions',
          loadingText: 'Loading prediction data and charts...',
          description: 'Calculating budget predictions and simulations...'
        };
      case 'uncategorised':
        return {
          title: 'Transactions',
          loadingText: 'Loading AI suggestions and transactions...',
          description: 'Fetching uncategorized transactions and AI suggestions...'
        };
      case 'transactions':
        return {
          title: 'Transactions',
          loadingText: 'Loading transactions...',
          description: 'Fetching transaction data...'
        };
      default:
        return {
          title: 'Budget Overview',
          loadingText: 'Loading budget overview...',
          description: 'Fetching budget data and generating charts...'
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">{pageInfo.title}</h1>

      {/* Prominent loading indicator */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body p-8 text-center">
          <Loading text={pageInfo.loadingText} size="lg" />
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm">
            {pageInfo.description}
          </p>
        </div>
      </div>

      {/* Minimal skeleton content */}
      <div className="space-y-4 opacity-50">
        {/* Universal skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={`skeleton-card-${i}`} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="skeleton h-4 w-24 mb-2"></div>
                <div className="skeleton h-8 w-16"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Universal content skeleton */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={`skeleton-content-${i}`} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="skeleton h-5 w-48 mb-2"></div>
                    <div className="skeleton h-4 w-24"></div>
                  </div>
                  <div className="skeleton h-6 w-20"></div>
                  <div className="skeleton h-8 w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
