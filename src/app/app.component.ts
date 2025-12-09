import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MainContentComponent } from './components/main-content/main-content.component';

export interface UploadedDocument {
  documentId: string;
  filename: string;
  model: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    SidebarComponent,
    MainContentComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'sdlc-frontend';
  selectedModel: string = 'Open AI GPT 4.1';
  uploadedDocument: UploadedDocument | null = null;

  onModelChanged(model: string): void {
    this.selectedModel = model;
    // Clear uploaded document when model changes
    this.uploadedDocument = null;
  }

  onFileUploaded(document: UploadedDocument): void {
    this.uploadedDocument = document;
  }
}
