import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-java';
import { UploadedDocument } from '../../../app.component';
import { ApiService } from '../../../services/api-service.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-selenium-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './selenium-tab.component.html',
  styleUrl: './selenium-tab.component.css'
})
export class SeleniumTabComponent implements OnInit {
  @Input() uploadedDocument: UploadedDocument | null = null;

  testCaseText: string = '';
  isLoading = false;
  seleniumScript: string | null = null;
  copied: { all: boolean } = { all: false };
  // qualityAssessment: any = null; // QA disabled

  constructor(private apiService: ApiService, private dialogService: DialogService) {}

  ngOnInit(): void {
    // Subscribe to selected test case text pushed from Test Case tab (for Selenium)
    this.apiService.selectedSeleniumTestCaseText$.subscribe((text) => {
      if (text) {
        this.testCaseText = text;
      }
    });
  }

  generateSelenium(): void {
    if (!this.uploadedDocument || !this.testCaseText) {
      return;
    }

    this.isLoading = true;
    this.seleniumScript = null;
    // this.qualityAssessment = null; // QA disabled

    this.apiService.convertToSelenium(this.uploadedDocument.documentId, this.testCaseText).subscribe({
      next: (response) => {
          this.seleniumScript = response.selenium_script;
          // this.qualityAssessment = response.quality_assessment; // QA disabled
          setTimeout(() => this.highlightCodeBlocks(), 0);
          this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating Selenium script:', error);
        this.isLoading = false;
      }
    });
  }

  copyToClipboard(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.all = true;
      setTimeout(() => (this.copied.all = false), 2300);
    }).catch(() => {
      // fallback: show a dialog if clipboard fails
      this.dialogService.showToast('Could not copy to clipboard', 'Copy failed', 'error', 4);
    });
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

  private highlightCodeBlocks(): void {
    try {
      const blocks: NodeListOf<HTMLElement> = document.querySelectorAll('.code-block');
      blocks.forEach((b) => {
        const code = b as HTMLElement;
        const inner = code.innerText || '';
        const lang = 'language-java';
        code.innerHTML = `<code class="${lang}"></code>`;
        const created = code.querySelector('code') as HTMLElement;
        created.textContent = inner;
        if ((Prism as any).highlightElement) (Prism as any).highlightElement(created);
      });
    } catch (e) {
      // best-effort
    }
  }
}
