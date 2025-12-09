import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UploadedDocument } from '../../app.component';
import { CucumberTabComponent } from '../tabs/cucumber-tab/cucumber-tab.component';
import { SeleniumTabComponent } from '../tabs/selenium-tab/selenium-tab.component';
import { TestCaseTabComponent } from '../tabs/test-case-tab/test-case-tab.component';
import { UserStoryTabComponent } from '../tabs/user-story-tab/user-story-tab.component';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    UserStoryTabComponent,
    TestCaseTabComponent,
    CucumberTabComponent,
    SeleniumTabComponent
  ],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.css'
})
export class MainContentComponent {
  @Input() uploadedDocument: UploadedDocument | null = null;
  @Input() isSidebarVisible = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
