import {Component, inject, signal, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxChartsModule, Color, ScaleType} from '@swimlane/ngx-charts';
import {HttpClient} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {NgxDropzoneModule} from 'ngx-dropzone';
import {AuthService} from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, FormsModule, NgxDropzoneModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  // States
  simulateError = signal<boolean>(false);
  ocrResult = signal<string>('');
  parsedResult = signal<any>(null);

  // Custom Schema State
  isCustomSchemaMode = signal<boolean>(false);
  customSchemaStr = signal<string>('{\n  "mileage": "",\n  "lastOilChange": "",\n  "vehicleModel": "",\n  "cost": "",\n  "vin": ""\n}');

  // Analytics
  requests = signal<any[]>([]);
  chartData = signal<any[]>([
    {name: 'Google Vision API', value: 0},
    {name: 'AWS Textract', value: 0},
    {name: 'LlamaParse', value: 0},
  ]);

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#10b981', '#f59e0b', '#ef4444']
  };

  ngOnInit() {
    this.authService.loadUserProfile();
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.http.get<any[]>('http://localhost:3000/auth/usage').subscribe({
      next: (data) => {
        this.requests.set(data);
        this.updateChartData(data);
      }
    });
  }

  private updateChartData(data: any[]) {
    const counts = {'Google Vision API': 0, 'AWS Textract': 0, 'LlamaParse': 0};
    data.forEach(log => {
      if (counts[log.providerUsed as keyof typeof counts] !== undefined) {
        counts[log.providerUsed as keyof typeof counts]++;
      }
    });
    this.chartData.set([
      {name: 'Google Vision API', value: counts['Google Vision API']},
      {name: 'AWS Textract', value: counts['AWS Textract']},
      {name: 'LlamaParse', value: counts['LlamaParse']},
    ]);
  }

  onSelect(event: any) {
    this.files.push(...event.addedFiles);
  }

  onRemove(event: any) {
    this.files.splice(this.files.indexOf(event), 1);
  }

  files: File[] = [];

  async uploadFiles() {
    if (this.files.length === 0) return;

    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      this.startUploadFlow(base64);
    };
    reader.readAsDataURL(file);
  }

  private startUploadFlow(base64: string) {
    let currentKey = localStorage.getItem('dashboard_play_key');

    if (!currentKey) {
      this.http.post<any>('http://localhost:3000/auth/tokens', {name: 'Dashboard Playground'}).subscribe({
        next: (res) => {
          localStorage.setItem('dashboard_play_key', res.plainTextKey);
          this.performUpload(res.plainTextKey, base64);
        },
        error: (err) => alert('Please generate an API key in the API Keys tab first!')
      });
    } else {
      this.performUpload(currentKey, base64);
    }
  }

  private performUpload(apiKey: string, base64: string) {
    const formData = new FormData();
    // Send the actual file object if available, otherwise fallback to base64
    const file = this.files[0];
    if (file) {
      formData.append('file', file);
    } else {
      formData.append('documentBase64', base64);
    }

    let url = 'http://localhost:3000/ocr/process';
    if (this.isCustomSchemaMode()) {
      url = 'http://localhost:3000/ocr/custom-schema';
      formData.append('targetSchema', this.customSchemaStr());
    }

    this.http.post<any>(url, formData, {
      headers: {'x-api-key': apiKey}
    }).subscribe({
      next: (res) => {

        this.ocrResult.set(JSON.stringify(res, null, 2));
        this.parsedResult.set(res);
        this.recordAnalytics(res.providerUsed, this.simulateError());
        if (res.creditsRemaining !== undefined) {
          this.authService.updateCredits(res.creditsRemaining);
        }
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          console.warn('API Key invalid. Clearing and retrying...');
          localStorage.removeItem('dashboard_play_key');
          this.uploadFiles();
        } else {
          this.ocrResult.set(JSON.stringify(err.error || err, null, 2));
          this.parsedResult.set(null);
        }
      }
    });
  }

  private recordAnalytics(provider: string, isFailover: boolean) {
    this.loadAnalytics(); // Refresh
  }

  buyCredits() {
    alert('Redirecting to Stripe checkout...');
  }
}

