'use client';

import { useState, useEffect } from 'react';
import { getTransactions } from '@/lib/firebase';

export default function UserTransactions({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const fetchedTransactions = await getTransactions(userId);
        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              transaction.type === 'plan_purchase' 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
            }`}>
              {transaction.type === 'plan_purchase' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-white">
                {transaction.type === 'plan_purchase' ? 'Plan Purchase' : 'Override Purchase'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(transaction.timestamp)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">ID: {transaction.id}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-sm text-gray-900 dark:text-white">
              {formatCurrency(transaction.amount)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {transaction.status}
            </p>
          </div>
        </div>
      ))}
      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <p className="text-sm">No transactions yet</p>
        </div>
      )}
    </div>
  );
} 