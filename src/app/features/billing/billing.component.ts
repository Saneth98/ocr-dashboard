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
    { id: 'pri_starter_placeholder', name: 'Starter Pack', price: 10, credits: 100, subtitle: '10¢ per page', isPopular: false },
    { id: 'pri_pro_placeholder', name: 'Pro Pack', price: 40, credits: 500, subtitle: '8¢ per page (Save 20%)', isPopular: true },
    { id: 'pri_scale_placeholder', name: 'Scale Pack', price: 100, credits: 2000, subtitle: '5¢ per page (Save 50%)', isPopular: false }
  ]);

  ngOnInit() {
    this.authService.loadUserProfile();
    
    if (typeof Paddle !== 'undefined') {
      Paddle.Environment.set('sandbox');
      Paddle.Initialize({
        token: 'your_paddle_client_token' // Replace with your actual Sandbox Client Token
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
