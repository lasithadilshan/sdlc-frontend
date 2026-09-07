import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Output, PLATFORM_ID } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UploadedDocument } from '../../app.component';
import { ApiService } from '../../services/api-service.service';
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
  @Output() activeTabChanged = new EventEmitter<number>();

  // hold latest generated user stories so they can be passed to other tabs
  generatedUserStories: any[] = [];
  selectedTabIndex = 0;
  isDarkMode = false;

  constructor(
    private apiService: ApiService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('sdlc-theme');
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      this.isDarkMode = savedTheme ? savedTheme === 'dark' : !!prefersDark;
      this.applyTheme();
    }

    this.apiService.selectedTabIndex$.subscribe((idx) => {
      if (typeof idx === 'number') {
        this.selectedTabIndex = idx;
        this.activeTabChanged.emit(idx);
      }
    });
  }

  onUserStoriesGenerated(stories: any[]): void {
    if (Array.isArray(stories)) {
      this.generatedUserStories = stories;
    } else if (stories) {
      this.generatedUserStories = [stories];
    } else {
      this.generatedUserStories = [];
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onTabChanged(index: number): void {
    this.selectedTabIndex = index;
    this.activeTabChanged.emit(index);
  }

  toggleThemeMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sdlc-theme', this.isDarkMode ? 'dark' : 'light');
    }
  }

  private applyTheme(): void {
    const body = this.document.body;
    body.classList.toggle('dark-theme', this.isDarkMode);
    body.classList.toggle('light-theme', !this.isDarkMode);
  }
}
