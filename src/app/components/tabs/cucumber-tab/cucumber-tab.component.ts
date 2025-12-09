import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
export class CucumberTabComponent {
  @Input() uploadedDocument: UploadedDocument | null = null;

  testCaseText: string = '';
  isLoading = false;
  cucumberScript: string | null = null;
  qualityAssessment: any = null;
  processingTime: number | null = null;

  constructor(private apiService: ApiService) {}

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

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  }
}
