import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Commission } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CommissionContextType {
  commissions: Commission[];
  isLoading: boolean;
  createCommission: (data: Omit<Commission, 'id' | 'createdAt' | 'updatedAt' | 'referenceNumber' | 'status' | 'tags'> & { tags?: string[] }) => Promise<Commission>;
  updateCommission: (id: string, updates: Partial<Commission>) => Promise<void>;
  deleteCommission: (id: string) => Promise<void>;
  getUserCommissions: (userId: string) => Commission[];
  getCommissionById: (id: string) => Commission | undefined;
  loadUserCommissions: () => Promise<void>;
}

const CommissionContext = createContext<CommissionContextType | undefined>(undefined);

export function CommissionProvider({ children }: { children: ReactNode }) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserCommissions();
    } else {
      setCommissions([]);
    }
  }, [user]);

  const createCommission = async (
    data: Omit<Commission, 'id' | 'createdAt' | 'updatedAt' | 'referenceNumber' | 'status' | 'tags'> & { tags?: string[] }
  ): Promise<Commission> => {
    const { data: insertedData, error } = await supabase
      .from('commissions')
      .insert({
        user_id: data.userId,
        task_complexity: data.taskComplexity,
        subject: data.subject,
        description: data.description,
        proposed_amount: data.proposedAmount,
        status: 'draft',
        tags: data.tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    const newCommission: Commission = {
      id: insertedData.id,
      userId: insertedData.user_id,
      taskComplexity: insertedData.task_complexity,
      subject: insertedData.subject,
      description: insertedData.description,
      proposedAmount: Number(insertedData.proposed_amount),
      status: insertedData.status,
      referenceNumber: insertedData.reference_number,
      createdAt: insertedData.created_at,
      updatedAt: insertedData.updated_at,
      tags: insertedData.tags || [],
    };

    setCommissions(prev => [...prev, newCommission]);
    return newCommission;
  };

  const updateCommission = async (id: string, updates: Partial<Commission>) => {
    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.taskComplexity) updateData.task_complexity = updates.taskComplexity;
    if (updates.subject) updateData.subject = updates.subject;
    if (updates.description) updateData.description = updates.description;
    if (updates.proposedAmount !== undefined) updateData.proposed_amount = updates.proposedAmount;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    const { error } = await supabase
      .from('commissions')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    setCommissions(prev =>
      prev.map(comm =>
        comm.id === id ? { ...comm, ...updates, updatedAt: new Date().toISOString() } : comm
      )
    );
  };

  const deleteCommission = async (id: string) => {
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setCommissions(prev => prev.filter(comm => comm.id !== id));
  };

  const loadUserCommissions = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setCommissions([]);
        return;
      }

      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Commission[] = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        taskComplexity: item.task_complexity,
        subject: item.subject,
        description: item.description,
        proposedAmount: Number(item.proposed_amount),
        status: item.status,
        referenceNumber: item.reference_number,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        tags: item.tags || [],
      }));

      setCommissions(mapped);
    } catch (error) {
      console.error('Error loading commissions:', error);
      setCommissions([]);
    } finally {
      setIsLoading(false);
    }
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
        isLoading,
        createCommission,
        updateCommission,
        deleteCommission,
        getUserCommissions,
        getCommissionById,
        loadUserCommissions,
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
