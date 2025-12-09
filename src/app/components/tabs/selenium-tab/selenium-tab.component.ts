import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api-service.service';
import { UploadedDocument } from '../../../app.component';

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
    FormsModule
  ],
  templateUrl: './selenium-tab.component.html',
  styleUrl: './selenium-tab.component.css'
})
export class SeleniumTabComponent {
  @Input() selectedModel: string = 'Open AI GPT 4.1';
  @Input() uploadedDocument: UploadedDocument | null = null;

  testCaseText: string = '';
  isLoading = false;
  seleniumScript: string | null = null;
  qualityAssessment: any = null;
  processingTime: number | null = null;

  constructor(private apiService: ApiService) {}

  generateSelenium(): void {
    if (!this.uploadedDocument || !this.testCaseText) {
      return;
    }

    this.isLoading = true;
    this.seleniumScript = null;
    this.qualityAssessment = null;
    this.processingTime = null;

    this.apiService.convertToSelenium(this.uploadedDocument.documentId, this.testCaseText, this.selectedModel).subscribe({
      next: (response) => {
        this.seleniumScript = response.selenium_script;
        this.qualityAssessment = response.quality_assessment;
        this.processingTime = response.processing_time_seconds;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating Selenium script:', error);
        this.isLoading = false;
      }
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  }
}
