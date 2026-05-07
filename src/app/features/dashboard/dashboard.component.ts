import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgxDropzoneModule } from 'ngx-dropzone';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, FormsModule, NgxDropzoneModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);

  // States
  simulateError = signal<boolean>(false);
  ocrResult = signal<string>('');
  creditsRemaining = signal<number>(0);
  parsedResult = signal<any>(null);

  // Custom Schema State
  isCustomSchemaMode = signal<boolean>(false);
  customSchemaStr = signal<string>('{\n  "mileage": "",\n  "lastOilChange": "",\n  "vehicleModel": "",\n  "cost": "",\n  "vin": ""\n}');

  
  // Providers State
  providers = signal([
    { name: 'Google Vision API', status: 'idle', colorClass: 'idle', isActive: true },
    { name: 'AWS Textract', status: 'idle', colorClass: 'idle', isActive: true },
    { name: 'LlamaParse', status: 'idle', colorClass: 'idle', isActive: true },
  ]);

  // Analytics
  requests = signal<any[]>([]);
  chartData = signal<any[]>([
    { name: 'Google Vision API', value: 0 },
    { name: 'AWS Textract', value: 0 },
    { name: 'LlamaParse', value: 0 },
  ]);

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#10b981', '#f59e0b', '#ef4444']
  };

  files: File[] = [];

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/ocr/providers/status').subscribe({
      next: (statuses) => {
        this.providers.update(p => p.map(prov => {
          const matched = statuses.find(s => s.name === prov.name);
          return matched ? { ...prov, isActive: matched.isActive } : prov;
        }));
      },
      error: (err) => console.error('Failed to load initial statuses', err)
    });

    this.http.get<any>('http://localhost:3000/auth/me').subscribe({
      next: (user) => {
        if (user && user.creditsRemaining !== undefined) {
          this.creditsRemaining.set(user.creditsRemaining);
        }
      },
      error: (err) => console.error('Failed to load user', err)
    });
  }

  buyCredits() {
    this.http.post<any>('http://localhost:3000/stripe/create-checkout-session', { email: 'test@example.com' })
      .subscribe({
        next: (res) => {
          window.location.href = res.url;
        },
        error: (err) => console.error('Failed to buy credits', err)
      });
  }

  toggleProvider(name: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    // Optimistic UI Update
    this.providers.update(p => p.map(prov => 
      prov.name === name ? { ...prov, isActive: newStatus } : prov
    ));

    this.http.patch(`http://localhost:3000/ocr/providers/${encodeURIComponent(name)}/toggle`, { isActive: newStatus })
      .subscribe({
        next: () => console.log(`Successfully toggled ${name} to ${newStatus}`),
        error: (err) => {
          console.error(`Failed to toggle ${name}`, err);
          // Revert optimistic update
          this.providers.update(p => p.map(prov => 
            prov.name === name ? { ...prov, isActive: currentStatus } : prov
          ));
        }
      });
  }

  onSelect(event: any) {
    this.files.push(...event.addedFiles);
  }

  onRemove(event: any) {
    this.files.splice(this.files.indexOf(event), 1);
  }

  async uploadFiles() {
    if (this.files.length === 0) return;
    
    // Set Google to active initially
    this.updateProviderStatus('Google Vision API', 'active-google');
    
    // Simulate reading file as base64
    let payload = this.isCustomSchemaMode() ? 'vehicle_service' : 'normal_document';
    if (this.simulateError()) {
      payload = 'trigger_500_error';
      this.updateProviderStatus('Google Vision API', 'error-state');
      // Briefly show AWS taking over
      setTimeout(() => {
         this.updateProviderStatus('AWS Textract', 'active-failover');
      }, 500);
    }

    let url = 'http://localhost:3000/ocr/process';
    let body: any = { documentBase64: payload };

    if (this.isCustomSchemaMode()) {
      url = 'http://localhost:3000/ocr/custom-schema';
      try {
        body.targetSchema = JSON.parse(this.customSchemaStr());
      } catch (e) {
        alert('Invalid JSON in custom schema');
        this.resetProviders();
        return;
      }
    }

    this.http.post<any>(url, 
      body,
      { headers: { 'x-api-key': 'test_api_key_123' } }
    )
      .subscribe({
        next: (res) => {
          this.ocrResult.set(JSON.stringify(res, null, 2));
          this.parsedResult.set(res);
          this.recordAnalytics(res.providerUsed, payload === 'trigger_500_error');
          if (res.creditsRemaining !== undefined) {
            this.creditsRemaining.set(res.creditsRemaining);
          }
          this.resetProviders();
        },
        error: (err) => {
          this.ocrResult.set(JSON.stringify(err.error || err, null, 2));
          this.parsedResult.set(null);
          this.resetProviders();
        }
      });
  }

  updateProviderStatus(name: string, cssClass: string) {
    this.providers.update(p => p.map(prov => 
      prov.name === name ? { ...prov, colorClass: cssClass } : prov
    ));
  }

  resetProviders() {
    setTimeout(() => {
      this.providers.update(p => p.map(prov => ({ ...prov, colorClass: 'idle' })));
    }, 2000);
  }

  recordAnalytics(provider: string, isFailover: boolean) {
    const newReq = { 
      time: new Date().toLocaleTimeString(), 
      provider, 
      status: isFailover ? 'FAILOVER' : 'SUCCESS' 
    };
    this.requests.update(r => [newReq, ...r].slice(0, 10));

    this.chartData.update(data => {
      return data.map(d => {
        if (d.name === provider) {
          return { ...d, value: d.value + 1 };
        }
        return d;
      });
    });
  }
}
