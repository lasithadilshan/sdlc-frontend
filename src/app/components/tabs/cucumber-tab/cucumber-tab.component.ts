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
import { MatTooltipModule } from '@angular/material/tooltip';
import Prism from 'prismjs';
import 'prismjs/components/prism-gherkin';
import 'prismjs/components/prism-java';
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
    FormsModule,
    MatIconModule,
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
  // qualityAssessment: any = null; // QA disabled
  // processingTime: number | null = null; // removed

  // ring visuals
  ringRadius = 48;
  ringStroke = 8;
  circumference = 2 * Math.PI * this.ringRadius;

  pulse = false;

  // Prism is bundled; no dynamic loader required

  // inline copy state
  copied: { all: boolean; feature: boolean; steps: boolean } = { all: false, feature: false, steps: false };

  constructor(private apiService: ApiService, private dialog: MatDialog) {}

  ngOnInit(): void {
    // Subscribe to selected test case text pushed from Test Case tab
    this.apiService.selectedTestCaseText$.subscribe((text) => {
      if (text) {
        this.testCaseText = text;
      }
    });
  }

  generateCucumber(): void {
    if (!this.uploadedDocument || !this.testCaseText) return;

    this.isLoading = true;
    this.cucumberScript = null;

    this.apiService.convertToCucumber(this.uploadedDocument.documentId, this.testCaseText).subscribe({
      next: (jobResponse) => {
        this.apiService.pollJobStatus(jobResponse.id).subscribe({
          next: (res) => {
            if (res.status === 'SUCCESS') {
              let llmOutput = res.result?.result || res.result;
              this.cucumberScript = llmOutput?.cucumber_script ?? llmOutput?.cucumberScript ?? llmOutput;
              this.parseCucumberScript();
              setTimeout(() => this.highlightCodeBlocks(), 0);
              this.isLoading = false;
            } else {
              console.error('Failed to generate Cucumber script:', res.result);
              this.isLoading = false;
            }
          },
          error: (err) => {
            console.error('Polling error:', err);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error starting job:', error);
        this.isLoading = false;
      }
    });
  }

  private parseCucumberScript(): void {
    this.featureText = null;
    this.stepsText = null;
    if (!this.cucumberScript) return;

    this.featureText = this.extractFencedBlock(this.cucumberScript, 'gherkin');
    this.stepsText = this.extractFencedBlock(this.cucumberScript, 'java');

    if (!this.featureText && !this.stepsText) {
      if (!this.parseByHeaders(this.cucumberScript)) {
        this.featureText = this.cucumberScript;
      }
    }
  }

  private extractFencedBlock(text: string, language: string): string | null {
    const marker = '```' + language;
    const lower = text.toLowerCase();
    const startPos = lower.indexOf(marker);
    if (startPos === -1) return null;
    const afterMarker = text.indexOf('\n', startPos);
    if (afterMarker === -1) return null;
    const endPos = text.indexOf('```', afterMarker + 1);
    if (endPos === -1) return null;
    return text.substring(afterMarker + 1, endPos).trim();
  }

  private parseByHeaders(text: string): boolean {
    const upper = text.toUpperCase();
    const stepIdx = upper.indexOf('**STEP DEFINITIONS');
    if (stepIdx === -1) return false;

    const featureIdx = upper.indexOf('**FEATURE');
    const start = featureIdx !== -1 ? featureIdx : 0;
    const stepEnd = text.indexOf('**', stepIdx + 18);
    const contentStart = stepEnd !== -1 ? stepEnd + 2 : stepIdx + 18;

    this.featureText = text.substring(start, stepIdx).trim();
    this.stepsText = text.substring(contentStart).trim();
    return true;
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

  copyToClipboard(text: string | null, target: 'all' | 'feature' | 'steps'): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied[target] = true;
      setTimeout(() => (this.copied[target] = false), 2300);
    }).catch(() => {
      this.copied[target] = false;
    });
  }

  private highlightCodeBlocks(): void {
    try {
      const blocks: NodeListOf<HTMLElement> = document.querySelectorAll('.code-block');
      blocks.forEach((code) => {
        const inner = code.innerText || '';
        const isSteps = code.dataset['role'] === 'steps';
        const lang = isSteps ? 'language-java' : 'language-gherkin';
        code.innerHTML = `<code class="${lang}"></code>`;
        const created = code.querySelector('code');
        if (created) {
          created.textContent = inner;
          Prism.highlightElement(created);
        }
      });
    } catch {
      // highlight best-effort
    }
  }
}
