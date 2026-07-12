import client from './client';
import { Vehicle, SearchFilters } from '../types';

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await client.get<Vehicle[]>('/vehicles');
  return res.data;
}

export async function searchVehicles(filters: SearchFilters): Promise<Vehicle[]> {
  // Clean empty filters before sending request
  const cleanedFilters: Record<string, any> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      cleanedFilters[key] = value;
    }
  }

  const res = await client.get<Vehicle[]>('/vehicles/search', { params: cleanedFilters });
  return res.data;
}

export async function purchaseVehicle(id: string): Promise<Vehicle> {
  const res = await client.post<Vehicle>(`/vehicles/${id}/purchase`);
  return res.data;
}

export async function addVehicle(payload: Omit<Vehicle, '_id'>): Promise<Vehicle> {
  const res = await client.post<Vehicle>('/vehicles', payload);
  return res.data;
}

export async function updateVehicle(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
  const res = await client.put<Vehicle>(`/vehicles/${id}`, payload);
  return res.data;
}

export async function deleteVehicle(id: string): Promise<{ message: string }> {
  const res = await client.delete<{ message: string }>(`/vehicles/${id}`);
  return res.data;
}

export async function restockVehicle(id: string, quantity: number): Promise<Vehicle> {
  const res = await client.post<Vehicle>(`/vehicles/${id}/restock`, { quantity });
  return res.data;
}
