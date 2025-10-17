import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Commission, TaskComplexity, CommissionStatus } from '../types';
import { mockCommissions } from '../data/mockData';

interface CommissionContextType {
  commissions: Commission[];
  createCommission: (data: Omit<Commission, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'referenceNumber' | 'status'>) => Promise<Commission>;
  updateCommission: (id: string, updates: Partial<Commission>) => Promise<void>;
  deleteCommission: (id: string) => Promise<void>;
  getUserCommissions: (userId: string) => Commission[];
  getCommissionById: (id: string) => Commission | undefined;
}

const CommissionContext = createContext<CommissionContextType | undefined>(undefined);

const STORAGE_KEY = 'parcel_studio_commissions';

export function CommissionProvider({ children }: { children: ReactNode }) {
  const [commissions, setCommissions] = useState<Commission[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCommissions(JSON.parse(stored));
      } catch {
        setCommissions(mockCommissions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCommissions));
      }
    } else {
      setCommissions(mockCommissions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCommissions));
    }
  }, []);

  const saveCommissions = (newCommissions: Commission[]) => {
    setCommissions(newCommissions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCommissions));
  };

  const createCommission = async (
    data: Omit<Commission, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'referenceNumber' | 'status'>
  ): Promise<Commission> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const refNumber = `COM-${year}-${String(commissions.length + 1).padStart(3, '0')}`;

    const newCommission: Commission = {
      ...data,
      id: `comm-${Date.now()}`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      referenceNumber: refNumber,
    };

    const updated = [...commissions, newCommission];
    saveCommissions(updated);

    return newCommission;
  };

  const updateCommission = async (id: string, updates: Partial<Commission>) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const updated = commissions.map(comm =>
      comm.id === id
        ? { ...comm, ...updates, updatedAt: new Date().toISOString() }
        : comm
    );

    saveCommissions(updated);
  };

  const deleteCommission = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const updated = commissions.filter(comm => comm.id !== id);
    saveCommissions(updated);
  };

  const getUserCommissions = (userId: string) => {
    return commissions.filter(comm => comm.userId === userId);
  };

  const getCommissionById = (id: string) => {
    return commissions.find(comm => comm.id === id);
  };

  return (
    <CommissionContext.Provider
      value={{
        commissions,
        createCommission,
        updateCommission,
        deleteCommission,
        getUserCommissions,
        getCommissionById,
      }}
    >
      {children}
    </CommissionContext.Provider>
  );
}

export function useCommissions() {
  const context = useContext(CommissionContext);
  if (!context) {
    throw new Error('useCommissions must be used within a CommissionProvider');
  }
  return context;
}
