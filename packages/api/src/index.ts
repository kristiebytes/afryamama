import * as Types from '@afryamama/types';

export class AfyaMamaAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    // Ensure no trailing slash
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Response body was not JSON, ignore
        }
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error: any) {
      console.error(`API Request to ${url} failed:`, error);
      throw error;
    }
  }

  // Health
  async checkHealth(): Promise<Types.HealthResponse> {
    return this.request<Types.HealthResponse>('GET', '/api/health');
  }

  // Auth
  async login(payload: Types.LoginRequest): Promise<Types.LoginResponse> {
    const res = await this.request<Types.LoginResponse>('POST', '/api/auth/login', payload);
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async register(payload: Types.RegisterRequest): Promise<Types.LoginResponse> {
    const res = await this.request<Types.LoginResponse>('POST', '/api/auth/register', payload);
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  // Users
  async getUsers(): Promise<Types.User[]> {
    return this.request<Types.User[]>('GET', '/api/users');
  }

  async getUser(id: string): Promise<Types.User> {
    return this.request<Types.User>('GET', `/api/users/${id}`);
  }

  // Mothers
  async getMothers(): Promise<Types.Mother[]> {
    return this.request<Types.Mother[]>('GET', '/api/mothers');
  }

  async getMother(id: string): Promise<Types.Mother> {
    return this.request<Types.Mother>('GET', `/api/mothers/${id}`);
  }

  async createMother(mother: Partial<Types.Mother>): Promise<Types.Mother> {
    return this.request<Types.Mother>('POST', '/api/mothers', mother);
  }

  async updateMother(id: string, mother: Partial<Types.Mother>): Promise<Types.Mother> {
    return this.request<Types.Mother>('PUT', `/api/mothers/${id}`, mother);
  }

  // Doctors
  async getDoctors(): Promise<Types.Doctor[]> {
    return this.request<Types.Doctor[]>('GET', '/api/doctors');
  }

  async getDoctor(id: string): Promise<Types.Doctor> {
    return this.request<Types.Doctor>('GET', `/api/doctors/${id}`);
  }

  async createDoctor(doctor: Partial<Types.Doctor>): Promise<Types.Doctor> {
    return this.request<Types.Doctor>('POST', '/api/doctors', doctor);
  }

  async updateDoctor(id: string, doctor: Partial<Types.Doctor>): Promise<Types.Doctor> {
    return this.request<Types.Doctor>('PUT', `/api/doctors/${id}`, doctor);
  }

  // Children
  async getChildren(motherId?: string): Promise<Types.Child[]> {
    const path = motherId ? `/api/children?motherId=${motherId}` : '/api/children';
    return this.request<Types.Child[]>('GET', path);
  }

  async getChild(id: string): Promise<Types.Child> {
    return this.request<Types.Child>('GET', `/api/children/${id}`);
  }

  async createChild(child: Partial<Types.Child>): Promise<Types.Child> {
    return this.request<Types.Child>('POST', '/api/children', child);
  }

  // Pregnancies
  async getPregnancies(motherId?: string): Promise<Types.Pregnancy[]> {
    const path = motherId ? `/api/pregnancies?motherId=${motherId}` : '/api/pregnancies';
    return this.request<Types.Pregnancy[]>('GET', path);
  }

  async getPregnancy(id: string): Promise<Types.Pregnancy> {
    return this.request<Types.Pregnancy>('GET', `/api/pregnancies/${id}`);
  }

  async createPregnancy(pregnancy: Partial<Types.Pregnancy>): Promise<Types.Pregnancy> {
    return this.request<Types.Pregnancy>('POST', '/api/pregnancies', pregnancy);
  }

  // Appointments
  async getAppointments(role?: 'mother' | 'doctor', profileId?: string): Promise<Types.Appointment[]> {
    let path = '/api/appointments';
    if (role && profileId) {
      path += `?role=${role}&profileId=${profileId}`;
    }
    return this.request<Types.Appointment[]>('GET', path);
  }

  async getAppointment(id: string): Promise<Types.Appointment> {
    return this.request<Types.Appointment>('GET', `/api/appointments/${id}`);
  }

  async createAppointment(appointment: Partial<Types.Appointment>): Promise<Types.Appointment> {
    return this.request<Types.Appointment>('POST', '/api/appointments', appointment);
  }

  async updateAppointmentStatus(id: string, status: Types.AppointmentStatus): Promise<Types.Appointment> {
    return this.request<Types.Appointment>('PATCH', `/api/appointments/${id}/status`, { status });
  }

  // Maternal Records
  async getMaternalRecords(pregnancyId?: string): Promise<Types.MaternalRecord[]> {
    const path = pregnancyId ? `/api/maternal-records?pregnancyId=${pregnancyId}` : '/api/maternal-records';
    return this.request<Types.MaternalRecord[]>('GET', path);
  }

  async createMaternalRecord(record: Partial<Types.MaternalRecord>): Promise<Types.MaternalRecord> {
    return this.request<Types.MaternalRecord>('POST', '/api/maternal-records', record);
  }

  // Growth Records
  async getGrowthRecords(childId?: string): Promise<Types.GrowthRecord[]> {
    const path = childId ? `/api/growth-records?childId=${childId}` : '/api/growth-records';
    return this.request<Types.GrowthRecord[]>('GET', path);
  }

  async createGrowthRecord(record: Partial<Types.GrowthRecord>): Promise<Types.GrowthRecord> {
    return this.request<Types.GrowthRecord>('POST', '/api/growth-records', record);
  }

  // Immunizations
  async getImmunizations(childId?: string): Promise<Types.Immunization[]> {
    const path = childId ? `/api/immunizations?childId=${childId}` : '/api/immunizations';
    return this.request<Types.Immunization[]>('GET', path);
  }

  async updateImmunization(id: string, updates: Partial<Types.Immunization>): Promise<Types.Immunization> {
    return this.request<Types.Immunization>('PUT', `/api/immunizations/${id}`, updates);
  }

  // Wellness Tips
  async getWellnessTips(audience?: string): Promise<Types.WellnessTip[]> {
    const path = audience ? `/api/wellness-tips?audience=${audience}` : '/api/wellness-tips';
    return this.request<Types.WellnessTip[]>('GET', path);
  }

  // Notifications
  async getNotifications(userId?: string): Promise<Types.Notification[]> {
    const path = userId ? `/api/notifications?userId=${userId}` : '/api/notifications';
    return this.request<Types.Notification[]>('GET', path);
  }

  async markNotificationRead(id: string): Promise<Types.Notification> {
    return this.request<Types.Notification>('PATCH', `/api/notifications/${id}/read`);
  }
}
