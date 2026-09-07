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

  private ensureArray<T>(val: T | T[] | null | undefined): T[] {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }

  private renderSectionList(title: string, items: any[], isOrdered = false): string {
    if (!items.length) return '';
    const tag = isOrdered ? 'ol' : 'ul';
    const listItems = items.map((item: any) => `<li>${this.escapeHtml(item)}</li>`).join('');
    return `<div class="tc-section"><div style="font-weight:700;margin-bottom:8px">${this.escapeHtml(title)}</div><${tag}>${listItems}</${tag}></div>`;
  }

  private renderTestCaseHtml(tc: any, idx: number): string {
    const id = tc.id || tc.ID || `TC_${idx + 1}`;
    const title = tc.title || tc.name || `Test Case ${idx + 1}`;
    const priority = tc.priority || tc.priorityLevel || tc.Priority || null;
    const pre = this.ensureArray(tc.preconditions);
    const data = this.ensureArray(tc.test_data);
    const steps = this.ensureArray(tc.test_steps || tc.steps);
    const expected = this.ensureArray(tc.expected_results || tc.expected);

    const priorityBadge = priority ? `<span class="tc-priority">${this.escapeHtml(priority)}</span>` : '';

    return `
      <div class="tc">
        <div>
          <span class="tc-id">${this.escapeHtml(id)}</span>
          ${priorityBadge}
        </div>
        <div class="tc-title">${this.escapeHtml(title)}</div>
        ${this.renderSectionList('Preconditions', pre)}
        ${this.renderSectionList('Test Data', data)}
        ${this.renderSectionList('Steps', steps, true)}
        ${this.renderSectionList('Expected Results', expected)}
      </div>
      <hr />
    `;
  }

  exportToPdf(): void {
    if (!this.testCases) return;

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
    const items = this.ensureArray(this.testCases);
    body += items.map((tc: any, idx: number) => this.renderTestCaseHtml(tc, idx)).join('');
    body += `</body></html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.dialogService.showToast('Unable to open print window. Please allow popups for this site.', 'Popup blocked', 'error', 5);
      return;
    }

    printWindow.document.write(body);
    printWindow.document.close();
    printWindow.focus();

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

      const elements = Array.from(document.querySelectorAll<HTMLElement>('.tc-card'));
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
        const canvas = await h2c(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('imageJPEG', 1.0);
        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;
        const pxPerMm = imgWidthPx / (pdfWidth - margin * 2);
        const imgHeightMm = (imgHeightPx / pxPerMm);

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
      const parts: string[] = [];
      this.generatedUserStories.forEach((s: any, idx: number) => {
        const title = s.title || (`User Story ${idx + 1}`);
        const storyText = s.story || s.description || '';
        const acceptance = this.ensureArray(s.acceptance_criteria);
        parts.push(`Title: ${title}`);
        if (storyText) parts.push(`Story: ${storyText}`);
        if (acceptance.length) parts.push(`Acceptance Criteria:\n- ${acceptance.join('\n- ')}`);
        parts.push('');
      });

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
    if (!this.uploadedDocument || !this.userStoryText) return;

    this.isLoading = true;
    this.testCases = null;

    this.apiService.convertToTestCases(this.uploadedDocument.documentId, this.userStoryText).subscribe({
      next: (jobResponse) => {
        this.apiService.pollJobStatus(jobResponse.id).subscribe({
          next: (res) => this.handleTestCasesResponse(res),
          error: (err) => {
            console.error('Polling error:', err);
            this.parseError = 'Error checking job status';
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error starting job:', error);
        this.parseError = 'Failed to start generation job';
        this.isLoading = false;
      }
    });
  }

  private handleTestCasesResponse(res: any): void {
    if (res.status === 'SUCCESS') {
      this.testCases = this.extractCases(res);
      this.isLoading = false;
    } else {
      this.parseError = 'Failed to generate test cases: ' + JSON.stringify(res.result);
      this.isLoading = false;
    }
  }

  private extractCases(res: any): any {
    const llmOutput = res.result?.result || res.result;
    let cases: any = llmOutput?.test_cases ?? llmOutput?.testCases ?? llmOutput;
    this.parseError = res.result?.parse_error || null;

    if (typeof cases === 'string') {
      try {
        cases = JSON.parse(cases);
      } catch (e) {
        this.parseError = 'Could not parse test cases: ' + String(e);
        return null;
      }
    }

    if (Array.isArray(cases)) return cases;
    if (cases && Array.isArray(cases.test_cases)) return cases.test_cases;
    if (cases && Array.isArray(cases.testCases)) return cases.testCases;
    return cases ? [cases] : null;
  }

  // Serialize a single test case object into plain text suitable for Cucumber conversion
  private serializeTestCase(tc: any, index: number): string {
    const lines: string[] = [];
    const id = tc.id || tc.ID || `TC_${index + 1}`;
    const title = tc.title || tc.name || `Test Case ${index + 1}`;
    lines.push(`ID: ${id}`);
    lines.push(`Title: ${title}`);

    const preconditions = this.ensureArray(tc.preconditions);
    if (preconditions.length) {
      lines.push('Preconditions:');
      preconditions.forEach((p: string) => lines.push(`- ${p}`));
    }

    const testData = this.ensureArray(tc.test_data);
    if (testData.length) {
      lines.push('Test Data:');
      testData.forEach((d: string) => lines.push(`- ${d}`));
    }

    const stepsArr = this.ensureArray(tc.test_steps || tc.steps);
    if (stepsArr.length) {
      lines.push('Steps:');
      stepsArr.forEach((s: string, i: number) => lines.push(`${i + 1}. ${s}`));
    }

    const expectedArr = this.ensureArray(tc.expected_results || tc.expected);
    const expectedSingle = tc.expected_result || tc.expectedResult;
    if (expectedArr.length) {
      lines.push('Expected Results:');
      expectedArr.forEach((e: string) => lines.push(`- ${e}`));
    } else if (expectedSingle) {
      lines.push(`Expected Results:\n- ${expectedSingle}`);
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
