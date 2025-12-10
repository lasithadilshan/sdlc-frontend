import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-qa-help-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="qa-help">
      <h2>Quality Assessment Help</h2>
      <p>The Quality Assessment summarizes the model output quality.</p>
      <ul>
        <li><strong>Overall:</strong> Aggregated score (0-100) representing overall output quality.</li>
        <li><strong>Confidence:</strong> Model's internal confidence in the generated script (higher is better).</li>
        <li><strong>Match:</strong> How closely the generated output matches expected format/spec.</li>
      </ul>
      <p>Use these metrics to decide whether to review or accept the generated scripts. Scores are indicative and should be validated against domain rules.</p>
      <div style="text-align:right;margin-top:16px;">
        <button mat-stroked-button mat-dialog-close>Close</button>
      </div>
    </div>
  `
})
export class QaHelpDialogComponent {}
