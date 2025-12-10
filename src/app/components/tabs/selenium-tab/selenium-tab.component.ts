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
      this.dialogService.showToast('Copied to clipboard!', 'Copied', 'success', 3);
    });
  }
}
