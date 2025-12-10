import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ToastDialogData {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warn';
  /** optional auto-dismiss duration in seconds; when provided, dialog will auto-close and OK button is hidden */
  durationSeconds?: number;
}

@Component({
  selector: 'app-toast-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './toast-dialog.component.html',
  styleUrls: ['./toast-dialog.component.css']
})
export class ToastDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ToastDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ToastDialogData
  ) {}

  iconForType(): string {
    switch (this.data.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      default:
        return 'info';
    }
  }
}
