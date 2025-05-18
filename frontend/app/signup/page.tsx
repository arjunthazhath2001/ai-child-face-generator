"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <SignUp path="/signup" routing="path" signInUrl="/login"  />
    </div>
  );
}
