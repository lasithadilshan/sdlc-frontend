import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
}
