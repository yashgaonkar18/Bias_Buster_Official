"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('Verifying your email...');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('Invalid verification link.');
      setError(true);
      return;
    }

    const verifyEmail = async () => {
      try {
        // Automatically call the backend
        const response = await fetch('http://localhost:8000/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus('Email verified successfully! Redirecting to login...');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          const data = await response.json();
          setStatus(data.detail || 'Verification failed. The link may have expired.');
          setError(true);
        }
      } catch (err) {
        setStatus('An error occurred during verification.');
        setError(true);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white shadow rounded-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">BiasBuster</h1>
        <h2 className="text-xl font-semibold mb-4">Email Verification</h2>
        <p className={`text-lg ${error ? 'text-red-500' : 'text-green-600'}`}>
          {status}
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
