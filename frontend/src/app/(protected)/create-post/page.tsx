'use client';

import { PostForm } from '@/components/post-form';
import ProtectedLayout from '@/app/(protected)/layout';

export default function Page() {
  return (
    <ProtectedLayout>
      <PostForm />
    </ProtectedLayout>
  );
} 