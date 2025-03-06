import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// Server-side unauthorized handler
export const handleServerUnauthorized = () => {
    const headersList = headers();
    const path = headersList.get('x-pathname') || '/';
    redirect('/api/defauth/login?returnTo=' + encodeURIComponent(path));
};

// Server-side API response handler
export const handleServerApiResponse = async (apiUrl: string, response: Response) => {
    if (response.status === 401) {
        handleServerUnauthorized();
        return null;
    }

    if (!response.ok) {
        throw new Error(`API call failed: ${response.status} for ${apiUrl}`);
    }

    return response.json();
}; 