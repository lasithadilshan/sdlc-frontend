import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { UploadedDocument } from '../../app.component';
import { ApiService } from '../../services/api-service.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Output() modelChanged = new EventEmitter<string>();
  @Output() fileUploaded = new EventEmitter<UploadedDocument>();

  selectedModel = 'Open AI GPT 4.1';
  models = ['Open AI GPT 4.1', 'Google Gemini 2.0 Flash'];
  selectedFile: File | null = null;
  isUploading = false;

  constructor(private apiService: ApiService) {}

  onModelChange(): void {
    this.modelChanged.emit(this.selectedModel);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.uploadFile();
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isUploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('model', this.selectedModel);

    this.apiService.uploadDocument(formData).subscribe({
      next: (response) => {
        const document: UploadedDocument = {
          documentId: response.document_id,
          filename: response.filename,
          model: this.selectedModel
        };
        this.fileUploaded.emit(document);
        this.isUploading = false;
        this.selectedFile = null;
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        this.isUploading = false;
      }
    });
  }
}
