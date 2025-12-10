import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UploadedDocument } from '../../../app.component';
import { ApiService } from '../../../services/api-service.service';

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
    FormsModule
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

  constructor(private apiService: ApiService) {}

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
      alert('Copied to clipboard!');
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
}
