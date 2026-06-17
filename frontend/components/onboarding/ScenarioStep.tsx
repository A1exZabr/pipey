'use client';

interface ScenarioStepProps {
  onSelect: (scenario: 'b2b' | 'services' | 'products') => void;
}

const scenarios = [
  {
    id: 'b2b' as const,
    title: 'B2B sales',
    description: 'Deals with companies, quotes, invoices',
    icon: '🏢',
  },
  {
    id: 'services' as const,
    title: 'Services',
    description: 'Client bookings, calendar, reminders',
    icon: '🛠',
  },
  {
    id: 'products' as const,
    title: 'Products',
    description: 'Product catalog, cards, quick replies',
    icon: '📦',
  },
];

export default function ScenarioStep({ onSelect }: ScenarioStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">What does your business do?</h1>
        <p className="text-gray-500 mt-2">We'll tailor the CRM to your needs</p>
      </div>
      <div className="grid gap-4">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="glass-card rounded-2xl p-6 text-left hover:ring-2 hover:ring-blue-400 transition-all group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <h3 className="text-lg font-medium group-hover:text-blue-600 transition-colors">
                  {s.title}
                </h3>
                <p className="text-gray-500 mt-1">{s.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
