# SDLC Mate - Frontend Application

SDLC Mate is an enterprise-grade AI-powered SDLC automation platform designed to accelerate requirements engineering and quality assurance workflows. Built with Angular 19, Angular Material, and modern responsive design patterns, SDLC Mate translates Business Requirement Documents (BRDs) into actionable User Stories, Test Cases, Cucumber (Gherkin) features, and Selenium automation scripts.

---

## Features

- **Document Processing & BRD Analysis**: Upload and analyze BRDs in multiple formats (`.pdf`, `.docx`, `.xlsx`, `.pptx`, `.txt`).
- **User Story Generation**: Deconstruct complex business requirements into standard user stories with acceptance criteria, priority indicators, and PDF export capabilities.
- **Test Case Generation**: Automatically derive comprehensive positive, negative, and edge test scenarios with preconditions, test data, step-by-step instructions, and expected results.
- **Cucumber (Gherkin) Test Automation**: Generate production-ready `.feature` files with BDD scenario outlines, background steps, and tagging (`@smoke`, `@regression`).
- **Selenium Automation Scripts**: Generate clean, Python-based Selenium automation scripts incorporating explicit waits, robust locators, and clean error handling.
- **Enterprise Security & SAST Validated**: Pre-configured and verified against SonarQube SAST, achieving a **PASSED** Quality Gate with 0 vulnerabilities, 0 security hotspots, and 0 code smells.

---

## Tech Stack

- **Framework**: Angular 19 (`standalone` components architecture)
- **UI & Components**: Angular Material, Modern CSS design system
- **Icons**: Material Symbols & Lucide-inspired SVG icon sets
- **Exporting**: jsPDF & html2canvas for client-side report and artifact generation
- **Code Quality & SAST**: SonarQube LTS (TypeScript AST parser, CSS analyzer, Web/HTML sensor)

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x or v20.x+ (Node 20 LTS recommended)
- **npm**: v9.x or v10.x+
- **Angular CLI**: v19.x (`npm install -g @angular/cli`)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd sdlc-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Run the development server locally:

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload if you change any of the source files.

### Production Build

To compile the application for production deployment:

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

---

## SonarQube SAST Code Analysis

The project includes pre-configured settings for SonarQube code security, vulnerability detection, and quality gates.

### 1. Start SonarQube (Docker)

```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
```

Once running, navigate to `http://localhost:9000` (default login: `admin` / `admin1`).

### 2. Run the SAST Scanner

Ensure you have generated an analysis token or provide credentials:

```bash
npx sonarqube-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin1
```

Or using an authentication token:

```bash
npx sonarqube-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=<YOUR_SONAR_TOKEN>
```

### Quality Gate Benchmark

- **Reliability Rating**: Grade A (0 bugs)
- **Security Rating**: Grade A (0 vulnerabilities)
- **Security Hotspots**: 100% reviewed (0 ReDoS vulnerabilities)
- **Maintainability Rating**: Grade A (0 code smells)
- **TypeScript Compatibility**: Custom `tsconfig.sonar.json` provided for clean AST program resolution.

---

## Project Structure

```
sdlc-frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── login/                 # Authentication & login view
│   │   │   ├── main-content/          # Master dashboard layout & BRD upload
│   │   │   ├── sidebar/               # Navigation & active model controls
│   │   │   └── tabs/                  # SDLC artifact workspaces
│   │   │       ├── user-story-tab/    # User Story generation & review
│   │   │       ├── test-case-tab/     # Test Case generation & verification
│   │   │       ├── cucumber-tab/      # Gherkin BDD script generator
│   │   │       └── selenium-tab/      # Python Selenium code generator
│   │   ├── interceptors/
│   │   │   └── jwt.interceptor.ts     # Bearer token HTTP interceptor
│   │   └── services/                  # REST API communication services
│   ├── environments/                  # Environment configurations
│   └── styles.css                     # Global design tokens and styles
├── sonar-project.properties           # SonarQube project analysis configuration
├── tsconfig.sonar.json                # TypeScript AST config for SonarQube 9.9 LTS
└── angular.json                       # Angular CLI workspace configuration
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
