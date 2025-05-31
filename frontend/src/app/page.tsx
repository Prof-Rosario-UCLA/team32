'use client';

import { useEffect, useState } from 'react';
import { Showcase } from '@/components/showcase';


export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Bruin Hot Take
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to Bruin Hot Take
          </h2>
          <p className="text-gray-600">
            This is a modern full-stack application built with Next.js and Express.
          </p>
        </div>
        <Showcase />
      </div>
    </main>
  );
}
