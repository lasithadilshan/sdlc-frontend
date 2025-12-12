import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UploadedDocument } from '../../../app.component';
import { ApiService } from '../../../services/api-service.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-test-case-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './test-case-tab.component.html',
  styleUrl: './test-case-tab.component.css'
})
export class TestCaseTabComponent {
  @Input() uploadedDocument: UploadedDocument | null = null;
  @Input() generatedUserStories: any[] | null = null;

  userStoryText: string = '';
  isLoading = false;
  testCases: any = null;
  qualityAssessment: any = null; // QA temporarily present (UI disabled)
  parseError: any = null;

  // Export progress state
  isExporting = false;
  exportProgress = 0; // number of items processed
  exportTotal = 0; // total items to process

  get exportPercent(): number {
    return this.exportTotal ? Math.round((this.exportProgress / this.exportTotal) * 100) : 0;
  }

  constructor(private apiService: ApiService, private dialogService: DialogService) {}

  exportToPdf(): void {
    if (!this.testCases) return;

    // Build a simple printable HTML document for the test cases (same approach as user-story export)
    const styles = `
      body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#1f2b3a; margin:20px}
      .tc-id{display:inline-block;background:linear-gradient(90deg,#6b5bff,#6ec1ff);color:white;padding:6px 12px;border-radius:20px;font-weight:700;margin-right:8px}
      .tc-priority{display:inline-block;padding:6px 12px;border-radius:18px;font-weight:700;background:#ffecec;color:#c62828;margin-left:8px}
      .tc-title{font-size:18px;font-weight:800;margin:8px 0}
      .tc-section{background:#f7fbff;border-left:6px solid #89a7ff;padding:12px;border-radius:6px;margin-top:12px}
      .tc-section ul{margin:0;padding-left:18px}
      .tc-section ol{margin:0;padding-left:18px}
      hr{border:none;border-top:1px solid #eee;margin:22px 0}
      .meta-row{display:flex;justify-content:space-between;margin-top:14px;border-top:1px solid #eef2f6;padding-top:12px}
      .meta-label{font-size:11px;color:#6b7280;font-weight:700}
      .meta-value{font-size:15px;color:#1f2b3a}
    `;

    let body = `<html><head><meta charset="utf-8"><title>Test Cases</title><style>${styles}</style></head><body>`;

    const items = Array.isArray(this.testCases) ? this.testCases : [this.testCases];
    items.forEach((tc: any, idx: number) => {
      const id = tc.id || tc.ID || `TC_${idx + 1}`;
      const title = tc.title || tc.name || `Test Case ${idx + 1}`;
      const priority = tc.priority || tc.priorityLevel || tc.Priority || null;
      const pre = Array.isArray(tc.preconditions) ? tc.preconditions : (tc.preconditions ? [tc.preconditions] : []);
      const data = Array.isArray(tc.test_data) ? tc.test_data : (tc.test_data ? [tc.test_data] : []);
      const steps = Array.isArray(tc.test_steps || tc.steps) ? (tc.test_steps || tc.steps) : ((tc.test_steps || tc.steps) ? [tc.test_steps || tc.steps] : []);
      const expected = Array.isArray(tc.expected_results || tc.expected) ? (tc.expected_results || tc.expected) : ((tc.expected_results || tc.expected) ? [tc.expected_results || tc.expected] : []);

      body += `
        <div class="tc">
          <div>
            <span class="tc-id">${this.escapeHtml(id)}</span>
            ${priority ? `<span class="tc-priority">${this.escapeHtml(priority)}</span>` : ''}
          </div>
          <div class="tc-title">${this.escapeHtml(title)}</div>

          ${pre.length ? `<div class="tc-section"><div style="font-weight:700;margin-bottom:8px">Preconditions</div><ul>${pre.map((p: any) => `<li>${this.escapeHtml(p)}</li>`).join('')}</ul></div>` : ''}

          ${data.length ? `<div class="tc-section"><div style="font-weight:700;margin-bottom:8px">Test Data</div><ul>${data.map((d: any) => `<li>${this.escapeHtml(d)}</li>`).join('')}</ul></div>` : ''}

          ${steps.length ? `<div class="tc-section"><div style="font-weight:700;margin-bottom:8px">Steps</div><ol>${steps.map((s: any) => `<li>${this.escapeHtml(s)}</li>`).join('')}</ol></div>` : ''}

          ${expected.length ? `<div class="tc-section"><div style="font-weight:700;margin-bottom:8px">Expected Results</div><ul>${expected.map((e: any) => `<li>${this.escapeHtml(e)}</li>`).join('')}</ul></div>` : ''}
        </div>
        <hr />
      `;
    });

    body += `</body></html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.dialogService.showToast('Unable to open print window. Please allow popups for this site.', 'Popup blocked', 'error', 5);
      return;
    }

    printWindow.document.write(body);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to render, then trigger print. Keep window open after print for user to save.
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
  }

  // Direct PDF download using jsPDF + html2canvas
  async exportToPdfDirect(): Promise<void> {
    if (!this.testCases) return;

    try {
      // dynamic imports
      // @ts-ignore
      const jsPDFModule: any = await import('jspdf');
      // @ts-ignore
      const html2canvasModule: any = await import('html2canvas');
      const jsPDF = jsPDFModule.jsPDF ?? jsPDFModule.default ?? jsPDFModule;
      const h2c = html2canvasModule.default ?? html2canvasModule;

      const elements = Array.from(document.querySelectorAll('.tc-card')) as HTMLElement[];
      if (!elements || elements.length === 0) {
        this.exportToPdf();
        return;
      }

      this.isExporting = true;
      this.exportProgress = 0;
      this.exportTotal = elements.length;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const canvas = await (h2c as any)(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('imageJPEG', 1.0);
        const imgWidthPx = canvas.width;
        const pxPerMm = imgWidthPx / (pdfWidth - margin * 2);
        const imgHeightMm = (canvas.height / pxPerMm);

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, margin, pdfWidth - margin * 2, imgHeightMm);

        this.exportProgress = i + 1;
      }

      pdf.save('test-cases.pdf');
      this.isExporting = false;
      this.exportProgress = 0;
      this.exportTotal = 0;
    } catch (err) {
      console.error('Direct PDF export failed:', err);
      this.dialogService.showToast('Direct PDF export failed. Falling back to printable view.', 'Export failed', 'warn', 5);
      this.isExporting = false;
      this.exportProgress = 0;
      this.exportTotal = 0;
      this.exportToPdf();
    }
  }

  // Simple HTML escape
  private escapeHtml(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['generatedUserStories'] && this.generatedUserStories && this.generatedUserStories.length > 0) {
      // Build a user-friendly textual representation of the generated stories
      const parts: string[] = [];
      this.generatedUserStories.forEach((s: any, idx: number) => {
        const title = s.title || (`User Story ${idx + 1}`);
        const storyText = s.story || s.description || '';
        const acceptance = Array.isArray(s.acceptance_criteria) ? s.acceptance_criteria : (s.acceptance_criteria ? [s.acceptance_criteria] : []);
        parts.push(`Title: ${title}`);
        if (storyText) parts.push(`Story: ${storyText}`);
        if (acceptance.length) parts.push(`Acceptance Criteria:\n- ${acceptance.join('\n- ')}`);
        parts.push('');
      });

      // Pre-fill the textarea with the concatenated stories
      this.userStoryText = parts.join('\n');
    }
  }

  isArray(obj: any): boolean {
    return Array.isArray(obj);
  }

  objectKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  }

  generateTestCases(): void {
    if (!this.uploadedDocument || !this.userStoryText) {
      return;
    }

    this.isLoading = true;
    this.testCases = null;
    // this.qualityAssessment = null; // QA disabled
    // this.processingTime = null; // removed

    this.apiService.convertToTestCases(this.uploadedDocument.documentId, this.userStoryText).subscribe({
      next: (response) => {
        const rawTestCases = response.test_cases;
        // this.qualityAssessment = response.quality_assessment; // QA disabled
        try {
          console.log('Quality Assessment:', typeof this.qualityAssessment === 'string' ? this.qualityAssessment : JSON.stringify(this.qualityAssessment, null, 2));
        } catch {
          console.log('Quality Assessment:', this.qualityAssessment);
        }
        // this.processingTime = response.processing_time_seconds; // removed
        this.parseError = response.parse_error || null;

        // If the API returned a string, try to parse it as JSON. If parsing fails,
        // keep the raw string and mark parseError so the template shows the raw text.
        const toArray = (val: any): any[] => {
          if (Array.isArray(val)) return val;
          if (val && typeof val === 'object') {
            if (Array.isArray(val.test_cases)) return val.test_cases;
            if (Array.isArray(val.testCases)) return val.testCases;
            if (Array.isArray(val.cases)) return val.cases;
            if (Array.isArray(val.items)) return val.items;
            // If it looks like a single test case object, wrap in array
            return [val];
          }
          return [];
        };

        let parsed: any = rawTestCases;
        if (typeof rawTestCases === 'string') {
          try {
            parsed = JSON.parse(rawTestCases);
          } catch (err: any) {
            this.testCases = rawTestCases;
            if (!this.parseError) {
              this.parseError = 'Response returned a non-JSON string (could not parse).';
            }
            this.isLoading = false;
            return;
          }
        }

        this.testCases = toArray(parsed);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating test cases:', error);
        this.isLoading = false;
      }
    });
  }

  // Serialize a single test case object into plain text suitable for Cucumber conversion
  private serializeTestCase(tc: any, index: number): string {
    const lines: string[] = [];
    const id = tc.id || tc.ID || `TC_${index + 1}`;
    const title = tc.title || tc.name || `Test Case ${index + 1}`;
    lines.push(`ID: ${id}`);
    lines.push(`Title: ${title}`);

    const preconditions = Array.isArray(tc.preconditions) ? tc.preconditions : (tc.preconditions ? [tc.preconditions] : []);
    if (preconditions.length) {
      lines.push('Preconditions:');
      preconditions.forEach((p: string) => lines.push(`- ${p}`));
    }

    const testData = Array.isArray(tc.test_data) ? tc.test_data : (tc.test_data ? [tc.test_data] : []);
    if (testData.length) {
      lines.push('Test Data:');
      testData.forEach((d: string) => lines.push(`- ${d}`));
    }

    const stepsArr = Array.isArray(tc.test_steps || tc.steps) ? (tc.test_steps || tc.steps) : ((tc.test_steps || tc.steps) ? [tc.test_steps || tc.steps] : []);
    if (stepsArr.length) {
      lines.push('Steps:');
      stepsArr.forEach((s: string, i: number) => lines.push(`${i + 1}. ${s}`));
    }

    const expectedArr = Array.isArray(tc.expected_results || tc.expected) ? (tc.expected_results || tc.expected) : ((tc.expected_results || tc.expected) ? [tc.expected_results || tc.expected] : []);
    const expectedSingle = tc.expected_result || tc.expectedResult;
    if (expectedArr.length || expectedSingle) {
      lines.push('Expected Results:');
      if (expectedArr.length) {
        expectedArr.forEach((e: string) => lines.push(`- ${e}`));
      } else {
        lines.push(`- ${expectedSingle}`);
      }
    }

    return lines.join('\n');
  }

  // Send a selected test case into the Cucumber tab's textarea
  sendToCucumber(tc: any, index: number = 0): void {
    try {
      const text = this.serializeTestCase(tc, index);
      this.apiService.setSelectedTestCaseText(text);
      this.apiService.setSelectedTabIndex(2);
      this.dialogService.showToast('Test case sent to Cucumber tab. Navigating to Cucumber tab...', 'Sent', 'info', 1);
    } catch (e) {
      console.error('Failed to serialize and send test case:', e);
    }
  }

  // Send a selected test case into the Selenium tab's textarea
  sendToSelenium(tc: any, index: number = 0): void {
    try {
      const text = this.serializeTestCase(tc, index);
      this.apiService.setSelectedSeleniumTestCaseText(text);
      // request the main content to switch to the Selenium tab (index 3)
      this.apiService.setSelectedTabIndex(3);
      this.dialogService.showToast('Test case sent to Selenium tab. Navigating to Selenium tab...', 'Sent', 'info', 1);
    } catch (e) {
      console.error('Failed to serialize and send test case to Selenium:', e);
    }
  }
}
