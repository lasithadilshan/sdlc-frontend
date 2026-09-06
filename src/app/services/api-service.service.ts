import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as rxjs from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

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
    return this.http.post(`${this.apiUrl}/documents/upload`, formData);
  }

  generateUserStories(documentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate/user-stories?document_id=${documentId}`, {});
  }

  convertToTestCases(documentId: string, userStoryText: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate/test-cases?document_id=${documentId}`, {
      user_story_text: userStoryText
    });
  }

  convertToCucumber(documentId: string, testCaseText: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate/cucumber?document_id=${documentId}`, {
      test_case_text: testCaseText
    });
  }

  convertToSelenium(documentId: string, testCaseText: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate/selenium?document_id=${documentId}`, {
      test_case_text: testCaseText
    });
  }

  getJobStatus(jobId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/generate/job/${jobId}`);
  }

  pollJobStatus(jobId: string, intervalMs: number = 2000): Observable<any> {
    return rxjs.timer(0, intervalMs).pipe(
      rxjs.switchMap(() => this.getJobStatus(jobId)),
      rxjs.takeWhile(res => res.status !== 'SUCCESS' && res.status !== 'FAILURE', true),
      rxjs.filter(res => res.status === 'SUCCESS' || res.status === 'FAILURE')
    );
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
