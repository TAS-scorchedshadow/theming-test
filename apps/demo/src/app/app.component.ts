import { Component, inject } from '@angular/core';
import { ButtonComponent } from '@your-org/angular-button';
import { SkinService, SKINS } from './skin.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly skinService = inject(SkinService);
  protected readonly skins = SKINS;
}
