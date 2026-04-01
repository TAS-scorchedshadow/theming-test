import { Injectable, signal } from '@angular/core';

export interface Skin {
  id: string;
  label: string;
  url: string | null;
}

export const SKINS: Skin[] = [
  { id: 'base',     label: 'Base',     url: null },
  { id: 'client-a', label: 'Client A', url: 'assets/skins/client-a/skin.css' },
  { id: 'client-b', label: 'Client B', url: 'assets/skins/client-b/skin.css' },
];

@Injectable({ providedIn: 'root' })
export class SkinService {
  readonly activeSkin = signal<Skin>(SKINS[0]);

  private readonly linkId = 'active-skin';

  apply(skin: Skin): void {
    document.getElementById(this.linkId)?.remove();

    if (skin.url) {
      const link = document.createElement('link');
      link.id = this.linkId;
      link.rel = 'stylesheet';
      link.href = skin.url;
      document.head.appendChild(link);
    }

    this.activeSkin.set(skin);
  }
}
