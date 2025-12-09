import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload-document`, formData);
  }

  generateUserStories(documentId: string, model: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate-user-stories?document_id=${documentId}`, { model });
  }

  convertToTestCases(documentId: string, userStoryText: string, model: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/convert-to-test-cases?document_id=${documentId}`, {
      user_story_text: userStoryText,
      model
    });
  }

  convertToCucumber(documentId: string, testCaseText: string, model: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/convert-to-cucumber?document_id=${documentId}`, {
      test_case_text: testCaseText,
      model
    });
  }

  convertToSelenium(documentId: string, testCaseText: string, model: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/convert-to-selenium?document_id=${documentId}`, {
      test_case_text: testCaseText,
      model
    });
  }
}
