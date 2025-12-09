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
  @Input() uploadedDocument: UploadedDocument | null = null;
  isLoading = false;
  userStories: any = null;
  qualityAssessment: any = null;
  processingTime: number | null = null;
  parseError: string | null = null;

  // For template rendering
  parsedUserStories: any[] = [];
  Array = Array;

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
}
