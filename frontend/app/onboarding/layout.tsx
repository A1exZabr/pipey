'use client';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/Pipey_logo.png" alt="Pipey" className="h-10" />
        </div>
        {children}
      </div>
    </div>
  );
}
