'use client';

import { useEffect, useState } from 'react';
import {Showcase} from '@/components/showcase';


export default function Home() {
  const [healthStatus, setHealthStatus] = useState<{ status: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.json();
        setHealthStatus(data);
        setError(null);
      } catch (err) {
        setError('Failed to connect to backend');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Bruin Hot Take
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Backend Status
          </h2>
          
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : healthStatus ? (
            <div className="space-y-2">
              <p className="text-gray-700">
                Status: <span className="font-medium text-green-600">{healthStatus.status}</span>
              </p>
              <p className="text-gray-700">
                Message: <span className="font-medium">{healthStatus.message}</span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to Bruin Hot Take
          </h2>
          <p className="text-gray-600">
            This is a modern full-stack application built with Next.js and Express.
          </p>

          <Showcase/>
        </div>
      </div>
    </main>
  );
}
