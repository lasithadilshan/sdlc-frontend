import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UploadedDocument } from '../../../app.component';
import { ApiService } from '../../../services/api-service.service';

@Component({
  selector: 'app-user-story-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './user-story-tab.component.html',
  styleUrl: './user-story-tab.component.css'
})
export class UserStoryTabComponent {
  @Input() selectedModel: string = 'Open AI GPT 4.1';
  @Input() uploadedDocument: UploadedDocument | null = null;

  isLoading = false;
  userStories: any = null;
  qualityAssessment: any = null;
  processingTime: number | null = null;
  parseError: any = null;

  constructor(private apiService: ApiService) {}

  generateUserStories(): void {
    if (!this.uploadedDocument) {
      return;
    }

    this.isLoading = true;
    this.userStories = null;
    this.qualityAssessment = null;
    this.processingTime = null;

    this.apiService.generateUserStories(this.uploadedDocument.documentId, this.selectedModel).subscribe({
      next: (response) => {
        this.userStories = response.user_stories;
        this.qualityAssessment = response.quality_assessment;
        this.processingTime = response.processing_time_seconds;
        this.parseError = response.parse_error || null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating user stories:', error);
        this.isLoading = false;
      }
    });
  }
}
