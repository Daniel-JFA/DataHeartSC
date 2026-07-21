import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Beneficiary {
  id: string;
  firstName: string;
  lastName: string;
  docType: string;
  docNumber: string;
  gender?: string;
  birthDate?: string;
  city?: string;
  department?: string;
  eps?: string;
  regimen?: string;
  diagnostico?: string;
  status: string;
  deceasedDate?: string;
  celular?: string;
  phone?: string;
  email?: string;
  motherName?: string;
  fatherName?: string;
  createdAt: string;
  _count?: { ayudas: number };
}

export interface BeneficiaryDetail extends Beneficiary {
  address?: string;
  birthCity?: string;
  nationality?: string;
  etnia?: string;
  condicion?: string;
  sisbenGroup?: string;
  otherDiagnosis?: string;
  tratadoEn?: string;
  clinicaHospital?: string;
  motherDocNumber?: string;
  motherPhone?: string;
  motherOccupation?: string;
  motherEducation?: string;
  motherProfession?: string;
  motherLivesWithChild?: boolean;
  motherRespondsEcon?: boolean;
  fatherDocNumber?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  fatherEducation?: string;
  fatherProfession?: string;
  fatherLivesWithChild?: boolean;
  fatherRespondsEcon?: boolean;
  hasSiblings?: boolean;
  numSiblings?: number;
  caregiverName?: string;
  caregiverRelationship?: string;
  caregiverPhone?: string;
  zone?: string;
  housingType?: string;
  housingStrata?: number;
  publicTransportNearby?: boolean;
  numPeopleInHome?: number;
  incomeSource?: string;
  receivesGovSubsidy?: boolean;
  govSubsidyType?: string;
  comoSeEntero?: string;
  lastUpdatedAt?: string;
  isDisplaced?: boolean;
  ayudas: AyudaSummary[];
}

export interface AyudaSummary {
  id: string;
  fecha: string;
  tipoSolicitud: string;
  personasBeneficiadas: number;
  justificacion?: string;
  valor: string;
  estado: string;
}

export interface BeneficiaryStats {
  total: number;
  activos: number;
  fallecidos: number;
  sinEps: number;
  porGenero: { gender: string; _count: { id: number } }[];
  topEps: { eps: string; _count: { id: number } }[];
  topDiag: { diagnostico: string; _count: { id: number } }[];
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class BeneficiariesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/beneficiaries`;

  getAll(page = 1, limit = 20, search = '', status = '') {
    const params = new HttpParams()
      .set('page', page).set('limit', limit)
      .set('search', search).set('status', status);
    return this.http.get<PagedResult<Beneficiary>>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<BeneficiaryDetail>(`${this.base}/${id}`);
  }

  getStats() {
    return this.http.get<BeneficiaryStats>(`${this.base}/stats`);
  }

  create(payload: Record<string, unknown>) {
    return this.http.post<Beneficiary>(this.base, payload);
  }

  update(id: string, payload: Record<string, unknown>) {
    return this.http.put<Beneficiary>(`${this.base}/${id}`, payload);
  }

  deactivate(id: string) {
    return this.http.delete<Beneficiary>(`${this.base}/${id}`);
  }
}
