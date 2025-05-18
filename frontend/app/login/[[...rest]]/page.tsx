"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl shadow-2xl border border-gray-700 bg-white/5 backdrop-blur p-6">
        <SignIn path="/login" routing="path" signUpUrl="/signup" fallbackRedirectUrl="/"/>
      </div>
    </div>
  );
}
