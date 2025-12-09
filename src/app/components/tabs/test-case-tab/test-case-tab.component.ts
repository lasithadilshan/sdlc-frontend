import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UploadedDocument } from '../../../app.component';
import { ApiService } from '../../../services/api-service.service';

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
  @Input() uploadedDocument: UploadedDocument | null = null;
  @Input() generatedUserStories: any[] | null = null;

  userStoryText: string = '';
  isLoading = false;
  testCases: any = null;
  qualityAssessment: any = null;
  processingTime: number | null = null;
  parseError: any = null;

  constructor(private apiService: ApiService) {}

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

  generateTestCases(): void {
    if (!this.uploadedDocument || !this.userStoryText) {
      return;
    }

    this.isLoading = true;
    this.testCases = null;
    this.qualityAssessment = null;
    this.processingTime = null;

    this.apiService.convertToTestCases(this.uploadedDocument.documentId, this.userStoryText).subscribe({
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
