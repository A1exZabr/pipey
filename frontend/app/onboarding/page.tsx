'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { subscribeToPush, isPushSupported } from '@/lib/push';
import ScenarioStep from '@/components/onboarding/ScenarioStep';
import ChannelStep from '@/components/onboarding/ChannelStep';
import DetailsStep from '@/components/onboarding/DetailsStep';

type Step = 'scenario' | 'channels' | 'details' | 'done';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('scenario');
  const [scenario, setScenario] = useState<'b2b' | 'services' | 'products' | null>(null);

  async function handleScenarioSelect(selected: 'b2b' | 'services' | 'products') {
    setScenario(selected);
    try {
      await api.updateSettings({ scenario: selected });
    } catch (e) {
      console.error('Failed to save scenario:', e);
    }
    setStep('channels');
  }

  function handleChannelsComplete() {
    if (scenario === 'b2b') {
      setStep('details');
    } else {
      handleFinish();
    }
  }

  async function handleFinish() {
    try {
      await api.completeOnboarding();
    } catch (e) {
      console.error('Failed to complete onboarding:', e);
    }
    // Offer push subscription after onboarding
    if (await isPushSupported()) {
      subscribeToPush().catch(() => {/* non-critical */});
    }
    router.push('/inbox?tour=true');
  }

  // Progress bar
  const steps = scenario === 'b2b'
    ? ['scenario', 'channels', 'details']
    : ['scenario', 'channels'];
  const currentIndex = steps.indexOf(step);
  const progress = step === 'done'
    ? 100
    : ((currentIndex + 1) / (steps.length + 1)) * 100;

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {step === 'scenario' && <ScenarioStep onSelect={handleScenarioSelect} />}
      {step === 'channels' && <ChannelStep onComplete={handleChannelsComplete} />}
      {step === 'details' && <DetailsStep onComplete={handleFinish} />}
    </div>
  );
}
