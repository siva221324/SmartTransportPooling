import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { environment } from '../environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private tokenSignal = signal<string | null>(localStorage.getItem('token'));
  private roleSignal = signal<string | null>(localStorage.getItem('role'));
  private emailSignal = signal<string | null>(localStorage.getItem('email'));

  isLoggedIn = computed(() => !!this.tokenSignal());
  currentRole = computed(() => this.roleSignal());
  currentEmail = computed(() => this.emailSignal());

  constructor(private http: HttpClient, private router: Router) {}

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, req);
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, req).pipe(
      tap(res => this.setSession(res))
    );
  }

  forgotPassword(email: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email }, { responseType: 'text' });
  }

  resetPassword(token: string, newPassword: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword }, { responseType: 'text' });
  }

  verifyEmail(token: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/verify-email`, { params: { token }, responseType: 'text' });
  }

  resendVerification(email: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { email }, { responseType: 'text' });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  updateProfile(req: RegisterRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, req);
  }

  uploadProfilePic(file: File): Observable<string> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.apiUrl}/profile/picture`, fd, { responseType: 'text' });
  }

  getProfilePicUrl(filename: string): string {
    return `${this.apiUrl}/profile/picture/${filename}`;
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getRole(): string | null {
    return this.roleSignal();
  }

  logout(): void {
    localStorage.clear();
    this.tokenSignal.set(null);
    this.roleSignal.set(null);
    this.emailSignal.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('role', res.role);
    localStorage.setItem('email', res.email);
    this.tokenSignal.set(res.token);
    this.roleSignal.set(res.role);
    this.emailSignal.set(res.email);
  }
}

