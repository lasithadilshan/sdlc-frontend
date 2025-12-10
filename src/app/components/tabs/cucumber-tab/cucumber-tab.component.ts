import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UploadedDocument } from '../../../app.component';
import { ApiService } from '../../../services/api-service.service';
import { QaHelpDialogComponent } from '../qa-help-dialog.component';

@Component({
  selector: 'app-cucumber-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './cucumber-tab.component.html',
  styleUrl: './cucumber-tab.component.css'
})
export class CucumberTabComponent implements OnInit {
  @Input() uploadedDocument: UploadedDocument | null = null;

  testCaseText: string = '';
  isLoading = false;
  cucumberScript: string | null = null;
  // parsed parts
  featureText: string | null = null;
  stepsText: string | null = null;
  qualityAssessment: any = null;
  processingTime: number | null = null;

  // ring visuals
  ringRadius = 48;
  ringStroke = 8;
  circumference = 2 * Math.PI * this.ringRadius;

  pulse = false;

  prismLoaded = false;

  constructor(private apiService: ApiService, private snackBar: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void {
    // Subscribe to selected test case text pushed from Test Case tab
    this.apiService.selectedTestCaseText$.subscribe((text) => {
      if (text) {
        this.testCaseText = text;
      }
    });
  }

  generateCucumber(): void {
    if (!this.uploadedDocument || !this.testCaseText) {
      return;
    }

    this.isLoading = true;
    this.cucumberScript = null;
    this.qualityAssessment = null;
    this.processingTime = null;

    this.apiService.convertToCucumber(this.uploadedDocument.documentId, this.testCaseText).subscribe({
      next: (response) => {
        this.cucumberScript = response.cucumber_script;
        // parse parts for nicer UI (feature vs step definitions)
        this.parseCucumberScript();
        this.qualityAssessment = response.quality_assessment;
        this.processingTime = response.processing_time_seconds;
        // visual pulse when new QA arrives
        this.triggerPulse();
        // ensure Prism is loaded and highlight any code blocks
        this.ensurePrismLoaded().then(() => this.highlightCodeBlocks());
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating Cucumber script:', error);
        this.isLoading = false;
      }
    });
  }

  private parseCucumberScript(): void {
    this.featureText = null;
    this.stepsText = null;
    if (!this.cucumberScript) return;

    // Try to extract fenced gherkin and java blocks first
    const gherkinMatch = /```gherkin\s*([\s\S]*?)```/i.exec(this.cucumberScript);
    const javaMatch = /```java\s*([\s\S]*?)```/i.exec(this.cucumberScript);
    if (gherkinMatch) {
      this.featureText = gherkinMatch[1].trim();
    }
    if (javaMatch) {
      this.stepsText = javaMatch[1].trim();
    }

    // Fallback: look for section headers like **FEATURE FILE** and **STEP DEFINITIONS**
    if (!this.featureText || !this.stepsText) {
      const featureHeader = /\*\*\s*FEATURE[\s\S]*?\*\*/i;
      const stepHeader = /\*\*\s*STEP DEFINITIONS[\s\S]*?\*\*/i;
      if (featureHeader.test(this.cucumberScript) && stepHeader.test(this.cucumberScript)) {
        // split at STEP DEFINITIONS marker
        const parts = this.cucumberScript.split(/\*\*\s*STEP DEFINITIONS[\s\S]*?\*\*/i);
        if (parts && parts.length >= 2) {
          this.featureText = (this.featureText || parts[0]).trim();
          this.stepsText = (this.stepsText || parts.slice(1).join('\n---\n')).trim();
        }
      }
    }

    // Final fallback: if no explicit markers and script is present, put everything into featureText
    if (!this.featureText && !this.stepsText) {
      this.featureText = this.cucumberScript;
    }
  }

  downloadFile(filename: string, content: string | null): void {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard', 'Close', { duration: 2500 });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 2500 });
    });
  }

  // Return a color for level strings (Low/Medium/High or similar)
  getLevelColor(level: string | undefined | null): string {
    if (!level) return '#9e9e9e';
    const l = ('' + level).toLowerCase();
    if (l.includes('high') || Number(l) > 80) return '#2e7d32'; // green
    if (l.includes('medium') || (Number(l) >= 40 && Number(l) <= 80)) return '#f6a000'; // amber
    if (l.includes('low') || Number(l) < 40) return '#d32f2f'; // red
    return '#607d8b';
  }

  // Normalize numeric score to 0-100 percent
  getScorePercent(val: any): number {
    const n = Number(val);
    if (isNaN(n)) return 0;
    if (n < 0) return 0;
    if (n > 100) return Math.round(n);
    return Math.round(n);
  }

  // Return stroke-dashoffset for given numeric score (0-100)
  getStrokeDashoffset(val: any): number {
    const percent = this.getScorePercent(val) / 100;
    return Math.round(this.circumference * (1 - percent));
  }

  triggerPulse(): void {
    this.pulse = true;
    setTimeout(() => (this.pulse = false), 900);
  }

  openQaHelp(): void {
    this.dialog.open(QaHelpDialogComponent, { width: '520px' });
  }

  private ensurePrismLoaded(): Promise<void> {
    if ((window as any).Prism) {
      this.prismLoaded = true;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const cssId = 'prism-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
        document.head.appendChild(link);
      }

      const scriptId = 'prism-js';
      if (document.getElementById(scriptId)) {
        // wait for it to be available
        const check = () => {
          if ((window as any).Prism) return resolve();
          setTimeout(check, 50);
        };
        check();
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
      script.onload = () => {
        this.prismLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Prism.js'));
      document.body.appendChild(script);
    });
  }

  private highlightCodeBlocks(): void {
    if (!(window as any).Prism) return;
    setTimeout(() => {
      const blocks: NodeListOf<HTMLElement> = document.querySelectorAll('.code-block');
      blocks.forEach((b) => {
        const code = b as HTMLElement;
        // Prism expects <code> elements inside <pre>; create temporary if needed
        const codeEl = code.querySelector('code') as HTMLElement | null;
        if (codeEl && (window as any).Prism.highlightElement) {
          (window as any).Prism.highlightElement(codeEl);
        } else if ((window as any).Prism.highlightElement) {
          // wrap inner text into a code element temporarily
          const inner = code.innerText;
          code.innerHTML = `<code class="language-javascript"></code>`;
          const created = code.querySelector('code') as HTMLElement;
          created.textContent = inner;
          (window as any).Prism.highlightElement(created);
        }
      });
    }, 150);
  }
}
