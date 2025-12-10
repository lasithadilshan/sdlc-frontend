import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastDialogComponent, ToastDialogData } from '../shared/toast-dialog/toast-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Show a toast-like dialog. If `durationSeconds` is provided (>0) the dialog will auto-dismiss
   * after that many seconds and the OK button will be hidden.
   */
  showToast(
    message: string,
    title?: string,
    type?: ToastDialogData['type'],
    durationSeconds?: number
  ) {
    const data: ToastDialogData = { message, title, type, durationSeconds };
    const ref = this.dialog.open(ToastDialogComponent, {
      width: '420px',
      data,
      panelClass: ['app-toast-dialog']
    });

    let timer: any = null;
    if (durationSeconds && durationSeconds > 0) {
      // start timer once opened
      ref.afterOpened().subscribe(() => {
        timer = setTimeout(() => {
          try {
            ref.close();
          } catch {}
        }, durationSeconds * 1000);
      });

      // clear timer when dialog closes
      ref.afterClosed().subscribe(() => {
        if (timer) clearTimeout(timer);
      });
    }

    return ref;
  }
}
