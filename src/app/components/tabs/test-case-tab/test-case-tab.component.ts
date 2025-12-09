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
  selector: 'app-test-case-tab',
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
  templateUrl: './test-case-tab.component.html',
  styleUrl: './test-case-tab.component.css'
})
export class TestCaseTabComponent {
  @Input() selectedModel: string = 'Open AI GPT 4.1';
  @Input() uploadedDocument: UploadedDocument | null = null;

  userStoryText: string = '';
  isLoading = false;
  testCases: any = null;
  qualityAssessment: any = null;
  processingTime: number | null = null;
  parseError: any = null;

  constructor(private apiService: ApiService) {}

  generateTestCases(): void {
    if (!this.uploadedDocument || !this.userStoryText) {
      return;
    }

    this.isLoading = true;
    this.testCases = null;
    this.qualityAssessment = null;
    this.processingTime = null;

    this.apiService.convertToTestCases(this.uploadedDocument.documentId, this.userStoryText, this.selectedModel).subscribe({
      next: (response) => {
        this.testCases = response.test_cases;
        this.qualityAssessment = response.quality_assessment;
        this.processingTime = response.processing_time_seconds;
        this.parseError = response.parse_error || null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating test cases:', error);
        this.isLoading = false;
      }
    });
  }
}
