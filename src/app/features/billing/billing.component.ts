import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

declare let Paddle: any;

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  public authService = inject(AuthService);

  pricingTiers = signal([
    { id: 'pri_01ks350xs3pf6j8c2cfnv3sway', name: 'Starter Pack', price: 10, credits: 100, subtitle: '10¢ per page', isPopular: false },
    { id: 'pri_01ks3b13s7dnwps67nzggz5a4y', name: 'Pro Pack', price: 40, credits: 500, subtitle: '8¢ per page (Save 20%)', isPopular: true },
    { id: 'pri_01ks3b2xkhmd23gmjcyp6j28gw', name: 'Scale Pack', price: 100, credits: 2000, subtitle: '5¢ per page (Save 50%)', isPopular: false }
  ]);

  ngOnInit() {
    this.authService.loadUserProfile();

    if (typeof Paddle !== 'undefined') {
      Paddle.Environment.set('sandbox');
      Paddle.Initialize({
        token: 'test_2487c55b34b516a8b8b4dca15cd' // Replace with your actual Sandbox Client Token
      });
    } else {
      console.warn('Paddle.js is not loaded');
    }
  }

  buyCredits(priceId: string) {
    const user = this.authService.currentUser();
    if (!user) {
      alert('Please log in to buy credits.');
      return;
    }

    if (typeof Paddle !== 'undefined') {
      Paddle.Checkout.open({
        items: [
          {
            priceId: priceId,
            quantity: 1
          }
        ],
        customData: {
          userId: user.id
        }
      });
    } else {
      alert('Billing system is currently unavailable. Please try again later.');
    }
  }
}
