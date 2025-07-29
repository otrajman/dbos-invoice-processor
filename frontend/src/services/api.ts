// Type-safe API client for all backend endpoints
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  InvoiceResponse,
  InvoiceSubmissionRequest,
  InvoiceUpdateRequest,
  ApprovalRequest,
  RejectionRequest,
  AssignmentRequest,
  DashboardMetrics,
  ClerkDashboardData,
  ManagerDashboardData,
  Vendor,
  VendorCreateRequest,
  VendorUpdateRequest,
  InvoiceStatus,
  UserRole,
} from '../types';
import { API_BASE_URL } from '../constants';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication (mock for now)
    this.client.interceptors.request.use((config) => {
      // TODO: Add real authentication token
      // Using Finance Manager UUID from seed data for approval permissions
      config.headers['x-user-id'] = '550e8400-e29b-41d4-a716-446655440002';
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ===== INVOICE MANAGEMENT =====

  async uploadInvoice(file: File, metadata?: InvoiceSubmissionRequest['metadata']): Promise<InvoiceResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response: AxiosResponse<ApiResponse<InvoiceResponse>> = await this.client.post(
      '/invoices/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Upload failed');
    }

    return response.data.data;
  }

  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    assignedTo?: string;
    vendorId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<{ invoices: InvoiceResponse[]; pagination: any }> {
    const response: AxiosResponse<ApiResponse<InvoiceResponse[]>> = await this.client.get('/invoices', {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch invoices');
    }

    return {
      invoices: response.data.data,
      pagination: response.data.meta?.pagination,
    };
  }

  async getInvoiceById(id: string): Promise<InvoiceResponse> {
    const response: AxiosResponse<ApiResponse<InvoiceResponse>> = await this.client.get(`/invoices/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch invoice');
    }

    return response.data.data;
  }

  async updateInvoice(id: string, data: InvoiceUpdateRequest): Promise<InvoiceResponse> {
    const response: AxiosResponse<ApiResponse<InvoiceResponse>> = await this.client.put(`/invoices/${id}`, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update invoice');
    }

    return response.data.data;
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.client.delete(`/invoices/${id}`);
  }

  // ===== WORKFLOW ACTIONS =====

  async submitForApproval(id: string): Promise<InvoiceResponse> {
    const response: AxiosResponse<ApiResponse<InvoiceResponse>> = await this.client.post(
      `/invoices/${id}/submit-for-approval`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to submit for approval');
    }

    return response.data.data;
  }

  async approveInvoice(id: string, data: ApprovalRequest): Promise<InvoiceResponse> {
    const response: AxiosResponse<ApiResponse<InvoiceResponse>> = await this.client.post(
      `/invoices/${id}/approve`,
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to approve invoice');
    }

    return response.data.data;
  }

  async rejectInvoice(id: string, data: RejectionRequest): Promise<InvoiceResponse> {
    const response: AxiosResponse<ApiResponse<InvoiceResponse>> = await this.client.post(
      `/invoices/${id}/reject`,
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to reject invoice');
    }

    return response.data.data;
  }

  async assignInvoice(id: string, data: AssignmentRequest): Promise<InvoiceResponse> {
    const response: AxiosResponse<ApiResponse<InvoiceResponse>> = await this.client.post(
      `/invoices/${id}/assign`,
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to assign invoice');
    }

    return response.data.data;
  }

  // ===== DASHBOARD & REPORTING =====

  async getClerkDashboard(): Promise<ClerkDashboardData> {
    const response: AxiosResponse<ApiResponse<ClerkDashboardData>> = await this.client.get('/dashboard/clerk');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch clerk dashboard');
    }

    return response.data.data;
  }

  async getManagerDashboard(): Promise<ManagerDashboardData> {
    const response: AxiosResponse<ApiResponse<ManagerDashboardData>> = await this.client.get('/dashboard/manager');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch manager dashboard');
    }

    return response.data.data;
  }

  async getDashboardMetrics(role?: UserRole): Promise<DashboardMetrics> {
    const response: AxiosResponse<ApiResponse<DashboardMetrics>> = await this.client.get('/dashboard/metrics', {
      params: { role },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch dashboard metrics');
    }

    return response.data.data;
  }

  async getInvoiceQueue(
    status: InvoiceStatus,
    params?: {
      page?: number;
      limit?: number;
      assignedTo?: string;
      priority?: 'high' | 'medium' | 'low';
    }
  ): Promise<{ invoices: InvoiceResponse[]; pagination: any }> {
    const response: AxiosResponse<ApiResponse<InvoiceResponse[]>> = await this.client.get(
      `/invoices/queue/${status}`,
      { params }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch invoice queue');
    }

    return {
      invoices: response.data.data,
      pagination: response.data.meta?.pagination,
    };
  }

  // ===== VENDOR MANAGEMENT =====

  async getVendors(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ vendors: Vendor[]; pagination: any }> {
    const response: AxiosResponse<ApiResponse<Vendor[]>> = await this.client.get('/vendors', {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch vendors');
    }

    return {
      vendors: response.data.data,
      pagination: response.data.meta?.pagination,
    };
  }

  async createVendor(data: VendorCreateRequest): Promise<Vendor> {
    const response: AxiosResponse<ApiResponse<Vendor>> = await this.client.post('/vendors', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create vendor');
    }

    return response.data.data;
  }

  async updateVendor(id: string, data: VendorUpdateRequest): Promise<Vendor> {
    const response: AxiosResponse<ApiResponse<Vendor>> = await this.client.put(`/vendors/${id}`, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update vendor');
    }

    return response.data.data;
  }

  // ===== FILE SERVING =====

  getFileUrl(filePath: string): string {
    // Extract filename from the full path stored in database
    // filePath is stored as "uploads/invoices/filename.pdf" but we need just "filename.pdf"
    // because static middleware serves from uploads/invoices directory at /uploads path
    const filename = filePath.split('/').pop() || filePath;
    return `/uploads/${filename}`;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
