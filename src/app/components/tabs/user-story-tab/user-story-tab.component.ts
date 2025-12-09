import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UploadedDocument } from '../../../app.component';
import { ApiService } from '../../../services/api-service.service';

// dynamic imports for optional PDF libraries are used in methods below

@Component({
  selector: 'app-user-story-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatProgressBarModule
  ],
  templateUrl: './user-story-tab.component.html',
  styleUrl: './user-story-tab.component.css'
})
export class UserStoryTabComponent {
  @Input() uploadedDocument: UploadedDocument | null = null;
  isLoading = false;
  userStories: any = null;
  qualityAssessment: any = null;
  processingTime: number | null = null;
  parseError: string | null = null;

  // For template rendering
  parsedUserStories: any[] = [];
  Array = Array;
  @Output() userStoriesGenerated = new EventEmitter<any[]>();
  // Export progress state
  isExporting = false;
  exportProgress = 0; // number of items processed
  exportTotal = 0; // total items to process

  get exportPercent(): number {
    return this.exportTotal ? Math.round((this.exportProgress / this.exportTotal) * 100) : 0;
  }

  constructor(private apiService: ApiService) {}

  generateUserStories(): void {
    if (!this.uploadedDocument) {
      return;
    }

    this.isLoading = true;
    this.userStories = null;
    this.qualityAssessment = null;
    this.processingTime = null;
    this.parseError = null;
    this.parsedUserStories = [];

    this.apiService.generateUserStories(this.uploadedDocument.documentId).subscribe({
      next: (response) => {
        // defensive extraction of stories from response
        let stories: any = response?.user_stories ?? response?.userStories ?? response;

        // If stories is a JSON string, attempt to parse
        if (typeof stories === 'string') {
          try {
            stories = JSON.parse(stories);
          } catch (e) {
            this.parseError = 'Could not parse user stories: ' + (e instanceof Error ? e.message : String(e));
            stories = null;
          }
        }

        if (Array.isArray(stories)) {
          this.parsedUserStories = stories;
        } else if (stories && Array.isArray(stories.user_stories)) {
          this.parsedUserStories = stories.user_stories;
        } else if (stories && Array.isArray(stories.userStories)) {
          this.parsedUserStories = stories.userStories;
        } else if (stories) {
          this.parsedUserStories = [stories];
        } else {
          this.parsedUserStories = [];
        }

        // Emit parsed stories for parent/other tabs
        try {
          this.userStoriesGenerated.emit(this.parsedUserStories);
        } catch (e) {
          // ignore
        }

        // keep original raw for debugging/display if needed
        this.userStories = response?.user_stories ?? response;
        this.qualityAssessment = response?.quality_assessment ?? response?.qualityAssessment ?? null;
        this.processingTime = response?.processing_time_seconds ?? response?.processingTimeSeconds ?? null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating user stories:', error);
        this.parseError = 'Failed to generate user stories';
        this.isLoading = false;
      }
    });
  }

  exportToPdf(): void {
    if (!this.parsedUserStories || this.parsedUserStories.length === 0) {
      return;
    }

    // Build a simple printable HTML document for the stories
    const styles = `
      body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#1f2b3a; margin:20px}
      .id-badge{display:inline-block;background:linear-gradient(90deg,#6b5bff,#6ec1ff);color:white;padding:6px 12px;border-radius:20px;font-weight:700;margin-right:8px}
      .priority-pill{display:inline-block;padding:6px 12px;border-radius:18px;font-weight:700;background:#ffecec;color:#c62828}
      .story-title{font-size:20px;font-weight:800;margin:8px 0}
      .acceptance-box{background:#f7fbff;border-left:6px solid #89a7ff;padding:12px;border-radius:6px;margin-top:12px}
      .acceptance-box ul{margin:0;padding-left:18px}
      .notes-box{background:#fff6e6;border-left:6px solid #ffb74d;padding:12px;border-radius:6px;margin-top:12px}
      .meta-row{display:flex;justify-content:space-between;margin-top:14px;border-top:1px solid #eef2f6;padding-top:12px}
      .meta-label{font-size:11px;color:#6b7280;font-weight:700}
      .meta-value{font-size:15px;color:#1f2b3a}
      hr{border:none;border-top:1px solid #eee;margin:22px 0}
    `;

    let body = `<html><head><meta charset="utf-8"><title>User Stories</title><style>${styles}</style></head><body>`;

    this.parsedUserStories.forEach((story, idx) => {
      const id = story.id || story.ID || `US_${idx + 1}`;
      const title = story.title || `User Story ${idx + 1}`;
      const storyText = story.story || '';
      const acceptance = Array.isArray(story.acceptance_criteria) ? story.acceptance_criteria : (story.acceptance_criteria ? [story.acceptance_criteria] : []);
      const notes = Array.isArray(story.notes) ? story.notes : (story.notes ? [story.notes] : []);
      const points = story.story_points ?? story.storyPoints ?? '-';
      const category = story.category || '-';
      const priority = story.priority ? `<span class="priority-pill">${story.priority}</span>` : '';

      body += `
        <div class="story">
          <div>
            <span class="id-badge">${id}</span>
            ${priority}
          </div>
          <div class="story-title">${this.escapeHtml(title)}</div>
          <div class="story-text">${this.escapeHtml(storyText)}</div>

          <div class="acceptance-box">
            <div style="font-weight:700;margin-bottom:8px">Acceptance Criteria</div>
            <ul>
              ${acceptance.map((a: any) => `<li>${this.escapeHtml(a)}</li>`).join('')}
            </ul>
          </div>

          <div class="meta-row">
            <div><div class="meta-label">STORY POINTS</div><div class="meta-value">${points}</div></div>
            <div style="text-align:right"><div class="meta-label">CATEGORY</div><div class="meta-value">${this.escapeHtml(category)}</div></div>
          </div>

            <div class="notes-box">
            <div style="font-weight:800;margin-bottom:6px">📝 Notes</div>
            <ul>
              ${notes.map((n: any) => `<li>${this.escapeHtml(n)}</li>`).join('')}
            </ul>
          </div>
        </div>
        <hr />
      `;
    });

    body += `</body></html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Unable to open print window. Please allow popups for this site.');
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
    if (!this.parsedUserStories || this.parsedUserStories.length === 0) return;

    try {
      // dynamic imports; use ts-ignore to avoid TypeScript complaining when packages are not installed
      // @ts-ignore
      const jsPDFModule: any = await import('jspdf');
      // @ts-ignore
      const html2canvasModule: any = await import('html2canvas');
      const jsPDF = jsPDFModule.jsPDF ?? jsPDFModule.default ?? jsPDFModule;
      const h2c = html2canvasModule.default ?? html2canvasModule;

      // Collect DOM elements for each story card
      const elements = Array.from(document.querySelectorAll('.user-story-card')) as HTMLElement[];
      if (!elements || elements.length === 0) {
        // Fallback: render our printable HTML string as before
        this.exportToPdf();
        return;
      }

      // initialize export progress state
      this.isExporting = true;
      this.exportProgress = 0;
      this.exportTotal = elements.length;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // mm

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        // use html2canvas to capture the element
        const canvas = await (h2c as any)(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('imageJPEG', 1.0);

        // calculate image dimensions in mm
        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;
        const pxPerMm = imgWidthPx / (pdfWidth - margin * 2);
        const imgHeightMm = (imgHeightPx / pxPerMm);

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, margin, pdfWidth - margin * 2, imgHeightMm);

        // update progress (1-based)
        this.exportProgress = i + 1;
      }

      pdf.save('user-stories.pdf');
      // reset state
      this.isExporting = false;
      this.exportProgress = 0;
      this.exportTotal = 0;
    } catch (err) {
      console.error('Direct PDF export failed:', err);
      alert('Direct PDF export failed. Falling back to printable view.');
      this.isExporting = false;
      this.exportProgress = 0;
      this.exportTotal = 0;
      this.exportToPdf();
    }
  }

  // Simple HTML escape to avoid breaking HTML structure
  private escapeHtml(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
