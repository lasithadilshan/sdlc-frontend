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
      <p>The Quality Assessment summarizes the model output quality and guides whether the generated script can be used as-is or requires review.</p>
      <h3>Metrics</h3>
      <ul>
        <li><strong>Overall:</strong> Aggregated score (0-100). Thresholds: <strong>&gt;=80</strong> Good, <strong>50–79</strong> Review, <strong>&lt;50</strong> Inspect closely.</li>
        <li><strong>Confidence:</strong> Model's internal confidence in the generated script. Low confidence suggests the model was uncertain; prefer manual review.</li>
        <li><strong>Match:</strong> Format/spec match — how closely the output aligns with expected schemas and patterns.</li>
      </ul>

      <h3>Recommended actions</h3>
      <ul>
        <li><strong>Overall &gt;= 80:</strong> Accept after a quick smoke check.</li>
        <li><strong>50–79:</strong> Review key steps and expected results; run a local dry-run if possible.</li>
        <li><strong>&lt;50:</strong> Do not auto-accept — investigate input, rerun with clarifications, or edit output manually.</li>
      </ul>

      <h3>Examples</h3>
      <ul>
        <li><em>High match + high confidence</em>: Generated feature and steps use expected element selectors and assertions — low-risk.</li>
        <li><em>Medium match + low confidence</em>: Some steps may be vague or use brittle selectors — improve selectors or add waits.</li>
        <li><em>Low match</em>: Output may be misstructured (missing Given/When/Then) or contain non-actionable text — regenerate or edit.</li>
      </ul>

      <div style="text-align:right;margin-top:16px;">
        <button mat-stroked-button mat-dialog-close>Close</button>
      </div>
    </div>
  `
})
export class QaHelpDialogComponent {}
