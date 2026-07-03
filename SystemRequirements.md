CRAWFORD UNIVERSITY
Faith City, Igbesa, Ogun State, Nigeria
Department of Computer Science
System Requirements Document
Project Title: A Web-Based Staff Appraisal Management System
Case Study: Crawford University, Nigeria
Version 3.0 | 2025

1. Introduction
This document outlines the system requirements for the development of a Web-Based Staff Appraisal Management System for Crawford University, Igbesa, Ogun State, Nigeria. It defines the functional and non-functional requirements, user roles, system features, and workflows that will guide the design and development of the platform.
The system is intended to digitize and centralize the staff appraisal process across all staff categories at Crawford University, replacing the current fragmented and manual approach with a structured, transparent, and efficient digital platform.

2. System Overview
The Web-Based Staff Appraisal Management System is a multi-role platform that supports the complete appraisal lifecycle for three categories of staff at Crawford University: Academic Staff, Non-Teaching Junior Staff, and Non-Teaching Senior Staff. The system manages appraisal form submission, multi-level assessment, dispute resolution, research and publication uploads (for academic staff only), promotion and increment workflows for both academic and non-academic staff, notifications, and institutional reporting.

3. User Roles and Permissions
The system shall support the following user roles, each with defined access rights and responsibilities:

3.1 Staff Member
Applicable to all staff categories (academic, junior non-teaching, and senior non-teaching). Staff members shall have the following permissions:
•	Log in and select their staff category (academic, junior non-teaching, senior non-teaching).
•	View their promotion and increment eligibility status and history.
•	Complete and submit their appraisal form based on their assigned category.
•	Academic Staff only: Upload research papers, publications, and professional documents at any time.
•	View their HOD or HOU assessment after the HOD or HOU has fully completed the assessment. (Only applicable to Non- Academic Staff)
•	College will view HOD or HOU assessment before Academic Staff can view. 
•	Validate or dispute HOD or HOU assessment by submitting a counter-comment.
•	Receive notifications regarding assessment completion, disputes, and deadlines.

3.2 Head of Department or Head of Unit (HOD / HOU)
The HOD or HOU is responsible for assessing staff within their department or unit. Where a department has no HOD due to size or other circumstances, the HOU shall assume the same responsibilities and access rights. HODs and HOUs shall have the following permissions:
•	Log in and access a list of all staff members within their department or unit.
•	Complete and submit appraisal assessments for their departmental staff using standardized grading scales.
•	Provide written feedback and recommendations for each staff member.
•	View counter-comments submitted by staff who dispute their assessment.
•	Complete and submit their own appraisal form (to be assessed by the Dean).
•	Upload their own research papers, publications, and professional documents (if academic).
•	Receive notifications regarding disputes, deadlines, and system updates.

3.3 Dean of College
The Dean is an Academic Staff member and holds the highest assessment authority within the college. The Dean shall have the following permissions:
•	Access and review all staff appraisals and HOD or HOU assessments within their college.
•	Resolve disputes submitted by staff who disagree with HOD or HOU assessments and submit final decisions on disputed appraisals.
•	Assess and evaluate the HOD or HOU appraisal form as the sole authorized assessor.
•	Complete and submit their own Academic Staff appraisal form (to be assessed by a higher body).
•	Upload their own research papers, publications, and professional documents.
•	Receive notifications for all disputes and HOD or HOU submissions requiring review.

3.4 College Appointments and Promotions Committee (A&PC)
This committee is responsible for reviewing eligible staff for promotion and increment. The committee shall have the following permissions:
•	View all staff appraisals, including assessed, flagged, approved, and disputed records.
•	Access and review research papers, publications, and supporting documents uploaded by academic staff, HODs, HOUs, and the Dean.
•	Identify and review staff eligible for promotion, increment, or both, based on defined eligibility criteria for each staff category.
•	Evaluate academic staff eligibility based on appraisal performance, APER scores, research output, publications, and all defined assessment criteria.
•	Evaluate non-academic staff eligibility based on years of experience, qualifications, and salary scale progression.
•	Make and record decisions: Promote, Increment, Both, Defer, or Reject.
•	Generate promotion and increment letters and notifications for approved staff.

3.5 System Administrator
The Administrator manages the overall system and user accounts. The Administrator shall have the following permissions:
•	Create, update, and deactivate user accounts for all roles.
•	Assign roles and permissions to users.
•	Set and manage appraisal deadlines and promotion cycle schedules.
•	Generate system-wide reports and analytics dashboards.
•	Monitor system activity and audit logs.
•	Manage system configurations and settings.

4. Functional Requirements

4.1 Authentication and Access Control
1.	The system shall provide a secure login page requiring a username and password.
2.	Upon login, staff members shall be prompted to select their staff category: Academic Staff, Non-Teaching Junior Staff, or Non-Teaching Senior Staff.
3.	The system shall automatically route each user to the correct appraisal form based on their selected category.
4.	The system shall implement role-based access control ensuring each user can only access features and data relevant to their assigned role.
5.	The system shall support password reset and account recovery functionality.

4.2 Appraisal Form Module
1.	The system shall provide three distinct appraisal form templates, each uniquely tailored to the corresponding staff category: Academic Staff, Non-Teaching Junior Staff, and Non-Teaching Senior Staff.
2.	Part One of each form shall capture the personal and professional details of the staff member as specified in the respective appraisal form, including full name, date of birth, marital status, staff level and rank, department and unit, academic qualifications, and other relevant information.
3.	Part Two of each form shall contain the HOD, HOU, or Dean assessment section, including:
•	General evaluation grades using radio buttons (A, B, C, D, E) for criteria relevant to each staff category.
•	Written recommendations by the HOD or HOU.
•	Staff validation or dispute section where the staff member can agree with or contest the HOD or HOU assessment.
4.	The system shall allow staff to save a draft of their form and return to complete it before the deadline.
5.	The system shall prevent submission of incomplete forms and display appropriate validation messages.
6.	Once submitted, Part One of the staff form shall be locked from further editing.

4.3 Assessment Workflow
1.	After a staff member submits their appraisal form, the HOD or HOU shall be notified to complete their assessment.
2.	The HOD or HOU shall assess the staff member using the grading scale provided and submit written feedback and recommendations.
3.	The staff member shall be able to view the HOD or HOU assessment only after the HOD or HOU has fully completed and submitted their appraisal assessment.
4.	The staff member shall have the option to validate the HOD or HOU assessment (agree) or submit a counter-comment (dispute).
5.	Disputed assessments shall be escalated to the Dean for resolution.
6.	The Dean shall review the dispute, consider both the HOD or HOU assessment and the staff counter-comment, and submit a final decision.
7.	The system shall maintain a complete audit trail of all assessment actions including timestamps and user details.

4.4 HOD and HOU Appraisal
1.	The HOD or HOU shall also complete their own appraisal form using the same format as their respective staff category.
2.	The Dean shall be the sole authorized user to assess and grade the HOD or HOU appraisal form.
3.	The same dispute and resolution workflow shall apply to the HOD or HOU appraisal if the HOD or HOU disputes the Dean's assessment.

4.5 Dean Appraisal
1.	The Dean, being an Academic Staff member, shall complete and submit the Academic Staff appraisal form.
2.	The Dean's appraisal form shall be assessed by a designated higher body whose details shall be incorporated upon confirmation.
3.	The same dispute and resolution workflow shall apply to the Dean's appraisal where applicable.

4.6 Research and Publications Upload Module (Academic Staff Only)
1.	Academic Staff members, HODs, HOUs (where academic), and the Dean shall be able to upload research papers, publications, and professional documents at any time throughout the year.
2.	Non-teaching staff (junior and senior) are not required to upload research or publications and shall not have access to this module.
3.	The system shall support common file formats including PDF, DOCX, and JPEG for uploads.
4.	Each uploaded document shall be tagged with the uploader's name, department, date of upload, and document type.
5.	Academic Staff shall be able to view and manage their own uploaded documents.
6.	The College Appointments and Promotions Committee shall be able to view all uploaded documents for academic staff under review.

4.7 Academic Staff Promotion and Increment Workflow
1.	The system shall track promotion and increment eligibility for academic staff based on a minimum three-year consecutive service period from the date of last promotion or first appointment.
2.	The system shall distinguish between three possible outcomes: Promotion only, Increment only, or both Promotion and Increment, depending on assessment results and committee decisions.
3.	Academic staff who are due for promotion or increment shall be automatically flagged and made visible to the College Appointments and Promotions Committee.
4.	The committee shall review the following before making a decision for academic staff:
•	Staff appraisal history and total APER scores
•	HOD or HOU assessment and written recommendations
•	Research papers and publications uploaded, scored according to the university publication scoring framework
•	Staff level, rank, and applicable minimum point thresholds
•	Teaching assessment scores from students, peers, and HOD
•	Research activity, thesis supervision, qualifications, community service, professional body membership, and administrative responsibilities
5.	The system shall enforce the following minimum overall score thresholds for academic promotion eligibility:

Cadre	Minimum Score (%)	Maximum Score
Assistant Lecturer	15	100
Lecturer II	25	100
Lecturer I	40	100
Senior Lecturer	55	100
Associate Professor	65	100
Professor	75	100

6.	The system shall calculate total assessment scores using the following factor weightings:

Assessment Factor	Maximum Points Obtainable
Publications	40
Teaching (quality + load + length of service)	20
Project/Thesis Supervision	10
Academic Qualification	10
Research (ongoing + patents/inventions)	5
Community Service	5
Professional Body Membership	5
Administrative Responsibilities	5
Total	100

7.	The system shall support accelerated promotion for candidates with groundbreaking globally recognized research output, provided the candidate has spent a minimum of 24 months in their current position.
8.	Promotion for academic staff shall take effect from October 1 of the session in which the candidate qualifies.
9.	The committee shall record one of the following decisions: Promote, Increment, Both, Defer, or Reject.
10.	Staff who are promoted or granted an increment shall receive an automated notification and the system shall update their staff level and grade accordingly.
11.	Deferred or rejected staff shall receive a notification with the committee's feedback.

4.8 Publication Scoring Module (Academic Staff Only)
The system shall implement the university's publication scoring framework to calculate a candidate's publication points based on uploaded documents. The following rules shall apply:

4.8.1 Publication Point Scoring Table
Publication Type	Sole / Lead Author (100%)	Co-Author (80%)
Journal Article	3	2.4
Refereed Book	4	3.2
Edited Book	3	2.4
Chapter in Book	2	1.6
Conference Proceedings	2	1.6
Conference Paper (Unpublished)	2	1.6
Review / Editorship of Book	1	0.8
Technical Report	1	0.8
Monograph (min. 60 pages)	2	1.6

4.8.2 Publication Score Calculation Formula
The system shall calculate Publication Points (PP) using the following formula:
Step 1 — Publication Total Score (PTS): PTS = (Sum of individual scores earned / Sum of available scores based on publication type) x Maximum Publication Score (C)
Step 2 — Publication Points (PP): PP = PTS / C x 40
Where C (Maximum Publication Score) is defined per cadre as follows:

Cadre	Maximum Publication Score (C)	Equivalent Journal Publications
Senior Lecturer	45	15 journal publications
Associate Professor	60	20 journal publications
Professor	75	25 journal publications

4.8.3 Minimum Publication Points Required per Rank
Rank	Minimum Publication Points (PP)
Lecturer II	10
Lecturer I	16
Senior Lecturer	22
Associate Professor	26
Professor	30

4.8.4 Minimum Academic Publications Required per Rank
Rank	Minimum Number of Publications	Min. APER Score
Assistant Lecturer to Lecturer II	2 publications	20%
Lecturer II to Lecturer I	5 publications	40%
Lecturer I to Senior Lecturer	15 publications	55%
Senior Lecturer to Associate Professor	20 publications	65%
Associate Professor to Professor	25 publications	75%

4.8.5 Additional Publication Rules
•	Journal articles must constitute at least 50% of total publications for Lecturer I and below, and at least 60% for Senior Lecturer and above.
•	A candidate shall not have more than 20% of their total publications in the same journal.
•	For Senior Lecturer, publication distribution shall be a maximum of 50% local, 30% national, and at least 10% international journals.
•	For professorial ranks, distribution shall be a maximum of 40% local, 30% national, and at least 25% international journals.
•	For Associate Professor, at least 20% of publications must be in international journals. For Professor, at least 25%.
•	For Senior Lecturer, the candidate must be lead author in at least 10% of publications. For Associate Professor, at least 15%. For Professor, at least 20%.
•	Publications in predatory or toxic journals shall not be accepted.
•	Letters of acceptance not appearing in print for over two years shall not be accepted for promotion consideration.
•	A book must not be less than 100 pages and must have an ISBN to be accepted.

4.9 Non-Academic Staff Promotion and Increment Workflow
The promotion structure for non-academic staff is based on years of experience in post, qualifications held, and salary scale (HATISS) progression. Unlike academic staff, non-academic staff are not assessed on publications or research output.

1.	The system shall track the promotion eligibility date for each non-academic staff member based on the required years of experience specified for their current cadre and designation.
2.	Non-academic staff who are due for promotion shall be automatically flagged and made visible to the College Appointments and Promotions Committee.
3.	The committee shall review the following before making a promotion decision for non-academic staff:
•	Current designation and salary scale (HATISS level)
•	Years of experience in current post
•	Qualifications held versus qualifications required for the next grade
•	Appraisal performance rating from HOD or HOU
4.	The system shall store and reference the qualification and experience requirements for each non-academic cadre, covering all 34 defined staff cadres including Administrative Officers, Accountants, Security Staff, Technical Officers, Laboratory Staff, and others as defined in the university's non-academic staff career promotion structure.
5.	The committee shall record one of the following decisions: Promote, Increment, Both, Defer, or Reject.
6.	Promoted non-academic staff shall receive an automated notification and the system shall update their designation and salary scale accordingly.
7.	Deferred or rejected staff shall receive a notification with the committee's feedback.

4.10 Notifications and Alerts
1.	The system shall send automated notifications to users at the following events:
•	Appraisal deadline reminders (sent 2 weeks and 3 days before the deadline)
•	HOD or HOU assessment completed — staff notified immediately
•	Staff dispute submitted — HOD, HOU, and Dean notified immediately
•	Dean dispute resolution submitted — staff and HOD or HOU notified
•	Promotion or increment eligibility approaching — staff notified 3 months in advance
•	Promotion or increment decision made — staff notified immediately
2.	Notifications shall be delivered via in-system alerts and email.

4.11 Analytics and Reporting Dashboard
1.	The system shall provide an analytics dashboard accessible to the Administrator and senior management.
2.	The dashboard shall display the following institutional insights:
•	Overall appraisal completion rates by department and staff category
•	Average performance scores by department
•	Number of disputes raised and resolution rates
•	Promotion and increment rates and trends over time
•	Research and publication output per department (academic staff only)
•	Staff performance distribution (percentage scoring A, B, C, D, E)
3.	The system shall allow administrators to generate and export appraisal reports in PDF or Excel format.
4.	Reports shall be filterable by department, staff category, appraisal year, and promotion cycle.

4.12 Data Management
1.	The system shall securely store all appraisal forms, assessment records, uploaded documents, and promotion and increment decisions.
2.	Historical appraisal records shall be maintained and accessible for reference by authorized users.
3.	The system shall maintain a complete audit log of all user actions including logins, submissions, edits, and approvals.

5. Non-Functional Requirements

5.1 Security
•	All user data shall be encrypted in transit using HTTPS/SSL protocols.
•	Passwords shall be stored using secure hashing algorithms.
•	The system shall enforce session timeouts after a period of inactivity.
•	Access to sensitive data shall be restricted strictly by user role.

5.2 Usability
•	The system shall have a clean, intuitive interface accessible to users with basic computer literacy.
•	The system shall be responsive and accessible on desktop and mobile browsers.
•	Error messages shall be clear and guide users on how to resolve issues.

5.3 Performance
•	The system shall load pages within three seconds under normal network conditions.
•	The system shall support concurrent access by multiple users without degradation in performance.

5.4 Reliability and Availability
•	The system shall be available 99% of the time during working hours.
•	Regular automated backups of all data shall be performed.

5.5 Scalability
•	The system shall be designed to accommodate growth in the number of users and data volume over time.

6. System Constraints
•	The system shall be web-based and accessible via standard web browsers (Chrome, Firefox, Edge, Safari).
•	The system requires a stable internet connection for full functionality.
•	File uploads shall be limited to a maximum size of 10MB per document.
•	The system shall be developed using standard web technologies compatible with Crawford University's existing IT infrastructure.

7. Assumptions
•	All staff members have access to a device with internet connectivity.
•	Crawford University will provide accurate staff data for initial system setup and user account creation.
•	The HOD and HOU appraisal form follows the same structure as the staff appraisal form unless otherwise specified by the supervisor.
•	Placeholder appraisal deadlines will be used during development and replaced with actual university dates upon deployment.
•	The promotion and increment cycle for academic staff is calculated from each staff member's date of last promotion or date of first appointment if never promoted.
•	Non-academic staff promotion eligibility is determined by years of experience in current post as specified per cadre in the university's non-academic staff career promotion structure.
•	The higher body responsible for assessing the Dean's appraisal will be confirmed and incorporated into the system at a later stage.
•	Only Academic Staff are subject to the publication scoring and research upload modules. Non-teaching staff are exempt from these requirements.

Crawford University | Igbesa, Ogun State, Nigeria | www.crawforduniversity.edu.ng
