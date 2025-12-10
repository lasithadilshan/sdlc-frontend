import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://127.0.0.1:8000';

  // Shared state to pass selected test case text to other tabs
  private selectedTestCaseTextSubject = new BehaviorSubject<string>('');
  selectedTestCaseText$ = this.selectedTestCaseTextSubject.asObservable();
  
  // Shared state to pass selected test case text specifically to Selenium tab
  private selectedSeleniumTestCaseTextSubject = new BehaviorSubject<string>('');
  selectedSeleniumTestCaseText$ = this.selectedSeleniumTestCaseTextSubject.asObservable();

  // Shared state to request main content to switch tabs (emit tab index)
  private selectedTabIndexSubject = new BehaviorSubject<number>(0);
  selectedTabIndex$ = this.selectedTabIndexSubject.asObservable();

  constructor(private http: HttpClient) {}

  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload-document`, formData);
  }

  generateUserStories(documentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate-user-stories?document_id=${documentId}`, {});
  }

  convertToTestCases(documentId: string, userStoryText: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/convert-to-test-cases?document_id=${documentId}`, {
      user_story_text: userStoryText
    });
  }

  convertToCucumber(documentId: string, testCaseText: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/convert-to-cucumber?document_id=${documentId}`, {
      test_case_text: testCaseText
    });
  }

  convertToSelenium(documentId: string, testCaseText: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/convert-to-selenium?document_id=${documentId}`, {
      test_case_text: testCaseText
    });
  }

  // Update currently selected test case text (to be consumed by Cucumber tab)
  setSelectedTestCaseText(text: string): void {
    this.selectedTestCaseTextSubject.next(text || '');
  }

  // Update currently selected test case text (to be consumed by Selenium tab)
  setSelectedSeleniumTestCaseText(text: string): void {
    this.selectedSeleniumTestCaseTextSubject.next(text || '');
  }

  // Ask main content to switch to a given tab index
  setSelectedTabIndex(index: number): void {
    this.selectedTabIndexSubject.next(typeof index === 'number' ? index : 0);
  }
}
