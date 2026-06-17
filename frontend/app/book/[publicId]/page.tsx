'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface BookingInfo {
  title: string;
  description?: string;
  duration: number;
  organizationName: string;
  slots: Array<{ date: string; times: string[] }>;
}

export default function BookingPage() {
  const params = useParams();
  const publicId = params.publicId as string;

  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadBookingInfo();
  }, [publicId]);

  async function loadBookingInfo() {
    try {
      const response = await fetch(`${API_URL}/api/book/${publicId}`);
      if (!response.ok) {
        throw new Error('Link not found');
      }
      const data = await response.json();
      setInfo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !name) {
      alert('Please fill in the required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/book/${publicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          date: selectedDate,
          time: selectedTime,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not create booking');
      }

      setSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">😔</div>
          <h1 className="text-xl font-semibold text-gray-900">Link not found</h1>
          <p className="text-gray-500 mt-2">It may have expired or been deleted</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-gray-900">Booking created!</h1>
          <p className="text-gray-500 mt-2">
            We&apos;ll contact you to confirm.
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
            <p><strong>Service:</strong> {info.title}</p>
            <p><strong>Date:</strong> {formatDate(selectedDate!)}</p>
            <p><strong>Time:</strong> {selectedTime}</p>
            <p><strong>Duration:</strong> {info.duration} min.</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedSlot = info.slots.find(s => s.date === selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
            <p className="text-sm opacity-80">{info.organizationName}</p>
            <h1 className="text-2xl font-bold mt-1">{info.title}</h1>
            {info.description && (
              <p className="mt-2 opacity-90">{info.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                ⏱ {info.duration} min.
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a date
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {info.slots.slice(0, 10).map((slot) => (
                  <button
                    key={slot.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(slot.date);
                      setSelectedTime(null);
                    }}
                    className={`p-3 rounded-lg text-center transition-all ${
                      selectedDate === slot.date
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-xs opacity-70">
                      {formatWeekday(slot.date)}
                    </div>
                    <div className="font-semibold">{formatShortDate(slot.date)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedSlot && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a time
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {selectedSlot.times.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 rounded-lg text-center transition-all ${
                        selectedTime === time
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {selectedTime && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What should we call you"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+7 ..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Additional information"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Submitting...' : 'Book now'}
                </button>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          Powered by Pipey
        </p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function formatWeekday(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}
