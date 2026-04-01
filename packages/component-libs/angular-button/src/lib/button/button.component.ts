import { Component, Input, booleanAttribute, ViewEncapsulation } from '@angular/core';

export type ButtonVariant = 'primary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'button[libButton], a[libButton]',
  standalone: true,
  template: '<ng-content />',
  styleUrl: './button.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.lib-btn]': 'true',
    '[class.lib-btn--primary]': 'variant === "primary"',
    '[class.lib-btn--ghost]': 'variant === "ghost"',
    '[class.lib-btn--sm]': 'size === "sm"',
    '[class.lib-btn--lg]': 'size === "lg"',
    '[disabled]': 'disabled || null',
    '[attr.aria-disabled]': 'disabled || null',
  },
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input({ transform: booleanAttribute }) disabled = false;
}
