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

  isArray(obj: any): boolean {
    return Array.isArray(obj);
  }

  objectKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
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
        const rawTestCases = response.test_cases;
        this.qualityAssessment = response.quality_assessment;
        try {
          console.log('Quality Assessment:', typeof this.qualityAssessment === 'string' ? this.qualityAssessment : JSON.stringify(this.qualityAssessment, null, 2));
        } catch {
          console.log('Quality Assessment:', this.qualityAssessment);
        }
        this.processingTime = response.processing_time_seconds;
        this.parseError = response.parse_error || null;

        // If the API returned a string, try to parse it as JSON. If parsing fails,
        // keep the raw string and mark parseError so the template shows the raw text.
        const toArray = (val: any): any[] => {
          if (Array.isArray(val)) return val;
          if (val && typeof val === 'object') {
            if (Array.isArray(val.test_cases)) return val.test_cases;
            if (Array.isArray(val.testCases)) return val.testCases;
            if (Array.isArray(val.cases)) return val.cases;
            if (Array.isArray(val.items)) return val.items;
            // If it looks like a single test case object, wrap in array
            return [val];
          }
          return [];
        };

        let parsed: any = rawTestCases;
        if (typeof rawTestCases === 'string') {
          try {
            parsed = JSON.parse(rawTestCases);
          } catch (err: any) {
            this.testCases = rawTestCases;
            if (!this.parseError) {
              this.parseError = 'Response returned a non-JSON string (could not parse).';
            }
            this.isLoading = false;
            return;
          }
        }

        this.testCases = toArray(parsed);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating test cases:', error);
        this.isLoading = false;
      }
    });
  }

  // Serialize a single test case object into plain text suitable for Cucumber conversion
  private serializeTestCase(tc: any, index: number): string {
    const lines: string[] = [];
    const id = tc.id || tc.ID || `TC_${index + 1}`;
    const title = tc.title || tc.name || `Test Case ${index + 1}`;
    lines.push(`ID: ${id}`);
    lines.push(`Title: ${title}`);

    const preconditions = Array.isArray(tc.preconditions) ? tc.preconditions : (tc.preconditions ? [tc.preconditions] : []);
    if (preconditions.length) {
      lines.push('Preconditions:');
      preconditions.forEach((p: string) => lines.push(`- ${p}`));
    }

    const testData = Array.isArray(tc.test_data) ? tc.test_data : (tc.test_data ? [tc.test_data] : []);
    if (testData.length) {
      lines.push('Test Data:');
      testData.forEach((d: string) => lines.push(`- ${d}`));
    }

    const stepsArr = Array.isArray(tc.test_steps || tc.steps) ? (tc.test_steps || tc.steps) : ((tc.test_steps || tc.steps) ? [tc.test_steps || tc.steps] : []);
    if (stepsArr.length) {
      lines.push('Steps:');
      stepsArr.forEach((s: string, i: number) => lines.push(`${i + 1}. ${s}`));
    }

    const expectedArr = Array.isArray(tc.expected_results || tc.expected) ? (tc.expected_results || tc.expected) : ((tc.expected_results || tc.expected) ? [tc.expected_results || tc.expected] : []);
    const expectedSingle = tc.expected_result || tc.expectedResult;
    if (expectedArr.length || expectedSingle) {
      lines.push('Expected Results:');
      if (expectedArr.length) {
        expectedArr.forEach((e: string) => lines.push(`- ${e}`));
      } else {
        lines.push(`- ${expectedSingle}`);
      }
    }

    return lines.join('\n');
  }

  // Send a selected test case into the Cucumber tab's textarea
  sendToCucumber(tc: any, index: number = 0): void {
    try {
      const text = this.serializeTestCase(tc, index);
      this.apiService.setSelectedTestCaseText(text);
      alert('Test case sent to Cucumber tab.');
    } catch (e) {
      console.error('Failed to serialize and send test case:', e);
    }
  }

  // Send a selected test case into the Selenium tab's textarea
  sendToSelenium(tc: any, index: number = 0): void {
    try {
      const text = this.serializeTestCase(tc, index);
      this.apiService.setSelectedSeleniumTestCaseText(text);
      // request the main content to switch to the Selenium tab (index 3)
      this.apiService.setSelectedTabIndex(3);
      alert('Test case sent to Selenium tab. Navigating to Selenium tab...');
    } catch (e) {
      console.error('Failed to serialize and send test case to Selenium:', e);
    }
  }
}
