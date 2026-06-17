'use client';

import { useState, useEffect } from 'react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="inbox"]',
    title: 'Incoming messages',
    description: 'Conversations with clients from all connected channels will appear here',
    position: 'right',
  },
  {
    target: '[data-tour="pipeline"]',
    title: 'Sales pipeline',
    description: 'Create deals and move them through the stages',
    position: 'right',
  },
  {
    target: '[data-tour="ai"]',
    title: 'AI Assistant',
    description: 'AI helps you draft replies and suggests the next step',
    position: 'left',
  },
];

interface MicroTourProps {
  onComplete: () => void;
}

export default function MicroTour({ onComplete }: MicroTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const step = tourSteps[currentStep];
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      let top = rect.top + rect.height / 2;
      let left = rect.right + 16;

      if (step.position === 'left') {
        left = rect.left - 320;
      } else if (step.position === 'bottom') {
        top = rect.bottom + 16;
        left = rect.left;
      } else if (step.position === 'top') {
        top = rect.top - 120;
        left = rect.left;
      }

      setTooltipPos({ top, left });

      el.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2', 'relative', 'z-[60]');
      return () => {
        el.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2', 'relative', 'z-[60]');
      };
    }
  }, [currentStep]);

  function handleNext() {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  }

  const step = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onComplete} />

      {/* Tooltip */}
      <div
        className="absolute z-[70] glass-card rounded-2xl p-5 w-72 shadow-xl"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            {currentStep + 1} / {tourSteps.length}
          </span>
          <button onClick={onComplete} className="text-gray-400 hover:text-gray-600 text-sm">
            Skip
          </button>
        </div>
        <h3 className="font-semibold text-lg">{step.title}</h3>
        <p className="text-gray-600 mt-1 text-sm">{step.description}</p>
        <button onClick={handleNext} className="btn-primary w-full mt-4 text-sm">
          {currentStep < tourSteps.length - 1 ? 'Next' : 'Got it!'}
        </button>
      </div>
    </div>
  );
}
