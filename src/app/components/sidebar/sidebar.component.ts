import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UploadedDocument } from '../../app.component';
import { ApiService } from '../../services/api-service.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Output() fileUploaded = new EventEmitter<UploadedDocument>();

  selectedFile: File | null = null;
  isUploading = false;
  // keep last uploaded document to display in the sidebar
  uploadedDocument: UploadedDocument | null = null;

  constructor(private apiService: ApiService) {}

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

    this.apiService.uploadDocument(formData).subscribe({
      next: (response) => {
        const document: UploadedDocument = {
          documentId: response.document_id,
          filename: response.filename
        };
        this.uploadedDocument = document;
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
