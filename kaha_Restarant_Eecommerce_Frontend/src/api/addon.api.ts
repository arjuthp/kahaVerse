import api from './axios';
import type { AddonGroup, Addon } from '../types';

// ===== ADDON GROUP API =====

export const addonGroupApi = {
  // Get all addon groups
  getGroups: async (businessId?: string): Promise<AddonGroup[]> => {
    const params = businessId ? { businessId } : {};
    const { data } = await api.get('/addon-groups', { params });
    return Array.isArray(data) ? data : data.data || [];
  },

  // Get single addon group
  getGroupById: async (id: string): Promise<AddonGroup> => {
    const { data } = await api.get(`/addon-groups/${id}`);
    return data;
  },

  // Create addon group
  createGroup: async (payload: {
    name: string;
    businessId: string;
    isRequired?: boolean;
    minSelect?: number;
    maxSelect?: number;
    selectionType?: 'single' | 'multi';
    isActive?: boolean;
  }): Promise<AddonGroup> => {
    const { data } = await api.post('/addon-groups', payload);
    return data;
  },

  // Update addon group
  updateGroup: async (id: string, payload: Partial<AddonGroup>): Promise<AddonGroup> => {
    const { data } = await api.patch(`/addon-groups/${id}`, payload);
    return data;
  },

  // Delete addon group
  deleteGroup: async (id: string): Promise<void> => {
    await api.delete(`/addon-groups/${id}`);
  },
};

// ===== ADDON API =====

export const addonApi = {
  // Get all addons
  getAddons: async (businessId?: string): Promise<Addon[]> => {
    const params = businessId ? { businessId } : {};
    const { data } = await api.get('/addons', { params });
    return Array.isArray(data) ? data : data.data || [];
  },

  // Get single addon
  getAddonById: async (id: string): Promise<Addon> => {
    const { data } = await api.get(`/addons/${id}`);
    return data;
  },

  // Add addon to group
  addAddon: async (
    groupId: string,
    payload: {
      name: string;
      price: number;
      description?: string;
      coverImg?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ): Promise<Addon> => {
    const { data } = await api.post(`/addon-groups/${groupId}/addons`, payload);
    return data;
  },

  // Update addon
  updateAddon: async (
    groupId: string,
    addonId: string,
    payload: Partial<Addon>,
  ): Promise<Addon> => {
    const { data } = await api.patch(`/addon-groups/${groupId}/addons/${addonId}`, payload);
    return data;
  },

  // Delete addon
  deleteAddon: async (groupId: string, addonId: string): Promise<void> => {
    await api.delete(`/addon-groups/${groupId}/addons/${addonId}`);
  },
};
