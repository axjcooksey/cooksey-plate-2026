import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster 
      position="bottom-right"
      toastOptions={{
        // Success
        success: {
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
          },
        },
        // Error
        error: {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
          },
        },
        // Default styling
        style: {
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
        },
      }}
    />
  );
}
